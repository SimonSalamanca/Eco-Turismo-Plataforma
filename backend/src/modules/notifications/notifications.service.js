const { Notification, User, sequelize } = require('../../db/models');
const { sendEmail } = require('../../config/mailer');
const { Op } = require('sequelize');

const createNotification = async (userId, type, subject, body, metadata = {}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      subject,
      body,
      metadata
    });

    let emailSent = false;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user && user.notification_preferences?.email) {
        await sendEmail(user.email, subject, body);
        emailSent = true;
      }
    } else if (metadata.touristEmail) {
      await sendEmail(metadata.touristEmail, subject, body);
      emailSent = true;
    }

    if (emailSent) {
      notification.sent_at = new Date();
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('Notification error:', error.message);
    return null;
  }
};

const getUserNotifications = async (userId, query = {}) => {
  const { page = 1, limit = 20, unread_only } = query;
  const offset = (page - 1) * limit;

  const where = { user_id: userId };
  if (unread_only) {
    where.sent_at = null;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
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

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId }
  });

  if (!notification) return null;

  notification.sent_at = new Date();
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update(
    { sent_at: new Date() },
    { where: { user_id: userId, sent_at: null } }
  );
};

const getUnreadCount = async (userId) => {
  return Notification.count({
    where: { user_id: userId, sent_at: null }
  });
};

const sendAccountLockoutEmail = async (user) => {
  const subject = 'Cuenta bloqueada - Eco Turismo';
  const html = `
    <h1>Cuenta bloqueada</h1>
    <p>Tu cuenta ha sido bloqueada temporalmente debido a demasiados intentos de inicio de sesión fallidos.</p>
    <p>Podrás intentar de nuevo en 15 minutos.</p>
    <p>Si no fuiste tú quien intentó acceder, te recomendamos cambiar tu contraseña.</p>
  `;
  return createNotification(user.id, 'account_lockout', subject, html);
};

const sendWelcomeEmail = async (user) => {
  const subject = '¡Bienvenido a Eco Turismo Experiencial!';
  const html = `
    <h1>¡Bienvenido, ${user.full_name}!</h1>
    <p>Gracias por registrarte en Eco Turismo Experiencial.</p>
    <p>Explora los mejores destinos de ecoturismo en Colombia.</p>
  `;
  return createNotification(user.id, 'welcome', subject, html);
};

const sendReviewRequest = async (reservation) => {
  const subject = '¿Cómo fue tu experiencia?';
  const html = `
    <h1>Cuéntanos tu experiencia</h1>
    <p>Tu estadía en ${reservation.listing?.title || 'este lugar'} ha finalizado.</p>
    <p>¿Podrías dejarnos una reseña?</p>
  `;
  return createNotification(reservation.tourist_id, 'review_request', subject, html);
};

const sendArrivalReminder = async (reservation, recipient) => {
  const subject = 'Recordatorio de llegada';
  const html = `
    <h1>Recordatorio de llegada</h1>
    <p>Tu reserva en ${reservation.listing?.title || ''} comienza pronto.</p>
    <p>Fecha: ${reservation.check_in_date}</p>
  `;
  return createNotification(recipient.id, 'arrival_reminder', subject, html);
};

const sendCancellationNotice = async (reservation, canceller, refundPolicy = '', refundAmount = 0) => {
  const isTourist = canceller.id === reservation.tourist_id;
  const otherParty = isTourist ? reservation.hostUser : reservation.tourist;

  const refundInfo = (isTourist && refundAmount > 0) 
    ? `<p style="color: green; font-weight: bold;">Se ha procesado un reembolso de $${refundAmount.toLocaleString('es-CO')} COP</p>`
    : (isTourist && refundPolicy) 
      ? `<p style="color: red;">${refundPolicy}</p>`
      : '';

  const subject = 'Reserva cancelada';
  const html = `
    <h1>Reserva cancelada</h1>
    <p>La reserva en <strong>${reservation.listing?.title || 'el alojamiento'}</strong> ha sido cancelada.</p>
    <p><strong>Fecha de-check in:</strong> ${reservation.check_in_date}</p>
    <p><strong>Fecha de check-out:</strong> ${reservation.check_out_date}</p>
    <p><strong>Cancelada por:</strong> ${canceller.full_name}</p>
    <p><strong>Motivo:</strong> ${reservation.cancellation_reason || 'No especificado'}</p>
    ${refundInfo}
  `;

  if (otherParty) {
    return createNotification(otherParty.id, 'cancellation_notice', subject, html);
  }
};

const sendSubscriptionConfirmation = async (user, plan) => {
  const subject = 'Suscripción activada';
  const html = `
    <h1>¡Suscripción activada!</h1>
    <p>Tu plan ${plan} ha sido activado exitosamente.</p>
    <p>Disfruta de todos los beneficios.</p>
  `;
  return createNotification(user.id, 'subscription_activated', subject, html);
};

const sendNewReviewNotification = async (host, review, listing) => {
  const subject = 'Nueva reseña recibida';
  const html = `
    <h1>Nueva reseña</h1>
    <p>Has recibido una nueva reseña para ${listing?.title || 'tu publicación'}.</p>
    <p>Calificación: ${review.rating}/5</p>
  `;
  return createNotification(host.id, 'new_review', subject, html);
};

const sendNewReservationHost = async (host, reservation) => {
  const subject = 'Nueva reserva recibida';
  const html = `
    <h1>Nueva reserva</h1>
    <p>Tienes una nueva reserva para ${reservation.listing?.title || ''}.</p>
    <p>Fecha: ${reservation.check_in_date} - ${reservation.check_out_date}</p>
    <p>Huéspedes: ${reservation.guests_count}</p>
  `;
  return createNotification(host.id, 'new_reservation', subject, html);
};

const sendSubscriptionChangeNotice = async (user, oldPlan, newPlan) => {
  const subject = 'Cambio de plan';
  const html = `
    <h1>Tu plan ha cambiado</h1>
    <p>Tu plan ha cambiado de ${oldPlan} a ${newPlan}.</p>
  `;
  return createNotification(user.id, 'subscription_changed', subject, html);
};

const sendListingDeletedNotice = async (touristName, touristEmail, listingTitle, checkInDate, refundPolicy, refundAmount) => {
  const subject = 'Tu reserva ha sido cancelada - Listing eliminado';
  const refundInfo = refundAmount > 0
    ? `<p style="color: green; font-weight: bold;">Se ha procesado un reembolso de $${refundAmount.toLocaleString('es-CO')} COP</p>`
    : `<p style="color: red;">${refundPolicy}</p>`;

  const html = `
    <h1>Reserva cancelada</h1>
    <p>Hola ${touristName},</p>
    <p>Lamentamos informarte que la reserva en <strong>${listingTitle}</strong> ha sido cancelada debido a que el alojamiento ha sido eliminado por su propietario.</p>
    <p><strong>Fecha de check-in:</strong> ${checkInDate}</p>
    <p><strong>Motivo:</strong> El propietario eliminó el listing</p>
    ${refundInfo}
    <p>Si tienes alguna pregunta, por favor contacta al equipo de soporte.</p>
    <p>Gracias por tu comprensión.</p>
  `;

  return createNotification(null, 'listing_deleted_notice', subject, html, { touristEmail });
};

const sendReservationConfirmedNotice = async (reservation) => {
  const checkIn = new Date(reservation.check_in_date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const checkOut = new Date(reservation.check_out_date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const subject = '¡Tu reserva ha sido confirmada!';
  const html = `
    <h1>Reserva confirmada</h1>
    <p>Hola ${reservation.tourist?.full_name || 'huésped'},</p>
    <p>Tu reserva ha sido confirmada por el anfitrión.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p><strong>🏠 Alojamiento:</strong> ${reservation.listing?.title || 'No disponible'}</p>
      <p><strong>📅 Check-in:</strong> ${checkIn}</p>
      <p><strong>📅 Check-out:</strong> ${checkOut}</p>
      <p><strong>👥 Huéspedes:</strong> ${reservation.guests_count}</p>
      <p><strong>🔖 Código de confirmación:</strong> ${reservation.confirmation_code}</p>
      <p><strong>💰 Total:</strong> $${reservation.total_amount?.toLocaleString('es-CO')} COP</p>
    </div>
    <p>Te esperamos en la fecha de check-in. Si tienes alguna pregunta, puedes contactar directamente al anfitrión.</p>
    <p>¡Disfruta tu experiencia de ecoturismo!</p>
  `;

  if (reservation.tourist) {
    return createNotification(reservation.tourist.id, 'reservation_confirmed', subject, html);
  }
};

const sendReservationRejectedNotice = async (reservation, reason) => {
  const subject = 'Tu reserva ha sido rechazada';
  const reasonText = reason || 'El anfitrión no pudo aceptar tu solicitud';

  const html = `
    <h1>Reserva rechazada</h1>
    <p>Hola ${reservation.tourist?.full_name || 'huésped'},</p>
    <p>Lamentamos informarte que el anfitrión ha rechazado tu solicitud de reserva.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p><strong>🏠 Alojamiento:</strong> ${reservation.listing?.title || 'No disponible'}</p>
      <p><strong>📅 Fechas solicitadas:</strong> ${reservation.check_in_date} - ${reservation.check_out_date}</p>
      <p><strong>🔖 Código:</strong> ${reservation.confirmation_code}</p>
    </div>
    <p><strong>Motivo:</strong> ${reasonText}</p>
    <p>Puedes buscar otras opciones de alojamiento en nuestra plataforma.</p>
  `;

  if (reservation.tourist) {
    return createNotification(reservation.tourist.id, 'reservation_rejected', subject, html);
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendAccountLockoutEmail,
  sendWelcomeEmail,
  sendReviewRequest,
  sendArrivalReminder,
  sendCancellationNotice,
  sendSubscriptionConfirmation,
  sendNewReviewNotification,
  sendNewReservationHost,
  sendSubscriptionChangeNotice,
  sendListingDeletedNotice,
  sendReservationConfirmedNotice,
  sendReservationRejectedNotice
};