const {
  createReservation,
  getMyReservations,
  getHostReservations,
  getReservationById,
  cancelReservation
} = require('../../../modules/reservations/reservations.service');
const authService = require('../../../modules/auth/auth.service');
const listingsService = require('../../../modules/listings/listings.service');
const paymentsService = require('../../../modules/payments/payments.service');
const {
  sequelize, Reservation, Listing, User, HostProfile, Availability, Payment
} = require('../../../db/models');

describe('Complete Reservation Flow Integration', () => {
  let host;
  let tourist;
  let listing;
  let hostToken;
  let touristToken;

  beforeAll(async () => {
    host = await User.create({
      email: 'integration.host@example.com',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ6NtJUgZqGmCGm',
      full_name: 'Integration Host',
      role: 'host',
      status: 'active',
      email_verified_at: new Date()
    });

    tourist = await User.create({
      email: 'integration.tourist@example.com',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ6NtJUgZqGmCGm',
      full_name: 'Integration Tourist',
      role: 'tourist',
      status: 'active',
      email_verified_at: new Date()
    });

    const hostProfile = await HostProfile.create({
      user_id: host.id,
      business_name: 'Integration Business',
      business_type: 'accommodation',
      subscription_plan: 'premium',
      subscription_status: 'active'
    });

    listing = await Listing.create({
      host_id: host.id,
      title: 'Integration Test Listing',
      type: 'accommodation',
      description: 'Test description',
      price_per_unit: 150000,
      capacity: 4,
      status: 'active',
      department: 'Antioquia',
      municipality: 'Medellín'
    });
  });

  afterAll(async () => {
    await Payment.destroy({ where: {}, force: true });
    await Reservation.destroy({ where: {}, force: true });
    await Listing.destroy({ where: {}, force: true });
    await HostProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Flow: Reservation Creation', () => {
    it('should create reservation end-to-end', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 3);

      const reservation = await createReservation(tourist.id, {
        listing_id: listing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      });

      expect(reservation.id).toBeDefined();
      expect(reservation.confirmation_code).toBeDefined();
      expect(reservation.status).toBe('pending');
      expect(reservation.listing_id).toBe(listing.id);
      expect(reservation.tourist_id).toBe(tourist.id);
      expect(reservation.host_id).toBe(host.id);

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      expect(reservation.subtotal).toBe(150000 * nights * 2);
      expect(reservation.platform_fee).toBe(Math.round(reservation.subtotal * 0.10));
      expect(reservation.total_amount).toBe(reservation.subtotal + reservation.platform_fee);

      const availability = await Availability.findAll({
        where: { listing_id: listing.id, reservation_id: reservation.id }
      });
      expect(availability.length).toBeGreaterThan(0);

      return reservation;
    });
  });

  describe('Tourist Reservation Management', () => {
    let reservation;

    beforeEach(async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 10);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      reservation = await createReservation(tourist.id, {
        listing_id: listing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 1
      });
    });

    it('should get tourist reservations', async () => {
      const reservations = await getMyReservations(tourist.id);

      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);

      const found = reservations.find(r => r.id === reservation.id);
      expect(found).toBeDefined();
    });

    it('should filter reservations by status', async () => {
      const pending = await getMyReservations(tourist.id, 'pending');
      expect(pending.length).toBeGreaterThan(0);

      const confirmed = await getMyReservations(tourist.id, 'confirmed');
      expect(confirmed.length).toBe(0);
    });

    it('should get reservation by id for owner', async () => {
      const found = await getReservationById(reservation.id, tourist.id, 'tourist');

      expect(found.id).toBe(reservation.id);
      expect(found.listing).toBeDefined();
      expect(found.tourist).toBeDefined();
    });

    it('should get reservation by id for host', async () => {
      const found = await getReservationById(reservation.id, host.id, 'host');

      expect(found.id).toBe(reservation.id);
    });

    it('should cancel reservation as tourist', async () => {
      const result = await cancelReservation(reservation.id, tourist.id, 'Cambio de planes');

      expect(result.message).toContain('cancelada');

      const updated = await Reservation.findByPk(reservation.id);
      expect(updated.status).toBe('cancelled');
    });
  });

  describe('Host Reservation Management', () => {
    let reservation;

    beforeEach(async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 20);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      reservation = await createReservation(tourist.id, {
        listing_id: listing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 3
      });
    });

    it('should get host reservations', async () => {
      const reservations = await getHostReservations(host.id);

      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
    });

    it('should filter host reservations by status', async () => {
      const pending = await getHostReservations(host.id, 'pending');
      expect(pending.length).toBeGreaterThan(0);
    });

    it('should include tourist info for host', async () => {
      const reservations = await getHostReservations(host.id);
      const found = reservations.find(r => r.id === reservation.id);

      expect(found.tourist).toBeDefined();
      expect(found.tourist.full_name).toBe('Integration Tourist');
    });
  });

  describe('Payment Flow', () => {
    let reservation;

    beforeEach(async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 30);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      reservation = await createReservation(tourist.id, {
        listing_id: listing.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        guests_count: 2
      });
    });

    it('should create payment intent', async () => {
      const result = await paymentsService.createPaymentIntent(reservation.id, tourist.id);

      expect(result.client_secret).toBeDefined();
      expect(result.payment_intent_id).toBeDefined();

      const updatedReservation = await Reservation.findByPk(reservation.id);
      expect(updatedReservation.stripe_payment_intent_id).toBeDefined();
    });
  });
});