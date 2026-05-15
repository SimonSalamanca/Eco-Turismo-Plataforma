const {
  User, Listing, Reservation, Subscription, AuditLog,
  ContentReport, HostProfile, Payment, sequelize
} = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');
const stripe = require('../../config/stripe');
const { Op } = require('sequelize');
const { cacheDeletePattern } = require('../../config/redis');

const getDashboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeHosts,
    monthlyReservations,
    monthlyAmount,
    pendingReports,
    totalListings
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: { [Op.in]: ['host', 'local_business'] }, status: 'active' } }),
    Reservation.count({
      where: {
        created_at: { [Op.gte]: startOfMonth },
        status: { [Op.in]: ['confirmed', 'completed'] }
      }
    }),
    Payment.sum('amount', {
      where: {
        status: 'succeeded',
        created_at: { [Op.gte]: startOfMonth }
      }
    }),
    ContentReport.count({ where: { status: 'pending' } }),
    Listing.count({ where: { status: { [Op.ne]: 'deleted' } } })
  ]);

  const recentReservations = await Reservation.findAndCountAll({
    where: { created_at: { [Op.gte]: startOfMonth } },
    include: [
      { model: User, as: 'tourist', attributes: ['id', 'full_name'] },
      { model: Listing, as: 'listing', attributes: ['id', 'title'] }
    ],
    order: [['created_at', 'DESC']],
    limit: 5
  });

  return {
    totalUsers,
    activeHosts,
    monthlyReservations,
    monthlyAmount: monthlyAmount || 0,
    pendingReports,
    totalListings,
    recentReservations: recentReservations.rows,
    pendingReservationsCount: recentReservations.count
  };
};

const getSubscriptionMetrics = async () => {
  const [
    totalHosts,
    basicCount,
    premiumCount,
    proCount,
    activeCount,
    cancelledCount,
    pastDueCount,
    monthlyNewSubscriptions,
    monthlyCancellations
  ] = await Promise.all([
    User.count({ where: { role: { [Op.in]: ['host', 'local_business'] } } }),
    HostProfile.count({ where: { subscription_plan: 'basic' } }),
    HostProfile.count({ where: { subscription_plan: 'premium' } }),
    HostProfile.count({ where: { subscription_plan: 'pro' } }),
    HostProfile.count({ where: { subscription_status: 'active' } }),
    HostProfile.count({ where: { subscription_status: 'cancelled' } }),
    HostProfile.count({ where: { subscription_status: 'past_due' } }),
    Subscription.count({
      where: {
        created_at: { [Op.gte]: new Date(new Date().setDate(1)) }
      }
    }),
    Subscription.count({
      where: {
        cancelled_at: { [Op.gte]: new Date(new Date().setDate(1)) }
      }
    })
  ]);

  const basicRevenue = basicCount * 0;
  const premiumRevenue = premiumCount * 49900;
  const proRevenue = proCount * 99900;
  const mrr = premiumRevenue + proRevenue;

  const churnRate = totalHosts > 0 ? ((cancelledCount / totalHosts) * 100).toFixed(2) : 0;

  return {
    totalHosts,
    planDistribution: { basic: basicCount, premium: premiumCount, pro: proCount },
    statusDistribution: { active: activeCount, cancelled: cancelledCount, past_due: pastDueCount },
    mrr,
    newSubscriptions: monthlyNewSubscriptions,
    cancellations: monthlyCancellations,
    churnRate: parseFloat(churnRate)
  };
};

const getUsers = async (query) => {
  const { name, email, role, status, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (name) where.full_name = { [Op.iLike]: `%${name}%` };
  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (role) where.role = role;
  if (status) where.status = status;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password_hash', 'email_verification_token', 'password_reset_token'] },
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const updateUserStatus = async (userId, newStatus, adminId, ipAddress, reason) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  const oldStatus = user.status;
  user.status = newStatus;
  await user.save();

  await AuditLog.create({
    admin_id: adminId,
    action: `user_status_${newStatus}`,
    entity_type: 'user',
    entity_id: userId,
    old_value: { status: oldStatus },
    new_value: { status: newStatus, reason },
    ip_address: ipAddress
  });

  return { message: `Usuario ${newStatus === 'suspended' ? 'suspendido' : newStatus === 'active' ? 'activado' : 'actualizado'} exitosamente` };
};

const getListings = async (query) => {
  const { title, department, status, host_id, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (title) where.title = { [Op.iLike]: `%${title}%` };
  if (department) where.department = department;
  if (status) where.status = status;
  else where.status = { [Op.ne]: 'deleted' };
  if (host_id) where.host_id = host_id;

  const { count, rows } = await Listing.findAndCountAll({
    where,
    include: [
      { model: User, as: 'host', attributes: ['id', 'full_name', 'email'] }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const updateListingStatus = async (listingId, newStatus, adminId, ipAddress, reason) => {
  const listing = await Listing.findByPk(listingId);
  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  const oldStatus = listing.status;
  listing.status = newStatus;
  await listing.save();

  await AuditLog.create({
    admin_id: adminId,
    action: `listing_status_${newStatus}`,
    entity_type: 'listing',
    entity_id: listingId,
    old_value: { status: oldStatus },
    new_value: { status: newStatus, reason },
    ip_address: ipAddress
  });

  await cacheDeletePattern('search:*');
  await cacheDeletePattern(`listing:${listingId}`);

  return { message: `Listing ${newStatus === 'deleted' ? 'eliminado' : newStatus === 'paused' ? 'pausado' : 'activado'} exitosamente` };
};

const getReports = async (query) => {
  const { status = 'pending', content_type, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (content_type) where.content_type = content_type;

  const { count, rows } = await ContentReport.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'reporter',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  let enrichedRows = rows;
  if (rows.length > 0) {
    const listingIds = rows.filter(r => r.content_type === 'listing').map(r => r.content_id);
    const reviewIds = rows.filter(r => r.content_type === 'review').map(r => r.content_id);

    const [listings, reviews] = await Promise.all([
      listingIds.length > 0 ? Listing.findAll({ where: { id: listingIds }, attributes: ['id', 'title'] }) : [],
      reviewIds.length > 0 ? require('../../db/models').Review.findAll({ where: { id: reviewIds }, attributes: ['id', 'comment', 'rating'] }) : []
    ]);

    const listingMap = Object.fromEntries(listings.map(l => [l.id, l]));
    const reviewMap = Object.fromEntries(reviews.map(r => [r.id, r]));

    enrichedRows = rows.map(r => ({
      ...r.toJSON(),
      content: r.content_type === 'listing' ? listingMap[r.content_id] : reviewMap[r.content_id]
    }));
  }

  return {
    data: enrichedRows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const resolveReport = async (reportId, action, adminId, ipAddress, notes) => {
  const report = await ContentReport.findByPk(reportId);
  if (!report) {
    throw new AppError('Reporte no encontrado', 404, 'NOT_FOUND');
  }

  if (report.status !== 'pending') {
    throw new AppError('Este reporte ya fue resuelto', 400, 'ALREADY_RESOLVED');
  }

  const oldStatus = report.status;
  report.status = action === 'removed' ? 'removed' : action === 'edited' ? 'edited' : 'approved';
  report.resolved_by = adminId;
  report.resolved_at = new Date();
  await report.save();

  if (action === 'removed') {
    if (report.content_type === 'listing') {
      await Listing.update({ status: 'deleted' }, { where: { id: report.content_id } });
    } else {
      const Review = require('../../db/models').Review;
      await Review.destroy({ where: { id: report.content_id } });
    }
  }

  await AuditLog.create({
    admin_id: adminId,
    action: `report_resolved_${action}`,
    entity_type: 'content_report',
    entity_id: reportId,
    old_value: { status: oldStatus },
    new_value: { status: report.status, action, notes },
    ip_address: ipAddress
  });

  return { message: `Reporte ${action === 'removed' ? 'eliminado' : action === 'edited' ? 'editado' : 'aprobado'} exitosamente` };
};

const getSubscriptions = async (query) => {
  const { plan, status, host_id, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (plan) where.plan = plan;
  if (status) where.status = status;
  if (host_id) where.host_id = host_id;

  const { count, rows } = await Subscription.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'hostUser',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const applyDiscount = async (hostId, couponCode, discountPercent) => {
  const hostProfile = await HostProfile.findOne({ where: { user_id: hostId } });
  if (!hostProfile) {
    throw new AppError('Perfil de anfitrión no encontrado', 404, 'NOT_FOUND');
  }

  if (!hostProfile.stripe_customer_id) {
    throw new AppError('El anfitrión no tiene un cliente Stripe configurado', 400, 'NO_STRIPE_CUSTOMER');
  }

  try {
    await stripe.stripe.coupons.create({
      percent_off: discountPercent,
      duration: 'once',
      id: couponCode
    });
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw new AppError('Error al crear el cupón: ' + error.message, 500, 'STRIPE_ERROR');
    }
  }

  await stripe.stripe.customers.update(hostProfile.stripe_customer_id, {
    coupon: couponCode
  });

  await AuditLog.create({
    admin_id: null,
    action: 'discount_applied',
    entity_type: 'subscription',
    entity_id: hostProfile.id,
    new_value: { coupon_code: couponCode, discount_percent: discountPercent }
  });

  return { message: `Cupón ${couponCode} aplicado exitosamente` };
};

const exportSubscriptions = async () => {
  const subscriptions = await Subscription.findAll({
    include: [
      {
        model: User,
        as: 'hostUser',
        attributes: ['full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    raw: false
  });

  const header = 'Nombre,Correo,Plan,Billing,Estado,Inicio período,Fin período,Fecha cancelación\n';
  const rows = subscriptions.map(s => {
    const user = s.hostUser;
    return `"${user?.full_name || ''}","${user?.email || ''}","${s.plan}","${s.billing_cycle}","${s.status}","${s.current_period_start || ''}","${s.current_period_end || ''}","${s.cancelled_at || ''}"`;
  }).join('\n');

  return header + rows;
};

const getAuditLogs = async (query) => {
  const {
    admin_id, action, entity_type, entity_id,
    start_date, end_date, page = 1, limit = 50
  } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (admin_id) where.admin_id = admin_id;
  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (entity_type) where.entity_type = entity_type;
  if (entity_id) where.entity_id = entity_id;
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at[Op.gte] = new Date(start_date);
    if (end_date) where.created_at[Op.lte] = new Date(end_date);
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'admin',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
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