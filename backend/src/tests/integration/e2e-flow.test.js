const request = require('supertest');
const { app } = require('../../../app');
const { sequelize, User, HostProfile, Listing, Reservation, Availability, Payment } = require('../../../db/models');

jest.mock('../../../config/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendReservationConfirmation: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../../config/stripe', () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_e2e_test',
    client_secret: 'pi_e2e_test_secret'
  }),
  createRefund: jest.fn().mockResolvedValue({ id: 'refund_e2e' })
}));

describe('E2E Integration Tests - Complete User Flow', () => {
  let hostToken, touristToken, listingId, reservationId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Step 1: User Registration', () => {
    it('should register a new host', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `host.e2e.${Date.now()}@example.com`,
          password: 'SecurePass123!',
          full_name: 'E2E Host',
          phone: '+573001234567',
          role: 'host',
          business_type: 'accommodation'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      hostToken = response.body.data.token;
    });

    it('should register a new tourist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `tourist.e2e.${Date.now()}@example.com`,
          password: 'SecurePass123!',
          full_name: 'E2E Tourist',
          phone: '+573009876543',
          role: 'tourist'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      touristToken = response.body.data.token;
    });

    it('should reject duplicate registration', async () => {
      const existingEmail = `host.e2e.${Date.now()}@example.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: existingEmail,
          password: 'SecurePass123!',
          full_name: 'First User',
          role: 'tourist'
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: existingEmail,
          password: 'SecurePass123!',
          full_name: 'Duplicate User',
          role: 'tourist'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('Step 2: Email Verification', () => {
    it('should verify email with valid token', async () => {
      const user = await User.findOne({
        where: { email: { [require('sequelize').Op.iLike]: '%tourist.e2e.%' } }
      });

      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${user.email_verification_token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      await user.reload();
      expect(user.status).toBe('active');
    });
  });

  describe('Step 3: User Login', () => {
    it('should login with correct credentials', async () => {
      const user = await User.findOne({
        where: { email: { [require('sequelize').Op.iLike]: '%tourist.e2e.%' } }
      });
      user.status = 'active';
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'SecurePass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const user = await User.findOne({
        where: { email: { [require('sequelize').Op.iLike]: '%tourist.e2e.%' } }
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Step 4: Create Listing (Host)', () => {
    it('should create a listing', async () => {
      const user = await User.findOne({
        where: { email: { [require('sequelize').Op.iLike]: '%host.e2e.%' } }
      });
      user.status = 'active';
      await user.save();

      const response = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: 'Beautiful Mountain Cabin',
          type: 'accommodation',
          description: 'A wonderful cabin in the mountains',
          price_per_unit: 150000,
          capacity: 4,
          department: 'Antioquia',
          municipality: 'Guatape',
          categories: ['cabin', 'nature', 'hiking']
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      listingId = response.body.data.id;
    });

    it('should reject listing creation without auth', async () => {
      const response = await request(app)
        .post('/api/v1/listings')
        .send({
          title: 'Test Listing',
          type: 'accommodation',
          price_per_unit: 100000,
          capacity: 2
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-host from creating listing', async () => {
      const response = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          title: 'Tourist Listing',
          type: 'accommodation',
          price_per_unit: 100000,
          capacity: 2
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Step 5: List Listings', () => {
    it('should list all active listings', async () => {
      const response = await request(app)
        .get('/api/v1/listings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should search listings with filters', async () => {
      const response = await request(app)
        .get('/api/v1/listings?type=accommodation&department=Antioquia');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Step 6: Create Reservation', () => {
    it('should create a reservation', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          listing_id: listingId,
          check_in_date: '2025-12-01',
          check_out_date: '2025-12-03',
          guests_count: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.confirmation_code).toBeDefined();
      reservationId = response.body.data.id;
    });

    it('should calculate correct pricing', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          listing_id: listingId,
          check_in_date: '2025-12-10',
          check_out_date: '2025-12-12',
          guests_count: 2
        });

      expect(response.body.data.subtotal).toBe(600000);
      expect(response.body.data.platform_fee).toBe(60000);
      expect(response.body.data.total_amount).toBe(660000);
    });

    it('should reject reservation for same dates', async () => {
      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          listing_id: listingId,
          check_in_date: '2025-12-01',
          check_out_date: '2025-12-03',
          guests_count: 2
        });

      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          listing_id: listingId,
          check_in_date: '2025-12-02',
          check_out_date: '2025-12-04',
          guests_count: 2
        });

      expect(response.status).toBe(409);
    });

    it('should reject reservation without auth', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          listing_id: listingId,
          check_in_date: '2025-11-01',
          check_out_date: '2025-11-02',
          guests_count: 2
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Step 7: Get My Reservations', () => {
    it('should get tourist reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations/my')
        .set('Authorization', `Bearer ${touristToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should get host reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations/host')
        .set('Authorization', `Bearer ${hostToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Step 8: Create Payment', () => {
    it('should create payment intent', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ reservation_id: reservationId });

      expect(response.status).toBe(200);
      expect(response.body.data.client_secret).toBeDefined();
      expect(response.body.data.payment_intent_id).toBeDefined();
    });

    it('should reject payment for non-owner reservation', async () => {
      const newReservation = await Reservation.create({
        listing_id: listingId,
        tourist_id: (await User.findOne({ where: { email: { [require('sequelize').Op.iLike]: '%host.e2e.%' } } })).id,
        host_id: (await User.findOne({ where: { email: { [require('sequelize').Op.iLike]: '%host.e2e.%' } } })).id,
        check_in_date: '2025-11-15',
        check_out_date: '2025-11-16',
        guests_count: 2,
        subtotal: 300000,
        platform_fee: 30000,
        total_amount: 330000,
        status: 'pending',
        confirmation_code: 'PAYTEST123'
      });

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ reservation_id: newReservation.id });

      expect(response.status).toBe(403);
    });
  });

  describe('Step 9: Get Reservation Details', () => {
    it('should get reservation details for tourist', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${touristToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(reservationId);
    });

    it('should get reservation details for host', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject access for other users', async () => {
      const otherUser = await User.create({
        email: `other.${Date.now()}@example.com`,
        password_hash: '$2b$12$hashed',
        full_name: 'Other User',
        role: 'tourist',
        status: 'active'
      });

      const { generateToken } = require('../../../utils/jwt.utils');
      const otherToken = generateToken({ userId: otherUser.id, role: 'tourist' });

      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Step 10: Cancel Reservation', () => {
    it('should allow tourist to cancel', async () => {
      const newReservation = await Reservation.create({
        listing_id: listingId,
        tourist_id: (await User.findOne({ where: { email: { [require('sequelize').Op.iLike]: '%tourist.e2e.%' } } })).id,
        host_id: (await User.findOne({ where: { email: { [require('sequelize').Op.iLike]: '%host.e2e.%' } } })).id,
        check_in_date: '2025-11-20',
        check_out_date: '2025-11-21',
        guests_count: 2,
        subtotal: 300000,
        platform_fee: 30000,
        total_amount: 330000,
        status: 'pending',
        confirmation_code: 'CANCEL123'
      });

      const response = await request(app)
        .post(`/api/v1/reservations/${newReservation.id}/cancel`)
        .set('Authorization', `Bearer ${touristToken}`)
        .send({ reason: 'Changed plans' });

      expect(response.status).toBe(200);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/v1/listings/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: '',
          type: 'invalid_type',
          price_per_unit: -100
        });

      expect(response.status).toBe(400);
    });
  });
});