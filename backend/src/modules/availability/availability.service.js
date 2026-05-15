const { Availability, Listing, Reservation } = require('../../db/models');
const { AppError, ForbiddenError } = require('../../middleware/errorHandler.middleware');
const { Op } = require('sequelize');
const { cacheDelete, cacheDeletePattern } = require('../../config/redis');

const getAvailability = async (listingId, year, month) => {
  const listing = await Listing.findByPk(listingId);
  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const availabilities = await Availability.findAll({
    where: {
      listing_id: listingId,
      date: { [Op.between]: [startDate, endDate] }
    },
    order: [['date', 'ASC']]
  });

  return availabilities;
};

const updateAvailability = async (listingId, hostId, data) => {
  const listing = await Listing.findByPk(listingId);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId) {
    throw new ForbiddenError('No tienes permiso para modificar este listing');
  }

  const { start_date, end_date, status, special_price } = data;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (startDate > endDate) {
    throw new AppError('Fecha de inicio debe ser anterior a fecha de fin', 400, 'INVALID_DATES');
  }

  if (status === 'blocked') {
    const confirmedReservations = await Reservation.findAll({
      where: {
        listing_id: listingId,
        status: 'confirmed',
        [Op.or]: [
          { check_in_date: { [Op.between]: [startDate, endDate] } },
          { check_out_date: { [Op.between]: [startDate, endDate] } }
        ]
      }
    });

    if (confirmedReservations.length > 0) {
      throw new AppError('No puedes bloquear fechas con reservas confirmadas', 400, 'RESERVATIONS_EXIST');
    }
  }

  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (const date of dates) {
    await Availability.upsert({
      listing_id: listingId,
      date,
      status,
      special_price: status === 'special_price' ? special_price : null
    });
  }

  await cacheDeletePattern('search:*');

  return { message: 'Disponibilidad actualizada' };
};

const bulkUpdateAvailability = async (listingId, hostId, updates) => {
  const listing = await Listing.findByPk(listingId);

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  if (listing.host_id !== hostId) {
    throw new ForbiddenError('No tienes permiso para modificar este listing');
  }

  for (const update of updates) {
    const { date, status, special_price } = update;

    if (status === 'blocked') {
      const confirmedReservations = await Reservation.findOne({
        where: {
          listing_id: listingId,
          status: 'confirmed',
          check_in_date: { [Op.lte]: date },
          check_out_date: { [Op.gte]: date }
        }
      });

      if (confirmedReservations) {
        continue;
      }
    }

    await Availability.upsert({
      listing_id: listingId,
      date,
      status,
      special_price: status === 'special_price' ? special_price : null
    });
  }

  await cacheDeletePattern('search:*');

  return { message: 'Disponibilidad actualizada' };
};

module.exports = {
  getAvailability,
  updateAvailability,
  bulkUpdateAvailability
};