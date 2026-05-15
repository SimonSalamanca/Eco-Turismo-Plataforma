const { Listing, User, HostProfile, Availability, Reservation, sequelize } = require('../../db/models');
const { AppError, ConflictError } = require('../../middleware/errorHandler.middleware');
const { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } = require('../../config/redis');
const env = require('../../config/env');
const { Op } = require('sequelize');
const geocodingService = require('../../services/geocoding.service');

const createListing = async (hostId, data) => {
  const user = await User.findByPk(hostId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  if (user.role !== 'host' && user.role !== 'local_business' && user.role !== 'admin') {
    throw new AppError('No tienes permiso para crear listings', 403, 'FORBIDDEN');
  }

  let listingData = { ...data };

  if (data.address && (!data.latitude || !data.longitude)) {
    try {
      const geoResult = await geocodingService.geocodeAddress(data.address);
      listingData.latitude = geoResult.latitude;
      listingData.longitude = geoResult.longitude;
      if (!listingData.department && geoResult.department) {
        listingData.department = geoResult.department;
      }
      if (!listingData.municipality && geoResult.municipality) {
        listingData.municipality = geoResult.municipality;
      }
    } catch (geoError) {
      console.warn('Geocodificación fallida:', geoError.message);
    }
  }

  if ((data.latitude && data.longitude) && (data.department || data.municipality)) {
    try {
      const geoResult = await geocodingService.reverseGeocode(data.latitude, data.longitude);
      if (!listingData.department && geoResult.department) {
        listingData.department = geoResult.department;
      }
      if (!listingData.municipality && geoResult.municipality) {
        listingData.municipality = geoResult.municipality;
      }
    } catch (geoError) {
      console.warn('Reverse geocodificación fallida:', geoError.message);
    }
  }

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  const plan = hostProfile?.subscription_plan || 'basic';
  const planLimits = env.plans[plan];

  const listingCount = await Listing.count({ where: { host_id: hostId, status: { [Op.ne]: 'deleted' } } });
  if (planLimits.listings && listingCount >= planLimits.listings) {
    throw new AppError(`Límite de listings alcanzado para el plan ${plan}`, 400, 'PLAN_LIMIT');
  }

  const listing = await Listing.create({
    ...listingData,
    host_id: hostId,
    badge: plan === 'pro' ? 'pro' : plan === 'premium' ? 'premium' : 'none',
    search_boost: env.plans[plan]?.search_boost || 0
  });

  await cacheDeletePattern('search:*');

  return listing;
};

const getListingById = async (id) => {
  const cacheKey = `listing:${id}`;
  let listing = await cacheGet(cacheKey);

  if (!listing) {
    listing = await Listing.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } },
      include: [
        { model: User, as: 'host', attributes: ['id', 'full_name', 'profile_photo_url'] }
      ]
    });

    if (!listing) {
      throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
    }

    await cacheSet(cacheKey, listing.toJSON(), 300);
  }

  return listing;
};

const searchListings = async (params) => {
  const { page = 1, limit = 20, sort = 'relevance' } = params;
  const cacheParams = { ...params };
  delete cacheParams.page;
  delete cacheParams.limit;
  delete cacheParams.sort;
  const cacheKey = `search:${JSON.stringify(cacheParams)}:${page}:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  const where = { status: 'active' };

  if (params.type) where.type = params.type;
  if (params.department) where.department = params.department;
  if (params.municipality) where.municipality = params.municipality;
  if (params.price_min) where.price_per_unit = { ...where.price_per_unit, [Op.gte]: params.price_min };
  if (params.price_max) where.price_per_unit = { ...where.price_per_unit, [Op.lte]: params.price_max };
  if (params.capacity) where.capacity = { [Op.gte]: params.capacity };
  if (params.min_rating) where.average_rating = { [Op.gte]: params.min_rating };

  if (params.q) {
    const searchTerm = params.q.trim();
    where[Op.or] = [
      { title: { [Op.iLike]: `%${searchTerm}%` } },
      { description: { [Op.iLike]: `%${searchTerm}%` } },
      { municipality: { [Op.iLike]: `%${searchTerm}%` } },
      { department: { [Op.iLike]: `%${searchTerm}%` } },
      { address: { [Op.iLike]: `%${searchTerm}%` } }
    ];
  }

  if (params.category) {
    where.categories = { [Op.contains]: [params.category] };
  }

  let order;
  switch (sort) {
    case 'price_asc':
      order = [['price_per_unit', 'ASC']];
      break;
    case 'price_desc':
      order = [['price_per_unit', 'DESC']];
      break;
    case 'rating':
      order = [['average_rating', 'DESC'], ['review_count', 'DESC']];
      break;
    default:
      order = [['search_boost', 'DESC'], ['created_at', 'DESC']];
  }

  if (params.check_in && params.check_out) {
    const overlapping = await Reservation.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'pending'] },
        [Op.or]: [
          { check_in_date: { [Op.between]: [params.check_in, params.check_out] } },
          { check_out_date: { [Op.between]: [params.check_in, params.check_out] } }
        ]
      },
      attributes: ['listing_id']
    });

    const bookedIds = overlapping.map(r => r.listing_id);
    if (bookedIds.length > 0) {
      where.id = { [Op.notIn]: bookedIds };
    }
  }

  let listings;
  if (params.lat && params.lng && params.radius) {
    listings = await Listing.findAll({
      where,
      include: [
        { model: User, as: 'host', attributes: ['id', 'full_name', 'profile_photo_url'] }
      ],
      order
    });

    const radiusKm = params.radius;
    listings = listings.filter(l => {
      if (!l.latitude || !l.longitude) return false;
      const distance = calculateHaversineDistance(
        params.lat, params.lng,
        parseFloat(l.latitude), parseFloat(l.longitude)
      );
      return distance <= radiusKm;
    });

    const start = (page - 1) * limit;
    listings = listings.slice(start, start + limit);
  } else {
    const offset = (page - 1) * limit;
    listings = await Listing.findAndCountAll({
      where,
      include: [
        { model: User, as: 'host', attributes: ['id', 'full_name', 'profile_photo_url'] }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    listings = {
      data: listings.rows,
      total: listings.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(listings.count / limit)
    };
  }

  const result = {
    success: true,
    data: params.lat ? listings : listings.data,
    pagination: params.lat ? { page: parseInt(page), limit: parseInt(limit), total: listings.length } : listings.pagination
  };

  await cacheSet(cacheKey, result, 300);

  return result;
};

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * Math.PI / 180;

const getListingsMap = async (params) => {
  const where = { status: 'active' };
  if (params.type) where.type = params.type;
  if (params.department) where.department = params.department;

  const listings = await Listing.findAll({
    where,
    attributes: ['id', 'latitude', 'longitude', 'type', 'price_per_unit', 'average_rating', 'title', 'photos'],
    raw: true
  });

  return listings.filter(l => l.latitude && l.longitude);
};

const updateListing = async (id, hostId, data) => {
  const listing = await Listing.findByPk(id);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId && req.user?.role !== 'admin') {
    throw new AppError('No tienes permiso para editar este listing', 403, 'FORBIDDEN');
  }

  await listing.update(data);
  await cacheDelete(`listing:${id}`);
  await cacheDeletePattern('search:*');

  return listing;
};

const deleteListing = async (id, hostId, isAdmin = false) => {
  const listing = await Listing.findByPk(id);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (!isAdmin && listing.host_id !== hostId) {
    throw new AppError('No tienes permiso para eliminar este listing', 403, 'FORBIDDEN');
  }

  const today = new Date().toISOString().split('T')[0];
  
  const futureReservations = await Reservation.findAll({
    where: {
      listing_id: id,
      status: { [Op.in]: ['pending', 'confirmed'] },
      check_in_date: { [Op.gte]: today }
    },
    include: [
      { model: User, as: 'tourist', attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'hostUser', attributes: ['id', 'full_name', 'email'] }
    ]
  });

  const now = new Date();
  const cancelledReservations = [];

  for (const reservation of futureReservations) {
    const checkInDate = new Date(reservation.check_in_date);
    const hoursBeforeCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    let refundPolicy = '';

    if (hoursBeforeCheckIn > 48) {
      refundAmount = reservation.total_amount;
      refundPolicy = 'Reembolso total (cancelación por eliminación del listing)';
    } else if (hoursBeforeCheckIn > 0) {
      refundAmount = 0;
      refundPolicy = 'Sin reembolso (cancelación con menos de 48h de anticipación)';
    } else {
      refundAmount = 0;
      refundPolicy = 'Sin reembolso (la fecha de check-in ya pasó)';
    }

    await sequelize.transaction(async (t) => {
      reservation.status = 'cancelled';
      reservation.cancellation_reason = 'listing_deleted';
      reservation.cancelled_by = 'admin';
      reservation.cancelled_at = new Date();
      await reservation.save({ transaction: t });

      await Availability.update(
        {
          status: 'available',
          reservation_id: null
        },
        {
          where: {
            listing_id: id,
            date: { [Op.between]: [reservation.check_in_date, reservation.check_out_date] },
            reservation_id: reservation.id
          },
          transaction: t
        }
      );

      if (refundAmount > 0 && reservation.stripe_payment_intent_id) {
        const stripeService = require('../payments/payments.service');
        const refundResult = await stripeService.refundPayment(reservation.stripe_payment_intent_id);
        if (refundResult.success) {
          reservation.cancellation_reason = `${refundPolicy} - Reembolso procesado`;
          await reservation.save({ transaction: t });
        }
      }
    });

    cancelledReservations.push({
      reservationId: reservation.id,
      touristEmail: reservation.tourist?.email,
      touristName: reservation.tourist?.full_name,
      checkInDate: reservation.check_in_date,
      refundPolicy,
      refundAmount
    });
  }

  listing.status = 'deleted';
  await listing.save();

  await cacheDelete(`listing:${id}`);
  await cacheDeletePattern('search:*');

  const notificationService = require('../notifications/notifications.service');
  for (const cancelled of cancelledReservations) {
    if (cancelled.touristEmail) {
      await notificationService.sendListingDeletedNotice(
        cancelled.touristName,
        cancelled.touristEmail,
        listing.title,
        cancelled.checkInDate,
        cancelled.refundPolicy,
        cancelled.refundAmount
      );
    }
  }

  return { 
    message: 'Listing eliminado',
    cancelledReservations: cancelledReservations.length,
    details: cancelledReservations
  };
};

const getMyListings = async (hostId, status) => {
  const where = { host_id: hostId };
  if (status) where.status = status;

  const listings = await Listing.findAll({
    where,
    include: [
      { model: User, as: 'host', attributes: ['id', 'full_name'] }
    ],
    order: [['created_at', 'DESC']]
  });

  return listings;
};

const addPhotos = async (listingId, hostId, photos) => {
  const listing = await Listing.findByPk(listingId);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId) {
    throw new AppError('No tienes permiso para editar este listing', 403, 'FORBIDDEN');
  }

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  const plan = hostProfile?.subscription_plan || 'basic';
  const maxPhotos = env.plans[plan].photos;

  const currentPhotos = listing.photos || [];
  if (currentPhotos.length + photos.length > maxPhotos) {
    throw new AppError(`Límite de ${maxPhotos} fotos alcanzado para el plan ${plan}`, 400, 'PLAN_LIMIT');
  }

  const newPhotos = photos.map((photo, index) => ({
    url: photo.url,
    order: currentPhotos.length + index,
    is_cover: currentPhotos.length === 0 && index === 0
  }));

  listing.photos = [...currentPhotos, ...newPhotos];
  await listing.save();

  await cacheDelete(`listing:${listingId}`);
  await cacheDeletePattern('search:*');

  return listing;
};

const deletePhoto = async (listingId, photoId, hostId) => {
  const listing = await Listing.findByPk(listingId);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId) {
    throw new AppError('No tienes permiso para editar este listing', 403, 'FORBIDDEN');
  }

  const photos = listing.photos.filter(p => p.id !== photoId);
  listing.photos = photos;
  await listing.save();

  await cacheDelete(`listing:${listingId}`);

  return listing;
};

const getFeaturedListings = async () => {
  const listings = await Listing.findAll({
    where: { status: 'active' },
    include: [
      { 
        model: User, 
        as: 'host', 
        attributes: ['id', 'full_name', 'profile_photo_url'],
        include: [
          { model: HostProfile, as: 'hostProfile', attributes: ['subscription_plan', 'subscription_status'] }
        ]
      }
    ],
    order: [['search_boost', 'DESC'], ['average_rating', 'DESC'], ['created_at', 'DESC']],
    limit: 10
  });

  const premiumListings = listings.filter(listing => {
    const hostProfile = listing.host?.hostProfile;
    return hostProfile && 
           ['premium', 'pro'].includes(hostProfile.subscription_plan) && 
           hostProfile.subscription_status === 'active';
  });

  return premiumListings;
};

const getTopRatedListings = async (limit = 3) => {
  const listings = await Listing.findAll({
    where: { status: 'active', average_rating: { [Op.gte]: 4 } },
    include: [
      { model: User, as: 'host', attributes: ['id', 'full_name', 'profile_photo_url'] }
    ],
    order: [['average_rating', 'DESC'], ['review_count', 'DESC']],
    limit
  });

  return listings;
};

const getHostDashboardStats = async (hostId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [properties, reservations, monthlyIncome, ratingData] = await Promise.all([
    Listing.count({ where: { host_id: hostId, status: { [Op.ne]: 'deleted' } } }),
    Reservation.count({
      where: { host_id: hostId, status: { [Op.in]: ['confirmed', 'pending'] } }
    }),
    sequelize.query(`
      SELECT COALESCE(SUM(p.host_payout), 0) as total
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.id
      WHERE r.host_id = :hostId
        AND p.status = 'succeeded'
        AND p.created_at BETWEEN :startDate AND :endDate
    `, {
      replacements: {
        hostId,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT COALESCE(AVG(r.rating), 0) as avgRating, COUNT(r.id) as reviewCount
      FROM reviews r
      JOIN listings l ON r.listing_id = l.id
      WHERE l.host_id = :hostId
    `, {
      replacements: { hostId },
      type: sequelize.QueryTypes.SELECT
    })
  ]);

  const totalReservations = await Reservation.count({
    where: { host_id: hostId }
  });

  return {
    properties,
    activeReservations: reservations,
    monthlyIncome: parseInt(monthlyIncome[0]?.total || 0),
    rating: parseFloat(ratingData[0]?.avgRating || 0).toFixed(1),
    totalReservations,
    reviewCount: parseInt(ratingData[0]?.reviewCount || 0)
  };
};

const getHostCalendarAvailability = async (hostId) => {
  const listings = await Listing.findAll({
    where: { host_id: hostId, status: { [Op.ne]: 'deleted' } },
    attributes: ['id', 'title', 'photos'],
    raw: true
  });

  const listingIds = listings.map(l => l.id);

  const confirmedReservations = await Reservation.findAll({
    where: {
      listing_id: { [Op.in]: listingIds },
      status: 'confirmed',
      check_out_date: { [Op.gte]: new Date() }
    },
    attributes: ['id', 'listing_id', 'check_in_date', 'check_out_date', 'guests_count'],
    raw: true
  });

  const blockedDates = await Availability.findAll({
    where: {
      listing_id: { [Op.in]: listingIds },
      status: 'blocked',
      date: { [Op.gte]: new Date() }
    },
    attributes: ['id', 'listing_id', 'date'],
    raw: true
  });

  const result = listings.map(listing => ({
    id: listing.id,
    title: listing.title,
    photos: listing.photos,
    reservations: confirmedReservations
      .filter(r => r.listing_id === listing.id)
      .map(r => ({
        id: r.id,
        checkIn: r.check_in_date,
        checkOut: r.check_out_date,
        guests: r.guests_count
      })),
    blockedDates: blockedDates
      .filter(b => b.listing_id === listing.id)
      .map(b => b.date)
  }));

  return result;
};

module.exports = {
  createListing,
  getListingById,
  searchListings,
  getFeaturedListings,
  getTopRatedListings,
  getListingsMap,
  updateListing,
  deleteListing,
  getMyListings,
  addPhotos,
  deletePhoto,
  getHostDashboardStats,
  getHostCalendarAvailability
};