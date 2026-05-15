const adminService = require('../../../modules/admin/admin.service');
const {
  sequelize, User, HostProfile, Listing, Subscription, AuditLog, ContentReport
} = require('../../../db/models');

describe('Admin Service', () => {
  let admin;
  let host;

  beforeAll(async () => {
    admin = await User.create({
      email: 'admin.test@example.com',
      password_hash: '$2b$12$hashed',
      full_name: 'Admin Test',
      role: 'admin',
      status: 'active',
      email_verified_at: new Date()
    });

    host = await User.create({
      email: 'admin.host.test@example.com',
      password_hash: '$2b$12$hashed',
      full_name: 'Admin Host Test',
      role: 'host',
      status: 'active',
      email_verified_at: new Date()
    });

    const hostProfile = await HostProfile.create({
      user_id: host.id,
      business_name: 'Admin Host Business',
      business_type: 'accommodation',
      subscription_plan: 'premium',
      subscription_status: 'active'
    });
  });

  afterAll(async () => {
    await AuditLog.destroy({ where: {}, force: true });
    await Listing.destroy({ where: {}, force: true });
    await Subscription.destroy({ where: {}, force: true });
    await HostProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: { [require('sequelize').Op.in]: [admin.id, host.id] } }, force: true });
    await sequelize.close();
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      const metrics = await adminService.getDashboard();

      expect(metrics.totalUsers).toBeGreaterThanOrEqual(2);
      expect(metrics.activeHosts).toBeGreaterThanOrEqual(1);
      expect(metrics.monthlyReservations).toBeGreaterThanOrEqual(0);
      expect(metrics.monthlyAmount).toBeGreaterThanOrEqual(0);
      expect(metrics.totalListings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSubscriptionMetrics', () => {
    it('should return subscription metrics', async () => {
      const metrics = await adminService.getSubscriptionMetrics();

      expect(metrics.totalHosts).toBeGreaterThanOrEqual(1);
      expect(metrics.planDistribution).toBeDefined();
      expect(metrics.planDistribution.premium).toBeGreaterThanOrEqual(1);
      expect(metrics.mrr).toBeGreaterThan(0);
      expect(metrics.churnRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUsers', () => {
    it('should list all users with pagination', async () => {
      const result = await adminService.getUsers({ page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const result = await adminService.getUsers({ role: 'admin', page: 1, limit: 10 });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(u => {
        expect(['admin']).toContain(u.role);
      });
    });

    it('should filter users by status', async () => {
      const result = await adminService.getUsers({ status: 'active', page: 1, limit: 10 });

      result.data.forEach(u => {
        expect(u.status).toBe('active');
      });
    });
  });

  describe('updateUserStatus', () => {
    it('should suspend a user', async () => {
      const user = await User.create({
        email: 'suspend.test@example.com',
        password_hash: '$2b$12$hashed',
        full_name: 'Suspend Test',
        role: 'tourist',
        status: 'active'
      });

      const result = await adminService.updateUserStatus(user.id, 'suspended', admin.id, '127.0.0.1', 'Test reason');

      expect(result.message).toContain('suspendido');

      await user.reload();
      expect(user.status).toBe('suspended');

      const auditLog = await AuditLog.findOne({
        where: { entity_id: user.id, entity_type: 'user' }
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.admin_id).toBe(admin.id);
      expect(auditLog.new_value.status).toBe('suspended');

      await user.destroy({ force: true });
    });

    it('should reactivate a suspended user', async () => {
      const user = await User.create({
        email: 'activate.test@example.com',
        password_hash: '$2b$12$hashed',
        full_name: 'Activate Test',
        role: 'tourist',
        status: 'suspended'
      });

      const result = await adminService.updateUserStatus(user.id, 'active', admin.id, '127.0.0.1');

      expect(result.message).toContain('activado');
      await user.reload();
      expect(user.status).toBe('active');

      await user.destroy({ force: true });
    });
  });

  describe('getListings', () => {
    let testListing;

    beforeEach(async () => {
      testListing = await Listing.create({
        host_id: host.id,
        title: 'Admin Test Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 4,
        status: 'active',
        department: 'Antioquia'
      });
    });

    it('should list listings with pagination', async () => {
      const result = await adminService.getListings({ page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should filter listings by department', async () => {
      const result = await adminService.getListings({ department: 'Antioquia' });

      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('updateListingStatus', () => {
    let testListing;

    beforeEach(async () => {
      testListing = await Listing.create({
        host_id: host.id,
        title: 'Status Test Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 4,
        status: 'active'
      });
    });

    it('should pause a listing', async () => {
      const result = await adminService.updateListingStatus(testListing.id, 'paused', admin.id, '127.0.0.1', 'Test pause');

      expect(result.message).toContain('pausado');

      await testListing.reload();
      expect(testListing.status).toBe('paused');
    });

    it('should delete a listing', async () => {
      const result = await adminService.updateListingStatus(testListing.id, 'deleted', admin.id, '127.0.0.1');

      expect(result.message).toContain('eliminado');

      await testListing.reload();
      expect(testListing.status).toBe('deleted');
    });
  });

  describe('getReports', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await ContentReport.create({
        reporter_id: host.id,
        content_type: 'listing',
        content_id: '00000000-0000-0000-0000-000000000000',
        reason: 'Test report reason',
        status: 'pending'
      });
    });

    it('should list pending reports', async () => {
      const result = await adminService.getReports({ status: 'pending' });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should filter by content type', async () => {
      const result = await adminService.getReports({ content_type: 'listing' });

      result.data.forEach(r => {
        expect(r.content_type).toBe('listing');
      });
    });
  });

  describe('resolveReport', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await ContentReport.create({
        reporter_id: host.id,
        content_type: 'listing',
        content_id: '00000000-0000-0000-0000-000000000001',
        reason: 'Test report',
        status: 'pending'
      });
    });

    it('should approve a report', async () => {
      const result = await adminService.resolveReport(testReport.id, 'approved', admin.id, '127.0.0.1', 'Approved');

      expect(result.message).toContain('aprobado');

      await testReport.reload();
      expect(testReport.status).toBe('approved');
      expect(testReport.resolved_by).toBe(admin.id);
      expect(testReport.resolved_at).toBeDefined();
    });

    it('should reject already resolved report', async () => {
      testReport.status = 'approved';
      testReport.resolved_by = admin.id;
      testReport.resolved_at = new Date();
      await testReport.save();

      await expect(adminService.resolveReport(testReport.id, 'removed', admin.id, '127.0.0.1'))
        .rejects.toThrow('ya fue resuelto');
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with pagination', async () => {
      const result = await adminService.getAuditLogs({ page: 1, limit: 20 });

      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should filter by admin_id', async () => {
      const result = await adminService.getAuditLogs({ admin_id: admin.id });

      result.data.forEach(log => {
        expect(log.admin_id).toBe(admin.id);
      });
    });

    it('should filter by entity_type', async () => {
      const result = await adminService.getAuditLogs({ entity_type: 'user' });

      result.data.forEach(log => {
        expect(log.entity_type).toBe('user');
      });
    });
  });
});