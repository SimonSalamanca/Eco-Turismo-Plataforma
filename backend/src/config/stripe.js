const Stripe = require('stripe');
const env = require('./env');

const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: env.stripe.apiVersion
});

const createCustomer = async (email, name, metadata = {}) => {
  return await stripe.customers.create({
    email,
    name,
    metadata
  });
};

const createSubscription = async (customerId, priceId) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
};

const cancelSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.cancel(subscriptionId);
};

const createPaymentIntent = async (amount, currency, metadata) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true }
  });
};

const constructWebhookEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
};

const getSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

const updateSubscription = async (subscriptionId, items) => {
  return await stripe.subscriptions.update(subscriptionId, { items });
};

module.exports = {
  stripe,
  createCustomer,
  createSubscription,
  cancelSubscription,
  createPaymentIntent,
  constructWebhookEvent,
  getSubscription,
  updateSubscription
};