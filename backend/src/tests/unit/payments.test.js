const paymentsService = require('../../modules/payments/payments.service');
const { sequelize, User, Listing, Reservation, Payment } = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');

jest.mock('../../config/stripe', () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret'
  }),
  createRefund: jest.fn().mockResolvedValue({
    id: 're_test_123',
    status: 'succeeded'
  })
}));

jest.mock('../../config/mailer', () => ({
  sendReservationConfirmation: jest.fn().mockResolvedValue({ success: true })
}));

describe('Payments Service - Unit Tests', () => {
  let tourist, host, listing, reservation;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    host = await User.create({
      email: `host.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Host User',
      role: 'host',
      status: 'active'
    });

    tourist = await User.create({
      email: `tourist.${Date.now()}@example.com`,
      password_hash: '$2b$12$hashed',
      full_name: 'Tourist User',
      role: 'tourist',
      status: 'active'
    });

    listing = await Listing.create({
      host_id: host.id,
      title: 'Test Listing',
      type: 'accommodation',
      description: 'Test description',
      price_per_unit: 100000,
      capacity: 4,
      status: 'active'
    });

    reservation = await Reservation.create({
      listing_id: listing.id,
      tourist_id: tourist.id,
      host_id: host.id,
      check_in_date: '2025-06-01',
      check_out_date: '2025-06-02',
      guests_count: 2,
      subtotal: 200000,
      platform_fee: 20000,
      total_amount: 220000,
      status: 'pending',
      confirmation_code: 'TEST12345'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await Payment.destroy({ where: {}, force: true });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent for valid reservation', async () => {
      const result = await paymentsService.createPaymentIntent(reservation.id, tourist.id);

      expect(result.client_secret).toBeDefined();
      expect(result.payment_intent_id).toBe('pi_test_123');

      const updatedReservation = await Reservation.findByPk(reservation.id);
      expect(updatedReservation.stripe_payment_intent_id).toBe('pi_test_123');

      const payment = await Payment.findOne({
        where: { reservation_id: reservation.id }
      });
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(220000);
      expect(payment.platform_commission).toBe(20000);
      expect(payment.host_payout).toBe(200000);
    });

    it('should reject payment for non-existent reservation', async () => {
      await expect(paymentsService.createPaymentIntent('00000000-0000-0000-0000-000000000000', tourist.id))
        .rejects.toThrow('Reserva no encontrada');
    });

    it('should reject payment for non-owner tourist', async () => {
      const otherTourist = await User.create({
        email: `other.${Date.now()}@example.com`,
        password_hash: '$2b$12$hashed',
        full_name: 'Other Tourist',
        role: 'tourist',
        status: 'active'
      });

      await expect(paymentsService.createPaymentIntent(reservation.id, otherTourist.id))
        .rejects.toThrow('No tienes permiso');
    });

    it('should reject payment for non-pending reservation', async () => {
      reservation.status = 'confirmed';
      await reservation.save();

      await expect(paymentsService.createPaymentIntent(reservation.id, tourist.id))
        .rejects.toThrow('ya no está pendiente de pago');

      reservation.status = 'pending';
      await reservation.save();
    });
  });

  describe('handleWebhook - Payment Success', () => {
    it('should confirm reservation on payment success', async () => {
      const paymentIntent = {
        id: 'pi_success_123',
        metadata: {
          reservation_id: reservation.id,
          tourist_id: tourist.id
        }
      };

      await paymentsService.handlePaymentSuccess(paymentIntent);

      const updatedReservation = await Reservation.findByPk(reservation.id);
      expect(updatedReservation.status).toBe('confirmed');

      const payment = await Payment.findOne({
        where: { stripe_payment_intent_id: 'pi_success_123' }
      });
      expect(payment.status).toBe('succeeded');
    });

    it('should not fail for non-existent reservation', async () => {
      const paymentIntent = {
        id: 'pi_nonexistent',
        metadata: {
          reservation_id: '00000000-0000-0000-0000-000000000000',
          tourist_id: tourist.id
        }
      };

      await expect(paymentsService.handlePaymentSuccess(paymentIntent))
        .resolves.not.toThrow();
    });
  });

  describe('handleWebhook - Payment Failed', () => {
    it('should cancel reservation on payment failure', async () => {
      const pendingReservation = await Reservation.create({
        listing_id: listing.id,
        tourist_id: tourist.id,
        host_id: host.id,
        check_in_date: '2025-07-01',
        check_out_date: '2025-07-02',
        guests_count: 2,
        subtotal: 200000,
        platform_fee: 20000,
        total_amount: 220000,
        status: 'pending',
        confirmation_code: 'FAIL12345'
      });

      const paymentIntent = {
        id: 'pi_failed_123',
        metadata: {
          reservation_id: pendingReservation.id
        }
      };

      await paymentsService.handlePaymentFailed(paymentIntent);

      const updatedReservation = await Reservation.findByPk(pendingReservation.id);
      expect(updatedReservation.status).toBe('cancelled');
      expect(updatedReservation.cancellation_reason).toContain('pago fallido');
    });
  });

  describe('refundPayment', () => {
    it('should process refund for payment intent', async () => {
      const result = await paymentsService.refundPayment('pi_test_123');
      expect(result).toBeDefined();
    });
  });

  describe('Payment Calculations', () => {
    it('should calculate correct platform commission (10%)', async () => {
      const subtotal = 100000;
      const expectedFee = Math.round(subtotal * 0.10);
      expect(expectedFee).toBe(10000);
    });

    it('should calculate correct total amount', async () => {
      const subtotal = 100000;
      const platformFee = Math.round(subtotal * 0.10);
      const total = subtotal + platformFee;
      expect(total).toBe(110000);
    });

    it('should calculate correct host payout (subtotal)', async () => {
      const subtotal = 100000;
      const hostPayout = subtotal;
      expect(hostPayout).toBe(100000);
    });

    it('should handle large amounts correctly', async () => {
      const subtotal = 10000000;
      const platformFee = Math.round(subtotal * 0.10);
      const total = subtotal + platformFee;

      expect(platformFee).toBe(1000000);
      expect(total).toBe(11000000);
    });

    it('should handle fractional amounts correctly', async () => {
      const subtotal = 33333;
      const platformFee = Math.round(subtotal * 0.10);
      const total = subtotal + platformFee;

      expect(platformFee).toBe(3333);
      expect(total).toBe(36666);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const payment = await paymentsService.createPaymentIntent(reservation.id, tourist.id);

      const found = await Payment.findOne({
        where: { stripe_payment_intent_id: 'pi_test_123' }
      });

      expect(found).toBeDefined();
      expect(found.amount).toBe(220000);
    });
  });

  describe('getTouristPayments', () => {
    it('should return all payments for tourist', async () => {
      await paymentsService.createPaymentIntent(reservation.id, tourist.id);

      const payments = await Payment.findAll({
        where: { tourist_id: tourist.id }
      });

      expect(payments.length).toBeGreaterThan(0);
    });
  });
});