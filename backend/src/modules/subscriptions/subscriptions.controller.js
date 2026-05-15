const subscriptionsService = require('./subscriptions.service');

const getPlans = async (req, res, next) => {
  try {
    const plans = subscriptionsService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.getMySubscription(req.userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.subscribe(
      req.userId,
      req.body.plan,
      req.body.billing_cycle
    );
    res.status(201).json({ success: true, data: subscription, message: 'Suscripción activada' });
  } catch (error) {
    next(error);
  }
};

const upgrade = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.upgrade(req.userId, req.body.plan);
    res.json({ success: true, data: subscription, message: 'Plan actualizado' });
  } catch (error) {
    next(error);
  }
};

const downgrade = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.downgrade(req.userId, req.body.plan);
    res.json({ success: true, data: subscription, message: 'Plan actualizado' });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionsService.cancelSubscription(req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const reactivateSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionsService.reactivateSubscription(req.userId);
    res.json({ success: true, data: subscription, message: 'Suscripción reactivada' });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await subscriptionsService.getHistory(req.userId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
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
  getHistory
};