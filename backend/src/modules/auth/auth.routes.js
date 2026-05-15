const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authLimiter } = require('../../middleware/rateLimit.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('./auth.dto');

router.post('/register', authLimiter, validateSchema(registerSchema), authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authLimiter, validateSchema(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, validateSchema(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validateSchema(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authController.logout);

module.exports = router;