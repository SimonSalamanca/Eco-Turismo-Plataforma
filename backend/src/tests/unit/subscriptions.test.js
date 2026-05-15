const subscriptionsService = require('../../modules/subscriptions/subscriptions.service');
const { sequelize, User, HostProfile, Subscription, Listing, AuditLog } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');

jest.mock('../../config/stripe', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test_123' }),
  createSubscription: jest.fn().mockResolvedValue({
    id: 'sub_test_123',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
  }),
  cancelSubscription: jest.fn().mockResolvedValue({ id: 'sub_test_123', status: 'canceled' }),
  updateSubscription: jest.fn().mockResolvedValue({ id: 'sub_test_123', status: 'active' })
}));

jest.mock('../../config/redis', () => ({
  cacheDelete: jest.fn().mockResolvedValue(true),
  cacheDeletePattern: jest.fn().mockResolvedValue(true)
}));

describe('Subscriptions Service - Unit Tests', () => {
  let hostUser, hostProfile;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    hostUser = await User.create({
      email: `host.sub.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Subscription Host',
      role: 'host',
      status: 'active'
    });

    hostProfile = await HostProfile.create({
      user_id: hostUser.id,
      business_name: 'Test Business',
      business_type: 'accommodation',
      subscription_plan: 'basic',
      subscription_status: 'active'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Subscription.destroy({ where: {}, force: true });
    await Listing.destroy({ where: {}, force: true });
    await AuditLog.destroy({ where: {}, force: true });
  });

  describe('getPlans', () => {
    it('should return all available plans', () => {
      const plans = subscriptionsService.getPlans();

      expect(plans.length).toBe(3);
      expect(plans.find(p => p.id === 'basic')).toBeDefined();
      expect(plans.find(p => p.id === 'premium')).toBeDefined();
      expect(plans.find(p => p.id === 'pro')).toBeDefined();
    });

    it('should include correct pricing for each plan', () => {
      const plans = subscriptionsService.getPlans();

      const basic = plans.find(p => p.id === 'basic');
      expect(basic.price).toBe(0);

      const premium = plans.find(p => p.id === 'premium');
      expect(premium.price).toBe(49900);

      const pro = plans.find(p => p.id === 'pro');
      expect(pro.price).toBe(99900);
    });

    it('should include correct features for each plan', () => {
      const plans = subscriptionsService.getPlans();

      const basic = plans.find(p => p.id === 'basic');
      expect(basic.features).toContain('2 listings');
      expect(basic.features).toContain('5 fotos');

      const premium = plans.find(p => p.id === 'premium');
      expect(premium.features).toContain('Badge premium');

      const pro = plans.find(p => p.id === 'pro');
      expect(pro.features).toContain('Listings ilimitados');
      expect(pro.features).toContain('Badge pro');
    });
  });

  describe('subscribe', () => {
    it('should create basic subscription (free)', async () => {
      const subscription = await subscriptionsService.subscribe(hostUser.id, 'basic', 'monthly');

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe('basic');
      expect(subscription.status).toBe('active');
      expect(subscription.host_id).toBe(hostUser.id);
    });

    it('should create premium subscription with Stripe', async () => {
      const subscription = await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      expect(subscription.plan).toBe('premium');
      expect(subscription.stripe_subscription_id).toBeDefined();
    });

    it('should reject invalid plan', async () => {
      await expect(subscriptionsService.subscribe(hostUser.id, 'invalid_plan', 'monthly'))
        .rejects.toThrow('Plan inválido');
    });

    it('should create host profile if not exists', async () => {
      const newHost = await User.create({
        email: `new.${Date.now()}@example.com`,
        password_hash: '$2b$12$hashed',
        full_name: 'New Host',
        role: 'host',
        status: 'active'
      });

      const subscription = await subscriptionsService.subscribe(newHost.id, 'basic', 'monthly');
      expect(subscription).toBeDefined();
    });
  });

  describe('getMySubscription', () => {
    it('should return active subscription for host', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const subscription = await subscriptionsService.getMySubscription(hostUser.id);

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe('premium');
    });

    it('should return null if no active subscription', async () => {
      const subscription = await subscriptionsService.getMySubscription(hostUser.id);
      expect(subscription).toBeNull();
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade from basic to premium', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'basic', 'monthly');

      const upgraded = await subscriptionsService.upgradeSubscription(hostUser.id, 'premium');

      expect(upgraded.plan).toBe('premium');
    });

    it('should upgrade from premium to pro', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const upgraded = await subscriptionsService.upgradeSubscription(hostUser.id, 'pro');

      expect(upgraded.plan).toBe('pro');
    });

    it('should not allow downgrade as upgrade', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'pro', 'monthly');

      await expect(subscriptionsService.upgradeSubscription(hostUser.id, 'basic'))
        .rejects.toThrow();
    });
  });

  describe('downgradeSubscription', () => {
    it('should downgrade from pro to premium', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'pro', 'monthly');

      const subscription = await Subscription.findOne({
        where: { host_id: hostUser.id, status: 'active' }
      });
      subscription.stripe_subscription_id = 'sub_test_123';
      await subscription.save();

      const downgraded = await subscriptionsService.downgradeSubscription(hostUser.id, 'premium');
      expect(downgraded.plan).toBe('premium');
    });

    it('should downgrade from premium to basic', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const subscription = await Subscription.findOne({
        where: { host_id: hostUser.id, status: 'active' }
      });
      subscription.stripe_subscription_id = 'sub_test_123';
      await subscription.save();

      const downgraded = await subscriptionsService.downgradeSubscription(hostUser.id, 'basic');
      expect(downgraded.plan).toBe('basic');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription and maintain until period end', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const subscription = await Subscription.findOne({
        where: { host_id: hostUser.id, status: 'active' }
      });
      subscription.stripe_subscription_id = 'sub_test_123';
      await subscription.save();

      const cancelled = await subscriptionsService.cancelSubscription(hostUser.id);

      expect(cancelled).toBeDefined();
      expect(cancelled.cancelled_at).toBeDefined();
    });

    it('should create audit log on cancellation', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const subscription = await Subscription.findOne({
        where: { host_id: hostUser.id, status: 'active' }
      });
      subscription.stripe_subscription_id = 'sub_test_123';
      await subscription.save();

      await subscriptionsService.cancelSubscription(hostUser.id);

      const auditLogs = await AuditLog.findAll({
        where: { entity_type: 'subscription', action: 'cancel' }
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate cancelled subscription', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const subscription = await Subscription.findOne({
        where: { host_id: hostUser.id, status: 'active' }
      });
      subscription.stripe_subscription_id = 'sub_test_123';
      subscription.status = 'cancelled';
      subscription.cancelled_at = new Date();
      await subscription.save();

      const reactivated = await subscriptionsService.reactivateSubscription(hostUser.id);
      expect(reactivated.status).toBe('active');
    });
  });

  describe('Plan Limits', () => {
    it('should have correct limits for basic plan', () => {
      const { plans } = require('../../config/env');

      expect(plans.basic.photos).toBe(5);
      expect(plans.basic.listings).toBe(2);
      expect(plans.basic.badge).toBe('none');
      expect(plans.basic.search_boost).toBe(0);
    });

    it('should have correct limits for premium plan', () => {
      const { plans } = require('../../config/env');

      expect(plans.premium.photos).toBe(15);
      expect(plans.premium.listings).toBe(5);
      expect(plans.premium.badge).toBe('premium');
      expect(plans.premium.search_boost).toBe(1);
    });

    it('should have correct limits for pro plan', () => {
      const { plans } = require('../../config/env');

      expect(plans.pro.photos).toBe(30);
      expect(plans.pro.listings).toBeNull();
      expect(plans.pro.badge).toBe('pro');
      expect(plans.pro.search_boost).toBe(2);
    });
  });

  describe('Listing Badge Updates', () => {
    it('should update all listings badge when plan changes', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'basic', 'monthly');

      await Listing.create({
        host_id: hostUser.id,
        title: 'Test Listing 1',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2,
        badge: 'none',
        status: 'active'
      });

      await Listing.create({
        host_id: hostUser.id,
        title: 'Test Listing 2',
        type: 'accommodation',
        price_per_unit: 150000,
        capacity: 4,
        badge: 'none',
        status: 'active'
      });

      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const listings = await Listing.findAll({ where: { host_id: hostUser.id } });
      listings.forEach(listing => {
        expect(listing.badge).toBe('premium');
      });
    });

    it('should set search_boost based on plan', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'basic', 'monthly');

      const listing = await Listing.create({
        host_id: hostUser.id,
        title: 'Boost Test',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 2,
        status: 'active'
      });

      expect(listing.search_boost).toBe(0);
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should return all subscriptions for host', async () => {
      await subscriptionsService.subscribe(hostUser.id, 'basic', 'monthly');
      await subscriptionsService.subscribe(hostUser.id, 'premium', 'monthly');

      const history = await subscriptionsService.getSubscriptionHistory(hostUser.id);

      expect(history.length).toBeGreaterThanOrEqual(1);
    });
  });
});