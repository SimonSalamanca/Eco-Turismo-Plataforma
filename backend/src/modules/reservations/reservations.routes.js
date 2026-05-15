const express = require('express');
const router = express.Router();
const reservationsController = require('./reservations.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { createReservationSchema, cancelReservationSchema, rejectReservationSchema } = require('./reservations.dto');

router.post('/', authenticate, validateSchema(createReservationSchema), reservationsController.createReservation);
router.get('/my', authenticate, reservationsController.getMyReservations);
router.get('/host', authenticate, reservationsController.getHostReservations);
router.get('/host/listing/:listingId', authenticate, reservationsController.getHostReservationsByListing);
router.get('/:id', authenticate, reservationsController.getReservation);
router.post('/:id/cancel', authenticate, validateSchema(cancelReservationSchema), reservationsController.cancelReservation);
router.post('/:id/confirm', authenticate, reservationsController.confirmReservation);
router.post('/:id/reject', authenticate, validateSchema(rejectReservationSchema), reservationsController.rejectReservation);

module.exports = router;