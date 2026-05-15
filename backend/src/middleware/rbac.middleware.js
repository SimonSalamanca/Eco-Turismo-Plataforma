const ROLES = {
  admin: 'admin',
  host: 'host',
  local_business: 'local_business',
  tourist: 'tourist'
};

const PERMISSIONS = {
  listing: {
    create: ['host', 'local_business', 'admin'],
    update: ['host', 'local_business', 'admin'],
    delete: ['host', 'admin'],
    read: ['host', 'local_business', 'admin', 'tourist'],
    moderate: ['admin']
  },
  reservation: {
    create: ['tourist', 'admin'],
    cancel: ['tourist', 'host', 'admin'],
    read: ['tourist', 'host', 'admin'],
    readHost: ['host', 'admin'],
    readTourist: ['tourist', 'admin']
  },
  review: {
    create: ['tourist'],
    respond: ['host', 'admin'],
    read: ['host', 'local_business', 'admin', 'tourist'],
    moderate: ['admin']
  },
  subscription: {
    manage: ['host', 'local_business', 'admin'],
    read: ['host', 'local_business', 'admin']
  },
  user: {
    readOwn: ['tourist', 'host', 'local_business', 'admin'],
    updateOwn: ['tourist', 'host', 'local_business', 'admin'],
    deleteOwn: ['tourist', 'host', 'local_business', 'admin'],
    manage: ['admin']
  },
  payment: {
    create: ['tourist'],
    readOwn: ['tourist', 'host', 'admin']
  },
  admin: {
    dashboard: ['admin'],
    users: ['admin'],
    listings: ['admin'],
    reports: ['admin'],
    subscriptions: ['admin'],
    audit: ['admin']
  }
};

const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' }
      });
    }

    const allowedRoles = PERMISSIONS[resource]?.[action];
    if (!allowedRoles) {
      return res.status(500).json({
        success: false,
        error: { code: 'PERMISSION_NOT_CONFIGURED', message: 'Permiso no configurado' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción' }
      });
    }

    next();
  };
};

const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción' }
      });
    }

    next();
  };
};

const requireAllRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' }
      });
    }

    const hasAllRoles = roles.every(role => req.user.role === role);
    if (!hasAllRoles) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción' }
      });
    }

    next();
  };
};

const isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      if (req.user.id === ownerId || req.user.role === 'admin') {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Solo el propietario o un administrador puede realizar esta acción' }
      });
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción' }
      });
    }
  };
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' }
    });
  }

  if (!req.user.email_verified_at) {
    return res.status(403).json({
      success: false,
      error: { code: 'EMAIL_NOT_VERIFIED', message: 'Debes verificar tu correo electrónico' }
    });
  }

  next();
};

module.exports = {
  ROLES,
  PERMISSIONS,
  requirePermission,
  requireAnyRole,
  requireAllRoles,
  isOwnerOrAdmin,
  requireVerifiedEmail
};