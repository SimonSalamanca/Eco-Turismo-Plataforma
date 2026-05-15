const paymentsService = require('./payments.service');
const stripe = require('../../config/stripe');
const env = require('../../config/env');

const createPaymentIntent = async (req, res, next) => {
  try {
    const result = await paymentsService.createPaymentIntent(req.body.reservation_id, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let payload = req.body;

    if (Buffer.isBuffer(payload)) {
      payload = payload.toString('utf-8');
    }

    const event = stripe.constructWebhookEvent(payload, sig);

    await paymentsService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    res.status(400).json({ error: 'Webhook error', message: error.message });
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await paymentsService.getMyPayments(req.userId);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await paymentsService.getPaymentReceipt(req.params.id, req.userId);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getMyPayments,
  getPaymentReceipt
};