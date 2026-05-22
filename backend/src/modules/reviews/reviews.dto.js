const Joi = require('joi');

const createReviewSchema = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).required()
});

const respondReviewSchema = Joi.object({
  reply: Joi.string().max(500).required()
});

const reportReviewSchema = Joi.object({
  reason: Joi.string().max(500).required()
});

const listingReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const hostReviewsQuerySchema = Joi.object({
  listing_id: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

module.exports = {
  createReviewSchema,
  respondReviewSchema,
  reportReviewSchema,
  listingReviewsQuerySchema,
  hostReviewsQuerySchema
};