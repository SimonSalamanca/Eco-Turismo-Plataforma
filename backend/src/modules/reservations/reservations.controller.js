const reservationsService = require('./reservations.service');

const createReservation = async (req, res, next) => {
  try {
    const reservation = await reservationsService.createReservation(req.userId, req.body);
    res.status(201).json({ success: true, data: reservation, message: 'Reserva creada exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await reservationsService.getMyReservations(req.userId, req.query.status);
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const getHostReservations = async (req, res, next) => {
  try {
    const reservations = await reservationsService.getHostReservations(req.userId, req.query.status);
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationsService.getReservationById(
      req.params.id,
      req.userId,
      req.userRole
    );
    res.json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const result = await reservationsService.cancelReservation(
      req.params.id,
      req.userId,
      req.body.reason,
      req.userRole
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const confirmReservation = async (req, res, next) => {
  try {
    const result = await reservationsService.confirmReservation(req.params.id, req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const rejectReservation = async (req, res, next) => {
  try {
    const result = await reservationsService.rejectReservation(
      req.params.id,
      req.userId,
      req.body.reason || 'Rechazada por el anfitrión'
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getHostReservationsByListing = async (req, res, next) => {
  try {
    const reservations = await reservationsService.getHostReservationsByListing(
      req.userId,
      req.params.listingId
    );
    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getHostReservations,
  getReservation,
  cancelReservation,
  confirmReservation,
  rejectReservation,
  getHostReservationsByListing
};