const { User, HostProfile, Reservation, Listing, Review } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { cacheDelete, cacheDeletePattern } = require('../../config/redis');
const { encrypt, decrypt, encryptBankInfo } = require('../../utils/encryption.utils');

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: HostProfile, as: 'hostProfile' }
    ]
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  return user;
};

const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  const allowedFields = ['full_name', 'phone'];
  const updateData = {};

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  await user.update(updateData);
  await cacheDelete(`user:${userId}`);

  return user.toJSON();
};

const updateProfilePhoto = async (userId, photoUrl) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  user.profile_photo_url = photoUrl;
  await user.save();
  await cacheDelete(`user:${userId}`);

  return user.toJSON();
};

const updateHostProfile = async (userId, data) => {
  let hostProfile = await HostProfile.findOne({ where: { user_id: userId } });

  if (!hostProfile) {
    hostProfile = await HostProfile.create({
      user_id: userId,
      ...data
    });
  } else {
    const allowedFields = ['business_name', 'business_type', 'department', 'municipality', 'description'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    await hostProfile.update(updateData);
  }

  return hostProfile;
};

const updateBankInfo = async (userId, bankInfo) => {
  const hostProfile = await HostProfile.findOne({ where: { user_id: userId } });

  if (!hostProfile) {
    throw new AppError('Perfil de host no encontrado', 404, 'NOT_FOUND');
  }

  const encrypted = encryptBankInfo(bankInfo);

  hostProfile.bank_info_encrypted = encrypted;
  await hostProfile.save();

  return { message: 'Información bancaria actualizada' };
};

const updateNotificationPreferences = async (userId, preferences) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  const currentPrefs = user.notification_preferences || {};
  user.notification_preferences = { ...currentPrefs, ...preferences };
  await user.save();

  return user.notification_preferences;
};

const deleteAccount = async (userId) => {
  const { v4: uuidv4 } = require('uuid');
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
  }

  const reservations = await Reservation.findAll({
    where: {
      [require('sequelize').Op.or]: [
        { tourist_id: userId },
        { host_id: userId }
      ],
      status: { [require('sequelize').Op.notIn]: ['cancelled', 'completed'] }
    }
  });

  if (reservations.length > 0) {
    throw new AppError('No puedes eliminar tu cuenta con reservas activas', 400, 'ACTIVE_RESERVATIONS');
  }

  const deletedEmail = `deleted_${uuidv4()}@deleted.com`;

  await user.update({
    email: deletedEmail,
    full_name: 'Usuario eliminado',
    phone: null,
    profile_photo_url: null,
    status: 'suspended',
    notification_preferences: {},
    token_version: (user.token_version || 1) + 1
  });

  await cacheDelete(`user:${userId}`);

  return { message: 'Cuenta eliminada exitosamente. Tus datos han sido anonimizados según la Ley 1581/2012.' };
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updateHostProfile,
  updateBankInfo,
  updateNotificationPreferences,
  deleteAccount
};