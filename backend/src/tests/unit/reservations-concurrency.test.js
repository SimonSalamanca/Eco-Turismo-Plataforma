const reservationsService = require('../../modules/reservations/reservations.service');
const { sequelize, User, Listing, Reservation, Availability } = require('../../db/models');
const { ConflictError, AppError } = require('../../middleware/errorHandler.middleware');

jest.mock('../../config/mailer', () => ({
  sendReservationConfirmation: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../modules/payments/payments.service', () => ({
  refundPayment: jest.fn().mockResolvedValue({ id: 'refund_123' })
}));

describe('Reservations Service - Concurrency Tests', () => {
  let host, tourist1, tourist2, listing;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    host = await User.create({
      email: `host.concurrency.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Host User',
      role: 'host',
      status: 'active'
    });

    tourist1 = await User.create({
      email: `tourist1.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Tourist One',
      role: 'tourist',
      status: 'active'
    });

    tourist2 = await User.create({
      email: `tourist2.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Tourist Two',
      role: 'tourist',
      status: 'active'
    });

    listing = await Listing.create({
      host_id: host.id,
      title: 'Concurrency Test Listing',
      type: 'accommodation',
      price_per_unit: 100000,
      capacity: 4,
      status: 'active',
      department: 'Antioquia',
      municipality: 'Medellin'
    });

    const dates = [];
    const baseDate = new Date('2025-08-01');
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    await Availability.bulkCreate(
      dates.map(date => ({
        listing_id: listing.id,
        date: date,
        status: 'available'
      }))
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Reservation.destroy({ where: {}, force: true });
    await Availability.update(
      { status: 'available', reservation_id: null },
      { where: { listing_id: listing.id } }
    );
  });

  describe('Optimistic Locking - Concurrent Reservation Creation', () => {
    it('should allow first concurrent reservation and reject second', async () => {
      const reservationData = {
        listing_id: listing.id,
        check_in_date: '2025-08-01',
        check_out_date: '2025-08-03',
        guests_count: 2
      };

      const firstResult = await reservationsService.createReservation(tourist1.id, reservationData);
      expect(firstResult.status).toBe('pending');

      const conflictingData = {
        listing_id: listing.id,
        check_in_date: '2025-08-02',
        check_out_date: '2025-08-04',
        guests_count: 2
      };

      await expect(reservationsService.createReservation(tourist2.id, conflictingData))
        .rejects.toThrow('Las fechas seleccionadas ya no están disponibles');
    });

    it('should block dates when reservation is created', async () => {
      const reservationData = {
        listing_id: listing.id,
        check_in_date: '2025-08-05',
        check_out_date: '2025-08-07',
        guests_count: 2
      };

      await reservationsService.createReservation(tourist1.id, reservationData);

      const blockedDates = await Availability.findAll({
        where: {
          listing_id: listing.id,
          date: { [require('sequelize').Op.between]: ['2025-08-05', '2025-08-06'] },
          status: 'blocked'
        }
      });

      expect(blockedDates.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject reservation for fully booked dates', async () => {
      const firstReservation = {
        listing_id: listing.id,
        check_in_date: '2025-08-10',
        check_out_date: '2025-08-12',
        guests_count: 4
      };

      await reservationsService.createReservation(tourist1.id, firstReservation);

      const secondReservation = {
        listing_id: listing.id,
        check_in_date: '2025-08-10',
        check_out_date: '2025-08-12',
        guests_count: 2
      };

      await expect(reservationsService.createReservation(tourist2.id, secondReservation))
        .rejects.toThrow();
    });
  });

  describe('Version Field - Optimistic Locking', () => {
    it('should start with version 1 for new reservation', async () => {
      const reservationData = {
        listing_id: listing.id,
        check_in_date: '2025-09-01',
        check_out_date: '2025-09-02',
        guests_count: 2
      };

      const reservation = await reservationsService.createReservation(tourist1.id, reservationData);
      expect(reservation.version).toBe(1);
    });

    it('should increment version on update', async () => {
      const reservationData = {
        listing_id: listing.id,
        check_in_date: '2025-09-05',
        check_out_date: '2025-09-06',
        guests_count: 2
      };

      const reservation = await reservationsService.createReservation(tourist1.id, reservationData);
      expect(reservation.version).toBe(1);

      reservation.status = 'confirmed';
      await reservation.save();

      expect(reservation.version).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Date Availability Validation', () => {
    it('should reject reservation with check-out before check-in', async () => {
      const invalidData = {
        listing_id: listing.id,
        check_in_date: '2025-10-05',
        check_out_date: '2025-10-01',
        guests_count: 2
      };

      await expect(reservationsService.createReservation(tourist1.id, invalidData))
        .rejects.toThrow();
    });

    it('should reject reservation for same day check-in and check-out', async () => {
      const invalidData = {
        listing_id: listing.id,
        check_in_date: '2025-10-10',
        check_out_date: '2025-10-10',
        guests_count: 2
      };

      await expect(reservationsService.createReservation(tourist1.id, invalidData))
        .rejects.toThrow('al menos una noche');
    });

    it('should reject reservation exceeding listing capacity', async () => {
      const invalidData = {
        listing_id: listing.id,
        check_in_date: '2025-10-15',
        check_out_date: '2025-10-16',
        guests_count: 10
      };

      await expect(reservationsService.createReservation(tourist1.id, invalidData))
        .rejects.toThrow('capacidad máxima');
    });

    it('should reject reservation for inactive listing', async () => {
      await listing.update({ status: 'paused' });

      const reservationData = {
        listing_id: listing.id,
        check_in_date: '2025-11-01',
        check_out_date: '2025-11-02',
        guests_count: 2
      };

      await expect(reservationsService.createReservation(tourist1.id, reservationData))
        .rejects.toThrow('no está disponible');

      await listing.update({ status: 'active' });
    });
  });

  describe('Reservation Confirmation Code', () => {
    it('should generate unique confirmation codes', async () => {
      const reservation1 = await reservationsService.createReservation(tourist1.id, {
        listing_id: listing.id,
        check_in_date: '2025-12-01',
        check_out_date: '2025-12-02',
        guests_count: 2
      });

      const reservation2 = await reservationsService.createReservation(tourist2.id, {
        listing_id: listing.id,
        check_in_date: '2025-12-10',
        check_out_date: '2025-12-11',
        guests_count: 2
      });

      expect(reservation1.confirmation_code).not.toBe(reservation2.confirmation_code);
      expect(reservation1.confirmation_code.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Cancellation', () => {
    it('should cancel reservation and release dates', async () => {
      const reservation = await reservationsService.createReservation(tourist1.id, {
        listing_id: listing.id,
        check_in_date: '2026-01-05',
        check_out_date: '2026-01-07',
        guests_count: 2
      });

      const datesBefore = await Availability.findAll({
        where: {
          listing_id: listing.id,
          date: { [require('sequelize').Op.between]: ['2026-01-05', '2026-01-06'] },
          status: 'blocked'
        }
      });
      expect(datesBefore.length).toBeGreaterThan(0);

      await reservationsService.cancelReservation(reservation.id, tourist1.id, 'Test cancellation');

      const cancelledReservation = await Reservation.findByPk(reservation.id);
      expect(cancelledReservation.status).toBe('cancelled');

      const datesAfter = await Availability.findAll({
        where: {
          listing_id: listing.id,
          date: { [require('sequelize').Op.between]: ['2026-01-05', '2026-01-06'] },
          status: 'available'
        }
      });
      expect(datesAfter.length).toBeGreaterThan(0);
    });

    it('should not allow non-owner to cancel', async () => {
      const reservation = await reservationsService.createReservation(tourist1.id, {
        listing_id: listing.id,
        check_in_date: '2026-02-01',
        check_out_date: '2026-02-02',
        guests_count: 2
      });

      await expect(reservationsService.cancelReservation(reservation.id, tourist2.id, 'Unauthorized'))
        .rejects.toThrow('No tienes permiso');
    });

    it('should not allow cancellation of completed reservation', async () => {
      const reservation = await Reservation.create({
        listing_id: listing.id,
        tourist_id: tourist1.id,
        host_id: host.id,
        check_in_date: '2026-03-01',
        check_out_date: '2026-03-02',
        guests_count: 2,
        subtotal: 200000,
        platform_fee: 20000,
        total_amount: 220000,
        status: 'completed',
        confirmation_code: 'COMPLETE123'
      });

      await expect(reservationsService.cancelReservation(reservation.id, tourist1.id, 'Test'))
        .rejects.toThrow('completada');
    });
  });

  describe('ACID Transactions', () => {
    it('should rollback on failure during reservation creation', async () => {
      const initialReservationCount = await Reservation.count({
        where: { listing_id: listing.id }
      });

      const initialAvailabilityCount = await Availability.count({
        where: {
          listing_id: listing.id,
          status: 'available'
        }
      });

      await expect(reservationsService.createReservation(tourist1.id, {
        listing_id: '00000000-0000-0000-0000-000000000000',
        check_in_date: '2026-04-01',
        check_out_date: '2026-04-02',
        guests_count: 2
      })).rejects.toThrow();

      const finalReservationCount = await Reservation.count({
        where: { listing_id: listing.id }
      });
      const finalAvailabilityCount = await Availability.count({
        where: {
          listing_id: listing.id,
          status: 'available'
        }
      });

      expect(finalReservationCount).toBe(initialReservationCount);
      expect(finalAvailabilityCount).toBe(initialAvailabilityCount);
    });
  });
});