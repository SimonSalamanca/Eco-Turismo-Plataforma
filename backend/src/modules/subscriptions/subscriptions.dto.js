const Joi = require('joi');

const subscribeSchema = Joi.object({
  plan: Joi.string().valid('basic', 'premium', 'pro').required(),
  billing_cycle: Joi.string().valid('monthly', 'annual').optional()
});

module.exports = {
  subscribeSchema
};