const Joi = require('joi');

const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'pending_verification').required(),
  reason: Joi.string().max(500).optional()
});

const updateListingStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'deleted').required(),
  reason: Joi.string().max(500).optional()
});

const resolveReportSchema = Joi.object({
  action: Joi.string().valid('approve', 'edit', 'delete').required(),
  notes: Joi.string().max(500).optional()
});

const applyDiscountSchema = Joi.object({
  coupon_code: Joi.string().required(),
  discount_percent: Joi.number().min(1).max(100).required()
});

const getAuditLogsSchema = Joi.object({
  admin_id: Joi.string().uuid().optional(),
  action: Joi.string().optional(),
  entity_type: Joi.string().optional(),
  entity_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

const getUsersQuerySchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().max(255).optional(),
  role: Joi.string().valid('tourist', 'host', 'admin', 'local_business').allow('').optional(),
  status: Joi.string().valid('active', 'suspended', 'pending_verification').allow('').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const getListingsQuerySchema = Joi.object({
  title: Joi.string().max(255).optional(),
  host_id: Joi.string().uuid().optional(),
  department: Joi.string().max(100).optional(),
  status: Joi.string().valid('active', 'paused', 'deleted').allow('').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const getReportsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'edited', 'removed').allow('').default('pending'),
  content_type: Joi.string().valid('listing', 'review').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const getSubscriptionsQuerySchema = Joi.object({
  plan: Joi.string().valid('basic', 'premium', 'pro').optional(),
  status: Joi.string().valid('active', 'cancelled', 'past_due', 'trialing').optional(),
  host_id: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  updateUserStatusSchema,
  updateListingStatusSchema,
  resolveReportSchema,
  applyDiscountSchema,
  getAuditLogsSchema,
  getUsersQuerySchema,
  getListingsQuerySchema,
  getReportsQuerySchema,
  getSubscriptionsQuerySchema
};