const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validateSchema, validateQuery } = require('../../utils/validation.utils');
const {
  updateUserStatusSchema,
  updateListingStatusSchema,
  resolveReportSchema,
  applyDiscountSchema,
  getAuditLogsSchema,
  getUsersQuerySchema,
  getListingsQuerySchema,
  getReportsQuerySchema,
  getSubscriptionsQuerySchema
} = require('./admin.dto');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/subscriptions/metrics', adminController.getSubscriptionMetrics);

router.get('/users', validateQuery(getUsersQuerySchema), adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.patch('/users/:id/status', validateSchema(updateUserStatusSchema), adminController.updateUserStatus);

router.get('/listings', validateQuery(getListingsQuerySchema), adminController.getListings);
router.patch('/listings/:id/status', validateSchema(updateListingStatusSchema), adminController.updateListingStatus);

router.get('/reports', validateQuery(getReportsQuerySchema), adminController.getReports);
router.get('/reports/:id', adminController.getReportDetail);
router.patch('/reports/:id/resolve', validateSchema(resolveReportSchema), adminController.resolveReport);

router.get('/subscriptions', validateQuery(getSubscriptionsQuerySchema), adminController.getSubscriptions);
router.get('/subscriptions/:hostId', adminController.getHostSubscriptionHistory);
router.post('/subscriptions/:hostId/discount', validateSchema(applyDiscountSchema), adminController.applyDiscount);
router.get('/subscriptions/export', adminController.exportSubscriptions);

router.get('/audit-logs', validateQuery(getAuditLogsSchema), adminController.getAuditLogs);

module.exports = router;