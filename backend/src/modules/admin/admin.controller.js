const adminService = require('./admin.service');

const getDashboard = async (req, res, next) => {
  try {
    const metrics = await adminService.getDashboard();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getSubscriptionMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getSubscriptionMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateUserStatus(
      req.params.id,
      req.body.status,
      req.userId,
      req.ip,
      req.body.reason
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getListings = async (req, res, next) => {
  try {
    const result = await adminService.getListings(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateListingStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateListingStatus(
      req.params.id,
      req.body.status,
      req.userId,
      req.ip,
      req.body.reason
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const result = await adminService.getReports(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const result = await adminService.resolveReport(
      req.params.id,
      req.body.action,
      req.userId,
      req.ip,
      req.body.notes
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const result = await adminService.getSubscriptions(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const applyDiscount = async (req, res, next) => {
  try {
    const result = await adminService.applyDiscount(
      req.params.hostId,
      req.body.coupon_code,
      req.body.discount_percent
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const exportSubscriptions = async (req, res, next) => {
  try {
    const csv = await adminService.exportSubscriptions();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getSubscriptionMetrics,
  getUsers,
  updateUserStatus,
  getListings,
  updateListingStatus,
  getReports,
  resolveReport,
  getSubscriptions,
  applyDiscount,
  exportSubscriptions,
  getAuditLogs
};