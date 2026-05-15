const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { createPaymentIntentSchema } = require('./payments.dto');

router.post('/create-intent', authenticate, validateSchema(createPaymentIntentSchema), paymentsController.createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentsController.handleWebhook);
router.get('/my', authenticate, paymentsController.getMyPayments);
router.get('/:id/receipt', authenticate, paymentsController.getPaymentReceipt);

module.exports = router;