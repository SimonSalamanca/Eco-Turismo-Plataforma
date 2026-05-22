const { Reservation, Listing, Availability, User, Payment, sequelize } = require('../../db/models');
const { AppError, ConflictError, ForbiddenError } = require('../../middleware/errorHandler.middleware');
const stripeService = require('../payments/payments.service');
const { sendReservationConfirmation } = require('../../config/mailer');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const env = require('../../config/env');

const generateConfirmationCode = () => {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
};

const createReservation = async (touristId, data) => {
  const listing = await Listing.findByPk(data.listing_id);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.status !== 'active') {
    throw new AppError('El listing no está disponible', 400, 'LISTING_NOT_AVAILABLE');
  }

  if (listing.capacity < data.guests_count) {
    throw new AppError(`La capacidad máxima es de ${listing.capacity} huéspedes`, 400, 'CAPACITY_EXCEEDED');
  }

  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    throw new AppError('La reserva debe ser de al menos una noche', 400, 'INVALID_DATES');
  }

  const existingReservations = await Reservation.findAll({
    where: {
      listing_id: data.listing_id,
      status: { [Op.in]: ['confirmed', 'pending'] },
      [Op.or]: [
        {
          check_in_date: { [Op.lte]: checkOut },
          check_out_date: { [Op.gte]: checkIn }
        }
      ]
    },
    lock: true
  });

  if (existingReservations.length > 0) {
    throw new ConflictError('Las fechas seleccionadas ya no están disponibles', 'RESERVATION_CONFLICT');
  }

  const availableDates = await Availability.findAll({
    where: {
      listing_id: data.listing_id,
      date: { [Op.between]: [checkIn, checkOut] },
      status: 'blocked'
    },
    lock: true
  });

  if (availableDates.length > 0) {
    throw new ConflictError('Algunas fechas no están disponibles', 'RESERVATION_CONFLICT');
  }

  const result = await sequelize.transaction(async (t) => {
    const currentReservation = await Reservation.findOne({
      where: {
        listing_id: data.listing_id,
        status: { [Op.in]: ['confirmed', 'pending'] },
        version: 0
      },
      lock: true,
      transaction: t
    });

    if (currentReservation) {
      throw new ConflictError('Las fechas seleccionadas ya no están disponibles', 'RESERVATION_CONFLICT');
    }

    const subtotal = listing.price_per_unit * nights * data.guests_count;
    const platformFee = Math.round(subtotal * env.platform.fee);
    const totalAmount = subtotal + platformFee;

    const confirmationCode = generateConfirmationCode();

    const reservation = await Reservation.create({
      listing_id: data.listing_id,
      tourist_id: touristId,
      host_id: listing.host_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guests_count: data.guests_count,
      subtotal,
      platform_fee: platformFee,
      total_amount: totalAmount,
      status: 'pending',
      confirmation_code: confirmationCode,
      version: 1
    }, { transaction: t });

    await Availability.update(
      {
        status: 'blocked',
        reservation_id: reservation.id
      },
      {
        where: {
          listing_id: data.listing_id,
          date: { [Op.between]: [checkIn, checkOut] },
          status: 'available'
        },
        transaction: t
      }
    );

return reservation;
    });

  const reservationWithRelations = await Reservation.findByPk(result.id, {
    include: [
      { model: Listing, as: 'listing', attributes: ['id', 'title'] }
    ]
  });

  const host = await User.findByPk(result.host_id);
  if (host && reservationWithRelations) {
    const notificationService = require('../notifications/notifications.service');
    await notificationService.sendNewReservationHost(host, reservationWithRelations);
  }

  return result;
};

const getMyReservations = async (touristId, status) => {
  const where = { tourist_id: touristId };
  if (status) where.status = status;

  const reservations = await Reservation.findAll({
    where,
    include: [
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title', 'type', 'photos', 'address']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return reservations;
};

const getHostReservations = async (hostId, status) => {
  const where = { host_id: hostId };
  if (status) where.status = status;

  const reservations = await Reservation.findAll({
    where,
    include: [
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title', 'type', 'photos', 'address']
      },
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'email', 'phone', 'profile_photo_url']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return reservations;
};

const getReservationById = async (reservationId, userId, userRole) => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title', 'type', 'photos', 'address', 'host_id']
      },
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'email', 'phone', 'profile_photo_url']
      },
      {
        model: User,
        as: 'hostUser',
        attributes: ['id', 'full_name', 'email', 'phone', 'profile_photo_url']
      }
    ]
  });

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  const isOwner = reservation.tourist_id === userId || reservation.host_id === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('No tienes permiso para ver esta reserva');
  }

  return reservation;
};

const cancelReservation = async (reservationId, userId, reason, userRole = 'tourist') => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      { model: User, as: 'tourist' },
      { model: User, as: 'hostUser' },
      { model: Listing, as: 'listing' }
    ]
  });

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  const isTourist = reservation.tourist_id === userId;
  const isHost = reservation.host_id === userId;
  const isAdmin = userRole === 'admin';

  if (!isTourist && !isHost && !isAdmin) {
    throw new ForbiddenError('No tienes permiso para cancelar esta reserva');
  }

  if (reservation.status === 'cancelled') {
    throw new AppError('La reserva ya está cancelada', 400, 'ALREADY_CANCELLED');
  }

  if (reservation.status === 'completed') {
    throw new AppError('No puedes cancelar una reserva completada', 400, 'CANNOT_CANCEL');
  }

  let cancelledBy = 'tourist';
  if (isHost) cancelledBy = 'host';
  if (isAdmin) cancelledBy = 'admin';

  const now = new Date();
  const checkInDate = new Date(reservation.check_in_date);
  const hoursBeforeCheckIn = (checkInDate - now) / (1000 * 60 * 60);
  
  let refundAmount = 0;
  let refundPolicy = '';

  if (hoursBeforeCheckIn > 48) {
    refundAmount = reservation.total_amount;
    refundPolicy = 'Reembolso total (cancelación con más de 48h de anticipación)';
  } else if (hoursBeforeCheckIn > 0) {
    refundAmount = 0;
    refundPolicy = 'Sin reembolso (cancelación con menos de 48h de anticipación)';
  } else {
    refundAmount = 0;
    refundPolicy = 'Sin reembolso - la fecha de check-in ya paso';
  }

  await sequelize.transaction(async (t) => {
    reservation.status = 'cancelled';
    reservation.cancellation_reason = reason || refundPolicy;
    reservation.cancelled_at = new Date();
    reservation.cancelled_by = cancelledBy;
    await reservation.save({ transaction: t });

    await Availability.update(
      {
        status: 'available',
        reservation_id: null
      },
      {
        where: {
          listing_id: reservation.listing_id,
          date: { [Op.between]: [reservation.check_in_date, reservation.check_out_date] },
          reservation_id: reservation.id
        },
        transaction: t
      }
    );

    if (refundAmount > 0 && reservation.stripe_payment_intent_id) {
      const refundResult = await stripeService.refundPayment(reservation.stripe_payment_intent_id);
      if (refundResult.success) {
        reservation.cancellation_reason = `${refundPolicy} - Reembolso procesado`;
      }
      await reservation.save({ transaction: t });
    }
  });

  const notificationService = require('../notifications/notifications.service');
  
  if (reservation.tourist) {
    await notificationService.sendCancellationNotice(
      reservation,
      { id: userId, full_name: reservation.tourist.full_name },
      refundPolicy,
      refundAmount
    );
  }

  if (reservation.hostUser) {
    await notificationService.sendCancellationNotice(
      reservation,
      { id: userId, full_name: isAdmin ? 'Administrador' : (isHost ? reservation.hostUser.full_name : reservation.tourist.full_name) },
      refundPolicy,
      0
    );
  }

  return { 
    message: 'Reserva cancelada exitosamente',
    refundPolicy,
    refundAmount
  };
};

const markAsCompleted = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];

  const reservations = await Reservation.findAll({
    where: {
      status: 'confirmed',
      check_out_date: { [Op.lte]: yesterdayDate }
    }
  });

  console.log(`[markAsCompleted] Encontradas ${reservations.length} reservas con check_out <= ${yesterdayDate}:`, reservations.map(r => ({ id: r.id, check_out: r.check_out_date })));

  for (const reservation of reservations) {
    reservation.status = 'completed';
    reservation.completed_at = new Date();
    await reservation.save();
  }

  return { count: reservations.length };
};

const completeReservation = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId);

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.status === 'completed') {
    throw new AppError('La reserva ya está completada', 400, 'ALREADY_COMPLETED');
  }

  if (reservation.status !== 'confirmed') {
    throw new AppError('Solo se pueden completar reservas confirmadas', 400, 'INVALID_STATUS');
  }

  reservation.status = 'completed';
  reservation.completed_at = new Date();
  await reservation.save();

  return reservation;
};

const confirmReservation = async (reservationId, hostId) => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      { model: User, as: 'tourist' },
      { model: Listing, as: 'listing' }
    ]
  });

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.host_id !== hostId) {
    throw new ForbiddenError('No tienes permiso para confirmar esta reserva');
  }

  if (reservation.status !== 'pending') {
    throw new AppError('La reserva ya no está pendiente', 400, 'INVALID_STATUS');
  }

  reservation.status = 'confirmed';
  await reservation.save();

  const existingPayment = await Payment.findOne({ where: { reservation_id: reservation.id } });
  if (existingPayment) {
    if (existingPayment.status === 'pending') {
      existingPayment.status = 'succeeded';
      await existingPayment.save();
    }
  } else {
    await Payment.create({
      reservation_id: reservation.id,
      tourist_id: reservation.tourist_id,
      amount: reservation.total_amount,
      platform_commission: reservation.platform_fee,
      host_payout: reservation.subtotal,
      currency: env.platform.currency,
      status: 'succeeded'
    });
  }

  const notificationService = require('../notifications/notifications.service');
  if (reservation.tourist) {
    await notificationService.sendReservationConfirmedNotice(reservation);
  }

  return {
    message: 'Reserva confirmada exitosamente',
    reservation
  };
};

const rejectReservation = async (reservationId, hostId, reason) => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      { model: User, as: 'tourist' },
      { model: Listing, as: 'listing' }
    ]
  });

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.host_id !== hostId) {
    throw new ForbiddenError('No tienes permiso para rechazar esta reserva');
  }

  if (reservation.status !== 'pending') {
    throw new AppError('La reserva ya no está pendiente', 400, 'INVALID_STATUS');
  }

  const now = new Date();
  const checkInDate = new Date(reservation.check_in_date);
  const hoursBeforeCheckIn = (checkInDate - now) / (1000 * 60 * 60);

  let refundAmount = 0;
  let refundPolicy = '';

  if (hoursBeforeCheckIn > 48) {
    refundAmount = reservation.total_amount;
    refundPolicy = 'Reembolso total - rechazo con mas de 48h de anticipacion';
  } else if (hoursBeforeCheckIn > 0) {
    refundAmount = 0;
    refundPolicy = 'Sin reembolso - rechazo con menos de 48h de anticipacion';
  } else {
    refundAmount = 0;
    refundPolicy = 'Sin reembolso - la fecha de check-in ya paso';
  }

  await sequelize.transaction(async (t) => {
    reservation.status = 'cancelled';
    reservation.cancellation_reason = reason || refundPolicy;
    reservation.cancelled_by = 'host';
    reservation.cancelled_at = new Date();
    await reservation.save({ transaction: t });

    await Availability.update(
      {
        status: 'available',
        reservation_id: null
      },
      {
        where: {
          listing_id: reservation.listing_id,
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

  const notificationService = require('../notifications/notifications.service');
  if (reservation.tourist) {
    await notificationService.sendReservationRejectedNotice(reservation, reason || refundPolicy);
  }

  return {
    message: 'Reserva rechazada',
    refundPolicy,
    refundAmount
  };
};

const getHostReservationsByListing = async (hostId, listingId) => {
  const listing = await Listing.findByPk(listingId);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId) {
    throw new ForbiddenError('No tienes permiso para ver las reservas de este listing');
  }

  const reservations = await Reservation.findAll({
    where: {
      listing_id: listingId,
      status: { [Op.in]: ['confirmed', 'pending', 'completed'] }
    },
    include: [
      {
        model: User,
        as: 'tourist',
        attributes: ['id', 'full_name', 'email', 'phone', 'profile_photo_url']
      }
    ],
    order: [['check_in_date', 'ASC']]
  });

  return reservations;
};

module.exports = {
  createReservation,
  getMyReservations,
  getHostReservations,
  getReservationById,
  cancelReservation,
  markAsCompleted,
  completeReservation,
  confirmReservation,
  rejectReservation,
  getHostReservationsByListing
};