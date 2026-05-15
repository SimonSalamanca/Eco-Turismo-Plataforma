const Joi = require('joi');

const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional()
});

const updateHostProfileSchema = Joi.object({
  business_name: Joi.string().max(255).optional(),
  business_type: Joi.string().valid('accommodation', 'activity', 'both').optional(),
  department: Joi.string().max(100).optional(),
  municipality: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional()
});

const notificationPreferencesSchema = Joi.object({
  email: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
  reservation_confirmation: Joi.boolean().optional(),
  reservation_cancellation: Joi.boolean().optional(),
  new_review: Joi.boolean().optional(),
  payment_receipts: Joi.boolean().optional()
});

module.exports = {
  updateProfileSchema,
  updateHostProfileSchema,
  notificationPreferencesSchema
};