const Joi = require('joi');

const createPaymentIntentSchema = Joi.object({
  reservation_id: Joi.string().uuid().required()
});

module.exports = {
  createPaymentIntentSchema
};