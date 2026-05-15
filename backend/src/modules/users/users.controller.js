const usersService = require('./users.service');
const { handleUpload } = require('../../middleware/upload.middleware');

const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.userId, req.body);
    res.json({ success: true, data: user, message: 'Perfil actualizado' });
  } catch (error) {
    next(error);
  }
};

const updateProfilePhoto = async (req, res, next) => {
  try {
    await handleUpload(req, res, async () => {
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No se proporcionó imagen' }
        });
      }

      const photoUrl = req.uploadedFiles[0].url;
      const user = await usersService.updateProfilePhoto(req.userId, photoUrl);
      res.json({ success: true, data: user, message: 'Foto de perfil actualizada' });
    });
  } catch (error) {
    next(error);
  }
};

const updateHostProfile = async (req, res, next) => {
  try {
    const profile = await usersService.updateHostProfile(req.userId, req.body);
    res.json({ success: true, data: profile, message: 'Perfil de host actualizado' });
  } catch (error) {
    next(error);
  }
};

const updateNotificationPreferences = async (req, res, next) => {
  try {
    const prefs = await usersService.updateNotificationPreferences(req.userId, req.body);
    res.json({ success: true, data: prefs, message: 'Preferencias actualizadas' });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await usersService.deleteAccount(req.userId);
    res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updateHostProfile,
  updateNotificationPreferences,
  deleteAccount
};