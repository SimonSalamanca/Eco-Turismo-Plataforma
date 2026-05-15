const { Subscription, User, HostProfile, Listing, AuditLog } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');
const stripe = require('../../config/stripe');
const env = require('../../config/env');
const { cacheDelete, cacheDeletePattern } = require('../../config/redis');
const {
  sendSubscriptionConfirmationEmail,
  sendPlanChangeEmail,
  sendSubscriptionCancelledEmail
} = require('../../config/mailer');

const PLANS = {
  basic: { priceId: null, name: 'Básico' },
  premium: { priceId: 'price_premium_monthly', name: 'Premium' },
  pro: { priceId: 'price_pro_monthly', name: 'Pro' }
};

const getPlans = () => {
  return [
    { id: 'basic', name: 'Básico', price: 0, features: ['2 listings', '5 fotos', 'Sin badge'] },
    { id: 'premium', name: 'Premium', price: 49900, features: ['5 listings', '15 fotos', 'Badge premium', 'Prioridad en búsqueda'] },
    { id: 'pro', name: 'Pro', price: 99900, features: ['Listings ilimitados', '30 fotos', 'Badge pro', 'Máxima prioridad'] }
  ];
};

const getMySubscription = async (hostId) => {
  const subscription = await Subscription.findOne({
    where: { host_id: hostId, status: { [require('sequelize').Op.in]: ['active', 'trialing'] } }
  });

  return subscription;
};

const subscribe = async (hostId, plan, billingCycle = 'monthly') => {
  const user = await User.findByPk(hostId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  let hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  if (!hostProfile) {
    hostProfile = await HostProfile.create({ user_id: hostId });
  }

  let customerId = hostProfile.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.createCustomer(user.email, user.full_name, { user_id: hostId });
    customerId = customer.id;
    hostProfile.stripe_customer_id = customerId;
    await hostProfile.save();
  }

  const planInfo = PLANS[plan];
  if (!planInfo) {
    throw new AppError('Plan inválido', 400, 'INVALID_PLAN');
  }

  let subscription;

  if (plan === 'basic') {
    subscription = await Subscription.create({
      host_id: hostId,
      plan,
      billing_cycle: billingCycle,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    hostProfile.subscription_plan = plan;
    hostProfile.subscription_status = 'active';
    hostProfile.subscription_expires_at = subscription.current_period_end;
    await hostProfile.save();

    await updateListingsBadge(hostId, plan);
  } else if (planInfo.priceId) {
    const stripeSubscription = await stripe.createSubscription(customerId, planInfo.priceId);

    subscription = await Subscription.create({
      host_id: hostId,
      plan,
      billing_cycle: billingCycle,
      status: stripeSubscription.status === 'active' ? 'active' : 'trialing',
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: planInfo.priceId,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000)
    });

    hostProfile.subscription_plan = plan;
    hostProfile.subscription_status = stripeSubscription.status;
    hostProfile.subscription_expires_at = subscription.current_period_end;
    await hostProfile.save();

    await updateListingsBadge(hostId, plan);
  }

  await AuditLog.create({
    admin_id: hostId,
    action: 'subscription_created',
    entity_type: 'subscription',
    entity_id: subscription.id,
    new_value: { plan, billing_cycle: billingCycle }
  });

  const planFeatures = env.plans[plan]?.features || [];
  sendSubscriptionConfirmationEmail(user.email, user.full_name, plan, planFeatures).catch(err => {
    console.error('Error sending subscription confirmation email:', err.message);
  });

  return subscription;
};

const upgrade = async (hostId, newPlan) => {
  const subscription = await Subscription.findOne({
    where: { host_id: hostId, status: 'active' }
  });

  if (!subscription) {
    throw new AppError('No tienes suscripción activa', 400, 'NO_SUBSCRIPTION');
  }

  const currentOrder = { basic: 1, premium: 2, pro: 3 };
  if (currentOrder[newPlan] <= currentOrder[subscription.plan]) {
    throw new AppError('Solo puedes cambiar a un plan superior', 400, 'INVALID_UPGRADE');
  }

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });

  if (subscription.stripe_subscription_id && hostProfile.stripe_customer_id) {
    const newPlanInfo = PLANS[newPlan];
    if (newPlanInfo.priceId) {
      await stripe.updateSubscription(subscription.stripe_subscription_id, [
        { id: subscription.stripe_price_id, price: newPlanInfo.priceId }
      ]);
    }
  }

  subscription.plan = newPlan;
  await subscription.save();

  hostProfile.subscription_plan = newPlan;
  await hostProfile.save();

  await updateListingsBadge(hostId, newPlan);

  await AuditLog.create({
    admin_id: hostId,
    action: 'subscription_upgraded',
    entity_type: 'subscription',
    entity_id: subscription.id,
    old_value: { plan: subscription.plan },
    new_value: { plan: newPlan }
  });

  const user = await User.findByPk(hostId);
  sendPlanChangeEmail(user.email, user.full_name, subscription.plan, newPlan, true).catch(err => {
    console.error('Error sending plan change email:', err.message);
  });

  return subscription;
};

const downgrade = async (hostId, newPlan) => {
  const subscription = await Subscription.findOne({
    where: { host_id: hostId, status: 'active' }
  });

  if (!subscription) {
    throw new AppError('No tienes suscripción activa', 400, 'NO_SUBSCRIPTION');
  }

  subscription.plan = newPlan;
  await subscription.save();

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  hostProfile.subscription_plan = newPlan;
  await hostProfile.save();

  await updateListingsBadge(hostId, newPlan);

  await AuditLog.create({
    admin_id: hostId,
    action: 'subscription_downgraded',
    entity_type: 'subscription',
    entity_id: subscription.id,
    new_value: { plan: newPlan }
  });

  const user = await User.findByPk(hostId);
  sendPlanChangeEmail(user.email, user.full_name, subscription.plan, newPlan, false).catch(err => {
    console.error('Error sending plan change email:', err.message);
  });

  return subscription;
};

const cancelSubscription = async (hostId) => {
  const subscription = await Subscription.findOne({
    where: { host_id: hostId, status: 'active' }
  });

  if (!subscription) {
    throw new AppError('No tienes suscripción activa', 400, 'NO_SUBSCRIPTION');
  }

  if (subscription.stripe_subscription_id) {
    await stripe.cancelSubscription(subscription.stripe_subscription_id);
  }

  subscription.status = 'cancelled';
  subscription.cancelled_at = new Date();
  await subscription.save();

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  hostProfile.subscription_status = 'cancelled';
  await hostProfile.save();

  await AuditLog.create({
    admin_id: hostId,
    action: 'subscription_cancelled',
    entity_type: 'subscription',
    entity_id: subscription.id
  });

  const user = await User.findByPk(hostId);
  const endDate = subscription.current_period_end;
  sendSubscriptionCancelledEmail(user.email, user.full_name, subscription.plan, endDate).catch(err => {
    console.error('Error sending subscription cancelled email:', err.message);
  });

  return { message: 'Suscripción cancelada. Mantienes beneficios hasta el fin del período.' };
};

const reactivateSubscription = async (hostId) => {
  const subscription = await Subscription.findOne({
    where: { host_id: hostId, status: 'cancelled' }
  });

  if (!subscription) {
    throw new AppError('No tienes suscripción cancelada', 400, 'NO_CANCELLED_SUBSCRIPTION');
  }

  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  const planInfo = PLANS[subscription.plan];

  if (planInfo.priceId && hostProfile.stripe_customer_id) {
    const stripeSubscription = await stripe.createSubscription(
      hostProfile.stripe_customer_id,
      planInfo.priceId
    );

    subscription.stripe_subscription_id = stripeSubscription.id;
    subscription.status = stripeSubscription.status === 'active' ? 'active' : 'trialing';
    subscription.current_period_start = new Date();
    subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelled_at = null;
    await subscription.save();

    hostProfile.subscription_status = subscription.status;
    hostProfile.subscription_expires_at = subscription.current_period_end;
    await hostProfile.save();
  } else {
    subscription.status = 'active';
    subscription.cancelled_at = null;
    subscription.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subscription.save();

    hostProfile.subscription_status = 'active';
    hostProfile.subscription_expires_at = subscription.current_period_end;
    await hostProfile.save();
  }

  await updateListingsBadge(hostId, subscription.plan);

  return subscription;
};

const getHistory = async (hostId) => {
  const subscriptions = await Subscription.findAll({
    where: { host_id: hostId },
    order: [['created_at', 'DESC']]
  });

  return subscriptions;
};

const updateListingsBadge = async (hostId, plan) => {
  const badge = plan === 'pro' ? 'pro' : plan === 'premium' ? 'premium' : 'none';
  const searchBoost = env.plans[plan]?.search_boost || 0;

  await Listing.update(
    { badge, search_boost: searchBoost },
    { where: { host_id: hostId } }
  );

  await cacheDeletePattern('search:*');
};

const handleWebhook = async (event) => {
  switch (event.type) {
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
};

const handleSubscriptionUpdate = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: stripeSubscription.id }
  });

  if (subscription) {
    subscription.status = stripeSubscription.status;
    subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
    subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
    await subscription.save();

    const hostProfile = await HostProfile.findOne({ where: { user_id: subscription.host_id } });
    if (hostProfile) {
      hostProfile.subscription_status = stripeSubscription.status;
      hostProfile.subscription_expires_at = subscription.current_period_end;
      await hostProfile.save();
    }
  }
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: stripeSubscription.id }
  });

  if (subscription) {
    subscription.status = 'cancelled';
    await subscription.save();

    const hostProfile = await HostProfile.findOne({ where: { user_id: subscription.host_id } });
    if (hostProfile) {
      hostProfile.subscription_status = 'cancelled';
      await hostProfile.save();
    }
  }
};

const handlePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: invoice.subscription }
  });

  if (subscription) {
    const hostProfile = await HostProfile.findOne({ where: { user_id: subscription.host_id } });
    if (hostProfile) {
      hostProfile.subscription_status = 'active';
      hostProfile.subscription_expires_at = subscription.current_period_end;
      await hostProfile.save();
    }
  }
};

const handlePaymentFailed = async (invoice) => {
  const subscription = await Subscription.findOne({
    where: { stripe_subscription_id: invoice.subscription }
  });

  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();

    const hostProfile = await HostProfile.findOne({ where: { user_id: subscription.host_id } });
    if (hostProfile) {
      hostProfile.subscription_status = 'past_due';
      await hostProfile.save();
    }
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  subscribe,
  upgrade,
  downgrade,
  cancelSubscription,
  reactivateSubscription,
  getHistory,
  handleWebhook
};