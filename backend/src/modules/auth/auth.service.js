const { User, HostProfile } = require('../../db/models');
const { generateToken, generateRefreshToken, verifyToken } = require('../../utils/jwt.utils');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountBlockedEmail
} = require('../../config/mailer');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { Op } = require('sequelize');
const crypto = require('crypto');

const register = async (data) => {
  if (data.accepted_terms !== true) {
    throw new AppError('Debes aceptar los términos y condiciones', 400, 'TERMS_NOT_ACCEPTED');
  }

  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('El correo electrónico ya está registrado', 409, 'EMAIL_EXISTS');
  }

  const verificationToken = uuidv4();

  const user = await User.create({
    email: data.email,
    password_hash: data.password,
    full_name: data.full_name,
    phone: data.phone,
    role: data.role || 'tourist',
    status: 'pending_verification',
    email_verification_token: verificationToken,
    notification_preferences: {
      reminders: true,
      marketing: false
    }
  });

  if (data.role === 'host' || data.role === 'local_business') {
    await HostProfile.create({
      user_id: user.id,
      business_type: data.business_type || 'accommodation'
    });
  }

  await sendVerificationEmail(user.email, verificationToken);

  const token = generateToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.token_version || 1
  });

  return { user, token };
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    where: { email_verification_token: token }
  });

  if (!user) {
    throw new AppError('Token de verificación inválido', 400, 'INVALID_TOKEN');
  }

  user.email_verified_at = new Date();
  user.status = 'active';
  user.email_verification_token = null;
  await user.save();

  await sendWelcomeEmail(user.email, user.full_name);

  return { message: 'Correo verificado exitosamente' };
};

const login = async (email, password, ipAddress) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
  }

  const now = new Date();
  if (user.locked_until && user.locked_until > now) {
    const minutesLeft = Math.ceil((user.locked_until - now) / 60000);
    throw new AppError(`Cuenta bloqueada. Intenta en ${minutesLeft} minutos`, 403, 'ACCOUNT_LOCKED');
  }

  const isValidPassword = await user.validatePassword(password);

  if (!isValidPassword) {
    const failedAttempts = user.failed_login_attempts + 1;

    if (failedAttempts >= 5) {
      user.failed_login_attempts = 0;
      user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      sendAccountBlockedEmail(user.email, user.full_name).catch(err => {
        console.error('Error sending account blocked email:', err.message);
      });

      throw new AppError('Cuenta bloqueada por 15 minutos debido a demasiados intentos fallidos', 403, 'ACCOUNT_LOCKED');
    }

    user.failed_login_attempts = failedAttempts;
    await user.save();

    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'suspended') {
    throw new AppError('Cuenta suspendida', 403, 'ACCOUNT_SUSPENDED');
  }

  if (user.status === 'pending_verification') {
    // Temporalmente permitir login sin verificación para desarrollo
    console.log('⚠️ Usuario sin verificar pero permitiendo login para desarrollo');
    // throw new AppError('Debes verificar tu correo electrónico', 403, 'EMAIL_NOT_VERIFIED');
  }

  user.failed_login_attempts = 0;
  user.locked_until = null;
  await user.save();

  const token = generateToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.token_version || 1
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.token_version || 1
  });

  return {
    user: user.toJSON(),
    token,
    refreshToken
  };
};

const refreshToken = async (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.status !== 'active') {
      throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
    }

    const newToken = generateToken({
      userId: user.id,
      role: user.role,
      tokenVersion: user.token_version || 1
    });

    return { token: newToken };
  } catch (error) {
    throw new AppError('Token de refresh inválido', 401, 'INVALID_REFRESH_TOKEN');
  }
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return { message: 'Si el correo existe, recibirás un enlace de recuperación' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.password_reset_token = resetToken;
  user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(user.email, resetToken);

  return { message: 'Si el correo existe, recibirás un enlace de recuperación' };
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: {
      password_reset_token: token,
      password_reset_expires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    throw new AppError('Token de recuperación inválido o expirado', 400, 'INVALID_TOKEN');
  }

  user.password_hash = newPassword;
  user.password_reset_token = null;
  user.password_reset_expires = null;
  user.failed_login_attempts = 0;
  user.locked_until = null;
  user.token_version = (user.token_version || 1) + 1;
  await user.save();

  return { message: 'Contraseña actualizada exitosamente' };
};

const logout = async (userId) => {
  const user = await User.findByPk(userId);
  if (user) {
    user.token_version = (user.token_version || 1) + 1;
    await user.save();
  }
  return { message: 'Sesión cerrada exitosamente' };
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout
};