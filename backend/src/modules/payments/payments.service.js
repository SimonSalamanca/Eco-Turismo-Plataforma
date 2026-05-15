const { Payment, Reservation, Listing, User, sequelize } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');
const stripe = require('../../config/stripe');
const { sendReservationConfirmation } = require('../../config/mailer');
const env = require('../../config/env');

const createPaymentIntent = async (reservationId, touristId) => {
  const reservation = await Reservation.findByPk(reservationId);

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404, 'NOT_FOUND');
  }

  if (reservation.tourist_id !== touristId) {
    throw new AppError('No tienes permiso para pagar esta reserva', 403, 'FORBIDDEN');
  }

  if (reservation.status !== 'pending') {
    throw new AppError('La reserva ya no está pendiente de pago', 400, 'INVALID_STATUS');
  }

  const paymentIntent = await stripe.createPaymentIntent(
    reservation.total_amount,
    env.platform.currency,
    {
      reservation_id: reservation.id,
      tourist_id: touristId
    }
  );

  reservation.stripe_payment_intent_id = paymentIntent.id;
  await reservation.save();

  await Payment.create({
    reservation_id: reservation.id,
    tourist_id: touristId,
    stripe_payment_intent_id: paymentIntent.id,
    amount: reservation.total_amount,
    platform_commission: reservation.platform_fee,
    host_payout: reservation.subtotal,
    currency: env.platform.currency,
    status: 'pending'
  });

  return {
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id
  };
};

const handleWebhook = async (event) => {
  console.log(`[Webhook] Processing event: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
};

const handleSubscriptionUpdate = async (stripeSubscription) => {
  try {
    const subscriptionsService = require('../subscriptions/subscriptions.service');
    await subscriptionsService.handleWebhook({
      type: 'customer.subscription.updated',
      data: { object: stripeSubscription }
    });
  } catch (error) {
    console.error('[Webhook] Error handling subscription update:', error.message);
  }
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  try {
    const subscriptionsService = require('../subscriptions/subscriptions.service');
    await subscriptionsService.handleWebhook({
      type: 'customer.subscription.deleted',
      data: { object: stripeSubscription }
    });
  } catch (error) {
    console.error('[Webhook] Error handling subscription deletion:', error.message);
  }
};

const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    const subscriptionsService = require('../subscriptions/subscriptions.service');
    await subscriptionsService.handleWebhook({
      type: 'invoice.payment_succeeded',
      data: { object: invoice }
    });
  } catch (error) {
    console.error('[Webhook] Error handling invoice payment succeeded:', error.message);
  }
};

const handleInvoicePaymentFailed = async (invoice) => {
  try {
    const subscriptionsService = require('../subscriptions/subscriptions.service');
    await subscriptionsService.handleWebhook({
      type: 'invoice.payment_failed',
      data: { object: invoice }
    });
  } catch (error) {
    console.error('[Webhook] Error handling invoice payment failed:', error.message);
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  const { reservation_id, tourist_id } = paymentIntent.metadata;

  const reservation = await Reservation.findByPk(reservation_id, {
    include: [
      { model: Listing, as: 'listing' },
      { model: User, as: 'tourist' },
      { model: User, as: 'hostUser' }
    ]
  });

  if (!reservation) return;

  await sequelize.transaction(async (t) => {
    reservation.status = 'confirmed';
    await reservation.save({ transaction: t });

    await Payment.update(
      { status: 'succeeded' },
      {
        where: { stripe_payment_intent_id: paymentIntent.id },
        transaction: t
      }
    );
  });

  await sendReservationConfirmation(reservation.tourist.email, reservation, reservation.listing, reservation.tourist);
  await sendReservationConfirmation(reservation.hostUser.email, reservation, reservation.listing, reservation.tourist);
};

const handlePaymentFailed = async (paymentIntent) => {
  const { reservation_id } = paymentIntent.metadata;

  const reservation = await Reservation.findByPk(reservation_id);
  if (!reservation) return;

  reservation.status = 'cancelled';
  reservation.cancellation_reason = 'Pago fallido';
  await reservation.save();

  await Payment.update(
    { status: 'failed' },
    { where: { stripe_payment_intent_id: paymentIntent.id } }
  );
};

const handleRefund = async (charge) => {
  const paymentIntentId = charge.payment_intent;

  const payment = await Payment.findOne({
    where: { stripe_payment_intent_id: paymentIntentId }
  });

  if (payment) {
    payment.status = 'refunded';
    await payment.save();
  }
};

const refundPayment = async (paymentIntentId) => {
  try {
    await stripe.stripe.refunds.create({
      payment_intent: paymentIntentId
    });
    return { success: true };
  } catch (error) {
    console.error('Refund error:', error.message);
    return { success: false, error: error.message };
  }
};

const getMyPayments = async (touristId) => {
  const payments = await Payment.findAll({
    where: { tourist_id: touristId },
    include: [
      {
        model: Reservation,
        as: 'reservation',
        include: [
          { model: Listing, as: 'listing' }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return payments;
};

const getPaymentReceipt = async (paymentId, userId) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: Reservation,
        as: 'reservation',
        include: [
          { model: Listing, as: 'listing' },
          { model: User, as: 'tourist' }
        ]
      }
    ]
  });

  if (!payment) {
    throw new AppError('Pago no encontrado', 404, 'NOT_FOUND');
  }

  if (payment.tourist_id !== userId) {
    throw new AppError('No tienes permiso para ver este comprobante', 403, 'FORBIDDEN');
  }

  return payment;
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  refundPayment,
  getMyPayments,
  getPaymentReceipt
};