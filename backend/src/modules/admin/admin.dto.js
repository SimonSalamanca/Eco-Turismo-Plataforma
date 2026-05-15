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
  action: Joi.string().valid('approved', 'edited', 'removed').required(),
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

module.exports = {
  updateUserStatusSchema,
  updateListingStatusSchema,
  resolveReportSchema,
  applyDiscountSchema,
  getAuditLogsSchema
};