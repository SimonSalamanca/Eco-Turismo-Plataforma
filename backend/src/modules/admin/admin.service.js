const {
  User, Listing, Reservation, Subscription, AuditLog,
  ContentReport, HostProfile, Payment, Review, sequelize
} = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');
const stripe = require('../../config/stripe');
const { sendEmail } = require('../../config/mailer');
const { Op } = require('sequelize');
const { cacheDeletePattern } = require('../../config/redis');

const getDashboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    touristCount,
    hostCount,
    activeHosts,
    monthlyReservations,
    monthlyAmount,
    pendingReports,
    totalListings,
    newSubscriptionsMonth,
    cancellationsMonth
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'tourist' } }),
    User.count({ where: { role: { [Op.in]: ['host', 'local_business'] } } }),
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
    Listing.count({ where: { status: { [Op.ne]: 'deleted' } } }),
    Subscription.count({
      where: { created_at: { [Op.gte]: startOfMonth } }
    }),
    Subscription.count({
      where: { cancelled_at: { [Op.gte]: startOfMonth } }
    })
  ]);

  const totalAtStartOfMonth = await Subscription.count({
    where: { created_at: { [Op.lt]: startOfMonth } }
  });
  const churnRate = totalAtStartOfMonth > 0
    ? parseFloat(((cancellationsMonth / totalAtStartOfMonth) * 100).toFixed(2))
    : 0;

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
    usersByRole: { tourist: touristCount, host: hostCount },
    activeHosts,
    monthlyReservations,
    monthlyAmount: monthlyAmount || 0,
    newSubscriptions: newSubscriptionsMonth,
    cancellations: cancellationsMonth,
    churnRate,
    pendingReports,
    totalListings,
    recentReservations: recentReservations.rows,
    pendingReservationsCount: recentReservations.count
  };
};

const getSubscriptionMetrics = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
      where: { created_at: { [Op.gte]: startOfMonth } }
    }),
    Subscription.count({
      where: { cancelled_at: { [Op.gte]: startOfMonth } }
    })
  ]);

  const mrrResult = await Payment.findAll({
    attributes: [
      [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    where: {
      status: 'succeeded',
      created_at: { [Op.gte]: startOfMonth }
    },
    group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
    raw: true
  });
  const mrr = mrrResult.length > 0 ? parseInt(mrrResult[0].total, 10) : 0;

  const churnRate = totalHosts > 0
    ? parseFloat(((cancelledCount / totalHosts) * 100).toFixed(2))
    : 0;

  return {
    totalHosts,
    planDistribution: { basic: basicCount, premium: premiumCount, pro: proCount },
    statusDistribution: { active: activeCount, cancelled: cancelledCount, past_due: pastDueCount },
    mrr,
    newSubscriptions: monthlyNewSubscriptions,
    cancellations: monthlyCancellations,
    churnRate
  };
};

const getUserDetail = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash', 'email_verification_token', 'password_reset_token'] },
    include: [
      { model: HostProfile, as: 'hostProfile' }
    ]
  });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  const [listingCount, reservationCount, paymentCount] = await Promise.all([
    Listing.count({ where: { host_id: userId } }),
    Reservation.count({
      where: {
        [Op.or]: [{ tourist_id: userId }, { host_id: userId }]
      }
    }),
    Payment.count({ where: { tourist_id: userId } })
  ]);

  return {
    ...user.toJSON(),
    listingCount,
    reservationCount,
    paymentCount
  };
};

const getUsers = async (query) => {
  const { name, email, role, status, page = 1, limit = 10 } = query;
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

  const action = newStatus === 'suspended' ? 'suspend_user' : 'activate_user';
  await AuditLog.create({
    admin_id: adminId,
    action,
    entity_type: 'user',
    entity_id: userId,
    old_value: { status: oldStatus },
    new_value: { status: newStatus, reason },
    ip_address: ipAddress
  });

  return { message: `Usuario ${newStatus === 'suspended' ? 'suspendido' : newStatus === 'active' ? 'activado' : 'actualizado'} exitosamente` };
};

const getListings = async (query) => {
  const { title, host_id, department, status, page = 1, limit = 10 } = query;
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

  const action = newStatus === 'paused' ? 'pause_listing'
    : newStatus === 'deleted' ? 'delete_listing'
    : 'activate_listing';
  await AuditLog.create({
    admin_id: adminId,
    action,
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
  const { status = 'pending', content_type, page = 1, limit = 10 } = query;
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

  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

  let enrichedRows = rows;
  if (rows.length > 0) {
    const listingIds = rows.filter(r => r.content_type === 'listing').map(r => r.content_id);
    const reviewIds = rows.filter(r => r.content_type === 'review').map(r => r.content_id);

    const [listings, reviews] = await Promise.all([
      listingIds.length > 0
        ? Listing.findAll({ where: { id: listingIds }, attributes: ['id', 'title', 'status'] })
        : [],
      reviewIds.length > 0
        ? Review.findAll({ where: { id: reviewIds }, attributes: ['id', 'comment', 'rating', 'is_published'] })
        : []
    ]);

    const listingMap = Object.fromEntries(listings.map(l => [l.id, l]));
    const reviewMap = Object.fromEntries(reviews.map(r => [r.id, r]));

    enrichedRows = rows.map(r => {
      const createdAt = new Date(r.created_at);
      const isOverdue = (Date.now() - createdAt.getTime()) > FORTY_EIGHT_HOURS;
      return {
        ...r.toJSON(),
        is_overdue: isOverdue,
        content: r.content_type === 'listing' ? listingMap[r.content_id] : reviewMap[r.content_id]
      };
    });
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

const getReportDetail = async (reportId) => {
  const report = await ContentReport.findByPk(reportId, {
    include: [
      {
        model: User,
        as: 'reporter',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: User,
        as: 'resolver',
        attributes: ['id', 'full_name', 'email']
      }
    ]
  });
  if (!report) {
    throw new AppError('Reporte no encontrado', 404, 'NOT_FOUND');
  }

  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const createdAt = new Date(report.created_at);
  const isOverdue = (Date.now() - createdAt.getTime()) > FORTY_EIGHT_HOURS;

  let content = null;
  if (report.content_type === 'listing') {
    content = await Listing.findByPk(report.content_id, {
      attributes: ['id', 'title', 'description', 'status', 'host_id'],
      include: [{ model: User, as: 'host', attributes: ['id', 'full_name', 'email'] }]
    });
  } else {
    content = await Review.findByPk(report.content_id, {
      attributes: ['id', 'comment', 'rating', 'is_published', 'listing_id', 'tourist_id'],
      include: [
        { model: User, as: 'tourist', attributes: ['id', 'full_name'] },
        { model: Listing, as: 'listing', attributes: ['id', 'title'] }
      ]
    });
  }

  return {
    ...report.toJSON(),
    is_overdue: isOverdue,
    content
  };
};

const resolveReport = async (reportId, action, adminId, ipAddress, notes) => {
  const report = await ContentReport.findByPk(reportId, {
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'full_name', 'email'] }
    ]
  });
  if (!report) {
    throw new AppError('Reporte no encontrado', 404, 'NOT_FOUND');
  }

  if (report.status !== 'pending') {
    throw new AppError('Este reporte ya fue resuelto', 400, 'ALREADY_RESOLVED');
  }

  const oldStatus = report.status;
  const resolutionAction = action === 'delete' ? 'removed' : action === 'edit' ? 'edited' : 'approved';
  report.status = resolutionAction;
  report.resolved_by = adminId;
  report.resolved_at = new Date();
  report.resolution_note = notes || null;
  await report.save();

  let contentOwnerEmail = null;
  let contentOwnerName = '';

  if (action === 'delete') {
    if (report.content_type === 'listing') {
      const listing = await Listing.findByPk(report.content_id, {
        include: [{ model: User, as: 'host', attributes: ['email', 'full_name'] }]
      });
      if (listing) {
        await listing.update({ status: 'deleted' });
        contentOwnerEmail = listing.host?.email;
        contentOwnerName = listing.host?.full_name || '';
      }
    } else {
      const review = await Review.findByPk(report.content_id, {
        include: [{ model: User, as: 'tourist', attributes: ['email', 'full_name'] }]
      });
      if (review) {
        await review.update({ is_published: false });
        contentOwnerEmail = review.tourist?.email;
        contentOwnerName = review.tourist?.full_name || '';
      }
    }
  } else {
    if (report.content_type === 'listing') {
      const listing = await Listing.findByPk(report.content_id, {
        include: [{ model: User, as: 'host', attributes: ['email', 'full_name'] }]
      });
      if (listing) {
        contentOwnerEmail = listing.host?.email;
        contentOwnerName = listing.host?.full_name || '';
      }
    } else {
      const review = await Review.findByPk(report.content_id, {
        include: [{ model: User, as: 'tourist', attributes: ['email', 'full_name'] }]
      });
      if (review) {
        contentOwnerEmail = review.tourist?.email;
        contentOwnerName = review.tourist?.full_name || '';
      }
    }
  }

  const actionLabels = { approve: 'aprobado', edit: 'editado', delete: 'eliminado' };

  if (report.reporter?.email) {
    await sendEmail(
      report.reporter.email,
      'Reporte resuelto - Eco Turismo',
      `<h1>Reporte resuelto</h1>
       <p>Hola,</p>
       <p>El reporte que realizaste ha sido <strong>${actionLabels[action] || 'resuelto'}</strong> por nuestro equipo de moderación.</p>
       ${notes ? `<p><strong>Nota del moderador:</strong> ${notes}</p>` : ''}
       <p>Gracias por ayudarnos a mantener la calidad del contenido en Eco Turismo Experiencial.</p>`
    );
  }

  if (contentOwnerEmail) {
    await sendEmail(
      contentOwnerEmail,
      'Contenido moderado - Eco Turismo',
      `<h1>Contenido moderado</h1>
       <p>Hola ${contentOwnerName},</p>
       <p>Te informamos que tu contenido ha sido revisado y la resolución ha sido: <strong>${actionLabels[action] || 'revisado'}</strong>.</p>
       ${notes ? `<p><strong>Nota del moderador:</strong> ${notes}</p>` : ''}
       <p>Si tienes preguntas, por favor contacta a soporte.</p>`
    );
  }

  await AuditLog.create({
    admin_id: adminId,
    action: 'resolve_report',
    entity_type: 'content_report',
    entity_id: reportId,
    old_value: { status: oldStatus },
    new_value: { status: report.status, action, notes },
    ip_address: ipAddress
  });

  return { message: `Reporte ${actionLabels[action] || 'resuelto'} exitosamente` };
};

const getSubscriptions = async (query) => {
  const { plan, status, host_id, page = 1, limit = 10 } = query;
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

const getHostSubscriptionHistory = async (hostId) => {
  const subscriptions = await Subscription.findAll({
    where: { host_id: hostId },
    include: [
      {
        model: User,
        as: 'hostUser',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  const hostProfile = await HostProfile.findOne({
    where: { user_id: hostId },
    attributes: ['subscription_plan', 'subscription_status', 'subscription_expires_at', 'stripe_customer_id']
  });

  const payments = await Payment.findAll({
    where: { tourist_id: hostId, status: 'succeeded' },
    order: [['created_at', 'DESC']],
    limit: 20
  });

  return {
    subscriptions,
    currentPlan: hostProfile,
    recentPayments: payments
  };
};

const applyDiscount = async (hostId, couponCode, discountPercent, adminId) => {
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
    admin_id: adminId,
    action: 'apply_discount',
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

  const header = 'Nombre,Correo,Plan,Fecha inicio,Próxima renovación,Monto\n';
  const rows = subscriptions.map(s => {
    const user = s.hostUser;
    const planPrices = { basic: 0, premium: 49900, pro: 99900 };
    const amount = planPrices[s.plan] || 0;
    return `"${user?.full_name || ''}","${user?.email || ''}","${s.plan}","${s.current_period_start || ''}","${s.current_period_end || ''}","${amount}"`;
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
  getUserDetail,
  updateUserStatus,
  getListings,
  updateListingStatus,
  getReports,
  getReportDetail,
  resolveReport,
  getSubscriptions,
  getHostSubscriptionHistory,
  applyDiscount,
  exportSubscriptions,
  getAuditLogs
};