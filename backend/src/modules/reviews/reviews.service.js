const { Review, Reservation, Listing, User, ContentReport, sequelize } = require('../../db/models');
const { AppError, ForbiddenError, ConflictError } = require('../../middleware/errorHandler.middleware');
const { sendReviewNotification } = require('../../config/mailer');
const { Op } = require('sequelize');
const { cacheDelete } = require('../../config/redis');

const createReview = async (touristId, data) => {
  const reservation = await Reservation.findByPk(data.reservation_id);

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.tourist_id !== touristId) {
    throw new ForbiddenError('No tienes permiso para reseñar esta reserva');
  }

  if (reservation.status !== 'completed') {
    throw new AppError('Solo puedes reseñar reservas completadas', 400, 'INVALID_STATUS');
  }

  const existingReview = await Review.findOne({
    where: { reservation_id: data.reservation_id }
  });

  if (existingReview) {
    throw new ConflictError('Ya has reseñado esta reserva', 'REVIEW_EXISTS');
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

  const listing = await Listing.findByPk(reservation.listing_id);
  const host = await User.findByPk(listing.host_id);

  if (host) {
    await sendReviewNotification(host.email, listing.title, data.rating);
  }

  await cacheDelete(`listing:${reservation.listing_id}`);

  return review;
};

const getListingReviews = async (listingId) => {
  const reviews = await Review.findAll({
    where: { listing_id: listingId, is_published: true },
    include: [
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'profile_photo_url']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return reviews;
};

const respondToReview = async (reviewId, hostId, response) => {
  const review = await Review.findByPk(reviewId, {
    include: [{ model: Listing, as: 'listing' }]
  });

  if (!review) {
    throw new AppError('Reseña no encontrada', 404, 'NOT_FOUND');
  }

  if (review.listing.host_id !== hostId) {
    throw new ForbiddenError('Solo el anfitrión puede responder');
  }

  if (review.host_response) {
    throw new ConflictError('Ya has respondido a esta reseña', 'ALREADY_RESPONDED');
  }

  review.host_response = response;
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
  respondToReview,
  reportReview
};