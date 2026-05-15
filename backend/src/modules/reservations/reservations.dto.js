const Joi = require('joi');

const createReservationSchema = Joi.object({
  listing_id: Joi.string().uuid().required(),
  check_in_date: Joi.date().iso().required(),
  check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).required(),
  guests_count: Joi.number().integer().min(1).required()
});

const cancelReservationSchema = Joi.object({
  reason: Joi.string().max(500).optional()
});

const rejectReservationSchema = Joi.object({
  reason: Joi.string().max(500).optional()
});

module.exports = {
  createReservationSchema,
  cancelReservationSchema,
  rejectReservationSchema
};