const Joi = require('joi');

const createReviewSchema = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).optional()
});

const respondReviewSchema = Joi.object({
  host_response: Joi.string().max(500).required()
});

const reportReviewSchema = Joi.object({
  reason: Joi.string().max(500).required()
});

module.exports = {
  createReviewSchema,
  respondReviewSchema,
  reportReviewSchema
};