const { Review, Reservation, Listing, User, ContentReport, sequelize } = require('../../db/models');
const { AppError, ForbiddenError, ConflictError } = require('../../middleware/errorHandler.middleware');
const { sendReviewNotification } = require('../../config/mailer');
const { Op } = require('sequelize');
const { cacheDelete } = require('../../config/redis');

const createReview = async (touristId, data) => {
  const reservation = await Reservation.findByPk(data.reservation_id, {
    include: [
      { model: Listing, as: 'listing', attributes: ['id', 'title', 'host_id'] }
    ]
  });

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.tourist_id !== touristId) {
    throw new ForbiddenError('No tienes permiso para reseñar esta reserva');
  }

  if (reservation.status !== 'completed') {
    throw new AppError('Solo puedes calificar experiencias completadas', 400, 'INVALID_STATUS');
  }

  const existingReview = await Review.findOne({
    where: { reservation_id: data.reservation_id }
  });

  if (existingReview) {
    throw new ConflictError('Ya calificaste esta experiencia', 'REVIEW_EXISTS');
  }

  const review = await sequelize.transaction(async (t) => {
    const newReview = await Review.create({
      reservation_id: data.reservation_id,
      listing_id: reservation.listing_id,
      tourist_id: touristId,
      rating: data.rating,
      comment: data.comment
    }, { transaction: t });

    const stats = await Review.findOne({
      where: { listing_id: reservation.listing_id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      raw: true,
      transaction: t
    });

    await Listing.update(
      {
        average_rating: parseFloat(stats.avgRating || 0).toFixed(1),
        review_count: parseInt(stats.count || 0)
      },
      { where: { id: reservation.listing_id }, transaction: t }
    );

    return newReview;
  });

  const tourist = await User.findByPk(touristId, { attributes: ['full_name'] });
  const host = await User.findByPk(reservation.listing.host_id, { attributes: ['email'] });

  if (host) {
    const excerpt = data.comment
      ? data.comment.substring(0, 150) + (data.comment.length > 150 ? '...' : '')
      : '';

    await sendReviewNotification({
      email: host.email,
      listingTitle: reservation.listing.title,
      rating: data.rating,
      touristName: tourist?.full_name || 'Un turista',
      commentExcerpt: excerpt,
      hostDashboardUrl: '/host/dashboard'
    });
  }

  await cacheDelete(`listing:${reservation.listing_id}`);

  return review;
};

const getListingReviews = async (listingId, query) => {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const where = { listing_id: listingId, is_published: true };

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'profile_photo_url']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  const avgResult = await Review.findOne({
    where: { listing_id: listingId, is_published: true },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avg']
    ],
    raw: true
  });

  return {
    summary: {
      average_rating: parseFloat(avgResult?.avg || 0),
      total_reviews: count
    },
    reviews: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / limit)
    }
  };
};

const getMyReviews = async (touristId) => {
  const reviews = await Review.findAll({
    where: { tourist_id: touristId },
    include: [
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title', 'photos']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return reviews.map(r => ({
    ...r.toJSON(),
    listing: r.listing
      ? { ...r.listing.toJSON(), photo: r.listing.photos?.[0] || null }
      : null
  }));
};

const getHostReviews = async (hostId, query) => {
  const { listing_id, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const hostListings = await Listing.findAll({
    where: { host_id: hostId },
    attributes: ['id'],
    raw: true
  });
  const listingIds = hostListings.map(l => l.id);

  if (listingIds.length === 0) {
    return { data: [], pagination: { total: 0, page: 1, limit: 10, total_pages: 0 } };
  }

  const where = { listing_id: { [Op.in]: listingIds } };
  if (listing_id) where.listing_id = listing_id;

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'profile_photo_url']
      },
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title']
      }
    ],
    order: [
      [sequelize.literal('"host_response" IS NULL'), 'DESC'],
      ['created_at', 'DESC']
    ],
    limit: parseInt(limit),
    offset
  });

  return {
    data: rows.map(r => ({
      ...r.toJSON(),
      has_response: r.host_response !== null
    })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(count / limit)
    }
  };
};

const respondToReview = async (reviewId, hostId, reply) => {
  const review = await Review.findByPk(reviewId, {
    include: [{ model: Listing, as: 'listing' }]
  });

  if (!review) {
    throw new AppError('Reseña no encontrada', 404, 'NOT_FOUND');
  }

  if (review.listing.host_id !== hostId) {
    throw new ForbiddenError('Solo el anfitrión dueño del listing puede responder');
  }

  if (review.host_response) {
    throw new ConflictError('Ya respondiste esta reseña', 'ALREADY_RESPONDED');
  }

  review.host_response = reply;
  review.host_responded_at = new Date();
  await review.save();

  return review;
};

const reportReview = async (reviewId, reporterId, reason) => {
  const review = await Review.findByPk(reviewId);

  if (!review) {
    throw new AppError('Reseña no encontrada', 404, 'NOT_FOUND');
  }

  const existingReport = await ContentReport.findOne({
    where: {
      reporter_id: reporterId,
      content_type: 'review',
      content_id: reviewId
    }
  });

  if (existingReport) {
    throw new ConflictError('Ya has reportado esta reseña', 'REPORT_EXISTS');
  }

  const report = await ContentReport.create({
    reporter_id: reporterId,
    content_type: 'review',
    content_id: reviewId,
    reason,
    status: 'pending'
  });

  return report;
};

module.exports = {
  createReview,
  getListingReviews,
  getMyReviews,
  getHostReviews,
  respondToReview,
  reportReview
};