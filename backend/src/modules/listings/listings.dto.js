const Joi = require('joi');

const createListingSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  type: Joi.string().valid('accommodation', 'activity').required(),
  description: Joi.string().max(2000).optional(),
  price_per_unit: Joi.number().integer().min(0).required(),
  capacity: Joi.number().integer().min(1).required(),
  categories: Joi.array().items(Joi.string()).optional(),
  address: Joi.string().max(500).optional(),
  department: Joi.string().max(100).optional(),
  municipality: Joi.string().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

const updateListingSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  price_per_unit: Joi.number().integer().min(0).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  address: Joi.string().max(500).optional(),
  department: Joi.string().max(100).optional(),
  municipality: Joi.string().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  status: Joi.string().valid('active', 'paused').optional()
});

const searchQuerySchema = Joi.object({
  type: Joi.string().valid('accommodation', 'activity').optional(),
  q: Joi.string().max(200).optional(),
  category: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  department: Joi.string().optional(),
  municipality: Joi.string().optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().valid(5, 10, 25, 50).optional(),
  price_min: Joi.number().integer().min(0).optional(),
  price_max: Joi.number().integer().min(0).optional(),
  check_in: Joi.date().iso().optional(),
  check_out: Joi.date().iso().optional(),
  capacity: Joi.number().integer().min(1).optional(),
  min_rating: Joi.number().min(1).max(5).optional(),
  sort: Joi.string().valid('relevance', 'price_asc', 'price_desc', 'rating').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

module.exports = {
  createListingSchema,
  updateListingSchema,
  searchQuerySchema
};