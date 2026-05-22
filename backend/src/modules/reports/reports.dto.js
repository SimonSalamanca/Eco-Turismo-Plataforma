const Joi = require('joi');

const createReportSchema = Joi.object({
  target_type: Joi.string().valid('listing', 'review').required(),
  target_id: Joi.string().uuid().required(),
  reason: Joi.string().valid('inappropriate', 'spam', 'fake', 'other').required(),
  description: Joi.string().max(1000).optional()
});

module.exports = {
  createReportSchema
};
