const {
  createReservation,
  cancelReservation,
  markAsCompleted
} = require('../../../modules/reservations/reservations.service');
const { ConflictError, ForbiddenError } = require('../../../middleware/errorHandler.middleware');
const { sequelize, Reservation, Listing, Availability, User } = require('../../../db/models');
const stripeService = require('../../../modules/payments/payments.service');

jest.mock('../../../modules/payments/payments.service');
jest.mock('../../../config/mailer');

describe('Reservations Service', () => {
  let mockTourist;
  let mockHost;
  let mockListing;

  beforeAll(async () => {
    mockTourist = await User.create({
      email: 'tourist.test@example.com',
      password_hash: '$2b$12$hashedpassword',
      full_name: 'Tourist Test',
      role: 'tourist',
      status: 'active',
      email_verified_at: new Date()
    });

    mockHost = await User.create({
      email: 'host.test@example.com',
      password_hash: '$2b$12$hashedpassword',
      full_name: 'Host Test',
      role: 'host',
      status: 'active',
      email_verified_at: new Date()
    });

    mockListing = await Listing.create({
      host_id: mockHost.id,
      title: 'Test Listing',
      type: 'accommodation',
      price_per_unit: 100000,
      capacity: 4,
      status: 'active'
    });
  });

  afterAll(async () => {
    await Reservation.destroy({ where: {}, force: true });
    await Listing.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      const reservation = await createReservation(mockTourist.id, {
        listing_id: mockListing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      });

      expect(reservation).toBeDefined();
      expect(reservation.status).toBe('pending');
      expect(reservation.confirmation_code).toBeDefined();
      expect(reservation.tourist_id).toBe(mockTourist.id);
      expect(reservation.host_id).toBe(mockHost.id);
      expect(reservation.subtotal).toBeGreaterThan(0);
      expect(reservation.platform_fee).toBeGreaterThanOrEqual(0);
      expect(reservation.total_amount).toBe(reservation.subtotal + reservation.platform_fee);
    });

    it('should reject listing not found', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      await expect(createReservation(mockTourist.id, {
        listing_id: '00000000-0000-0000-0000-000000000000',
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      })).rejects.toThrow('Listing no encontrado');
    });

    it('should reject inactive listing', async () => {
      const inactiveListing = await Listing.create({
        host_id: mockHost.id,
        title: 'Inactive Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 4,
        status: 'paused'
      });

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      await expect(createReservation(mockTourist.id, {
        listing_id: inactiveListing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      })).rejects.toThrow('El listing no está disponible');

      await inactiveListing.destroy({ force: true });
    });

    it('should reject when capacity exceeded', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      await expect(createReservation(mockTourist.id, {
        listing_id: mockListing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 10
      })).rejects.toThrow(/capacidad máxima/);
    });

    it('should reject invalid date range', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 10);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() - 2);

      await expect(createReservation(mockTourist.id, {
        listing_id: mockListing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      })).rejects.toThrow();
    });
  });

  describe('cancelReservation', () => {
    let reservation;

    beforeEach(async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 14);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      reservation = await createReservation(mockTourist.id, {
        listing_id: mockListing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      });
    });

    it('should cancel reservation as tourist', async () => {
      const result = await cancelReservation(reservation.id, mockTourist.id, 'Motivo de prueba');

      expect(result).toBeDefined();
      expect(result.message).toContain('cancelada');

      const updated = await Reservation.findByPk(reservation.id);
      expect(updated.status).toBe('cancelled');
      expect(updated.cancellation_reason).toBe('Motivo de prueba');
    });

    it('should not allow non-owner to cancel', async () => {
      const otherUser = await User.create({
        email: 'other.test@example.com',
        password_hash: '$2b$12$hashedpassword',
        full_name: 'Other User',
        role: 'tourist',
        status: 'active'
      });

      await expect(cancelReservation(reservation.id, otherUser.id)).rejects.toThrow(ForbiddenError);

      await otherUser.destroy({ force: true });
    });

    it('should not allow cancelling already cancelled reservation', async () => {
      await cancelReservation(reservation.id, mockTourist.id);

      await expect(cancelReservation(reservation.id, mockTourist.id)).rejects.toThrow('ya está cancelada');
    });

    it('should not allow cancelling completed reservation', async () => {
      reservation.status = 'completed';
      await reservation.save();

      await expect(cancelReservation(reservation.id, mockTourist.id)).rejects.toThrow('completada');

      reservation.status = 'pending';
      await reservation.save();
    });
  });

  describe('markAsCompleted', () => {
    it('should mark past reservations as completed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const confirmedReservation = await Reservation.create({
        listing_id: mockListing.id,
        tourist_id: mockTourist.id,
        host_id: mockHost.id,
        check_in_date: twoDaysAgo.toISOString().split('T')[0],
        check_out_date: yesterday.toISOString().split('T')[0],
        guests_count: 2,
        subtotal: 200000,
        platform_fee: 20000,
        total_amount: 220000,
        status: 'confirmed',
        confirmation_code: 'TESTCOMPLET1'
      });

      const result = await markAsCompleted();

      expect(result.count).toBeGreaterThanOrEqual(1);

      await confirmedReservation.destroy({ force: true });
    });
  });

  describe('Platform Fee Calculation', () => {
    it('should calculate 10% platform fee correctly', async () => {
      const listing = await Listing.create({
        host_id: mockHost.id,
        title: 'Fee Test Listing',
        type: 'accommodation',
        price_per_unit: 100000,
        capacity: 4,
        status: 'active'
      });

      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 30);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      const reservation = await createReservation(mockTourist.id, {
        listing_id: listing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 1
      });

      const expectedSubtotal = 100000 * 2 * 1;
      const expectedFee = Math.round(expectedSubtotal * 0.10);

      expect(reservation.subtotal).toBe(expectedSubtotal);
      expect(reservation.platform_fee).toBe(expectedFee);
      expect(reservation.total_amount).toBe(expectedSubtotal + expectedFee);

      await listing.destroy({ force: true });
      await reservation.destroy({ force: true });
    });
  });
});