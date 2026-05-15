const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const {
  updateUserStatusSchema,
  updateListingStatusSchema,
  resolveReportSchema,
  applyDiscountSchema,
  getAuditLogsSchema
} = require('./admin.dto');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/subscriptions/metrics', adminController.getSubscriptionMetrics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', validateSchema(updateUserStatusSchema), adminController.updateUserStatus);
router.get('/listings', adminController.getListings);
router.put('/listings/:id/status', validateSchema(updateListingStatusSchema), adminController.updateListingStatus);
router.get('/reports', adminController.getReports);
router.put('/reports/:id', validateSchema(resolveReportSchema), adminController.resolveReport);
router.get('/subscriptions', adminController.getSubscriptions);
router.post('/subscriptions/:hostId/discount', validateSchema(applyDiscountSchema), adminController.applyDiscount);
router.get('/subscriptions/export', adminController.exportSubscriptions);
router.get('/audit-logs', validateSchema(getAuditLogsSchema), adminController.getAuditLogs);

module.exports = router;