const express = require('express');
const router = express.Router();
const subscriptionsController = require('./subscriptions.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { subscribeSchema } = require('./subscriptions.dto');

router.get('/plans', subscriptionsController.getPlans);
router.get('/my', authenticate, subscriptionsController.getMySubscription);
router.post('/subscribe', authenticate, validateSchema(subscribeSchema), subscriptionsController.subscribe);
router.post('/upgrade', authenticate, subscriptionsController.upgrade);
router.post('/downgrade', authenticate, subscriptionsController.downgrade);
router.delete('/cancel', authenticate, subscriptionsController.cancelSubscription);
router.post('/reactivate', authenticate, subscriptionsController.reactivateSubscription);
router.get('/history', authenticate, subscriptionsController.getHistory);

module.exports = router;