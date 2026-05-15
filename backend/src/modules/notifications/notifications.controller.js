const notificationsService = require('./notifications.service');

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationsService.createNotification(
      req.body.user_id,
      req.body.type,
      req.body.subject,
      req.body.body,
      req.body.metadata
    );
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification
};