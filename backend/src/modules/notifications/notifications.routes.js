const express = require('express');
const router = express.Router();
const notificationService = require('./notifications.service');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.userId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.userId);
    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notificación no encontrada' } });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userId);
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;