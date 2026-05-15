const cron = require('node-cron');
const { Reservation, User } = require('../../db/models');
const { Op } = require('sequelize');
const notificationService = require('./notifications.service');

const startCronJobs = () => {
  cron.schedule('0 13 * * *', async () => {
    console.log('[CRON] Ejecutando job de recordatorios (08:00 Colombia)...');
    await sendArrivalReminders();
  });

  cron.schedule('0 14 * * *', async () => {
    console.log('[CRON] Ejecutando job de solicitudes de calificación (09:00 Colombia)...');
    await sendReviewRequests();
  });

  cron.schedule('0 5 * * *', async () => {
    console.log('[CRON] Ejecutando job de completado de reservas (00:00 Colombia)...');
    await markExpiredReservations();
  });

  console.log('[CRON] Tareas programadas iniciadas ( timezone: UTC )');
};

const sendArrivalReminders = async () => {
  try {
    const now = new Date();
    const touristReminderDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const hostReminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const touristDateStr = touristReminderDate.toISOString().split('T')[0];
    const hostDateStr = hostReminderDate.toISOString().split('T')[0];

    const [touristReservations, hostReservations] = await Promise.all([
      Reservation.findAll({
        where: {
          status: 'confirmed',
          check_in_date: touristDateStr
        },
        include: [
          { model: User, as: 'tourist' },
          { model: User, as: 'hostUser' },
          { model: require('../../db/models').Listing, as: 'listing' }
        ]
      }),
      Reservation.findAll({
        where: {
          status: 'confirmed',
          check_in_date: hostDateStr
        },
        include: [
          { model: User, as: 'tourist' },
          { model: User, as: 'hostUser' },
          { model: require('../../db/models').Listing, as: 'listing' }
        ]
      })
    ]);

    for (const reservation of touristReservations) {
      if (reservation.tourist) {
        await notificationService.sendArrivalReminder(reservation, reservation.tourist);
      }
    }

    for (const reservation of hostReservations) {
      if (reservation.hostUser) {
        await notificationService.sendArrivalReminder(reservation, reservation.hostUser);
      }
    }

    console.log(`[CRON] Recordatorios enviados: ${touristReservations.length} a turistas, ${hostReservations.length} a anfitriones`);
  } catch (error) {
    console.error('[CRON] Error en recordatorios:', error.message);
  }
};

const sendReviewRequests = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const reservations = await Reservation.findAll({
      where: {
        status: 'completed',
        check_out_date: yesterdayStr
      },
      include: [
        { model: User, as: 'tourist' },
        { model: require('../../db/models').Listing, as: 'listing' }
      ]
    });

    for (const reservation of reservations) {
      await notificationService.sendReviewRequest(reservation);
    }

    console.log(`[CRON] Solicitudes de reseña enviadas: ${reservations.length}`);
  } catch (error) {
    console.error('[CRON] Error en solicitudes de reseña:', error.message);
  }
};

const markExpiredReservations = async () => {
  try {
    const reservationsService = require('../reservations/reservations.service');
    const result = await reservationsService.markAsCompleted();
    console.log(`[CRON] Reservas completadas automáticamente: ${result.count}`);
  } catch (error) {
    console.error('[CRON] Error en completado de reservas:', error.message);
  }
};

module.exports = {
  startCronJobs,
  sendArrivalReminders,
  sendReviewRequests,
  markExpiredReservations
};