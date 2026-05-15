const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const {
  updateProfileSchema,
  updateHostProfileSchema,
  notificationPreferencesSchema
} = require('./users.dto');

router.use(authenticate);

router.get('/me', usersController.getProfile);
router.put('/me', validateSchema(updateProfileSchema), usersController.updateProfile);
router.put('/me/photo', usersController.updateProfilePhoto);
router.put('/me/host-profile', validateSchema(updateHostProfileSchema), usersController.updateHostProfile);
router.put('/me/notification-preferences', validateSchema(notificationPreferencesSchema), usersController.updateNotificationPreferences);
router.delete('/me', usersController.deleteAccount);

module.exports = router;