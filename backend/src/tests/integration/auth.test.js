const authService = require('../../../modules/auth/auth.service');
const {
  sequelize, User, HostProfile
} = require('../../../db/models');
const { AppError } = require('../../../middleware/errorHandler.middleware');

jest.mock('../../../config/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true })
}));

describe('Auth Service', () => {
  const testEmail = `auth.test.${Date.now()}@example.com`;

  afterEach(async () => {
    await User.destroy({ where: { email: { [require('sequelize').Op.iLike]: '%auth.test.%' } }, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('register', () => {
    it('should register a new tourist user', async () => {
      const result = await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Test User',
        phone: '+573001234567',
        role: 'tourist'
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.role).toBe('tourist');
      expect(result.user.status).toBe('pending_verification');
    });

    it('should create host profile for host role', async () => {
      const hostEmail = testEmail.replace('auth.test.', 'auth.host.');
      const result = await authService.register({
        email: hostEmail,
        password: 'Test1234!',
        full_name: 'Host Test User',
        role: 'host'
      });

      const hostProfile = await HostProfile.findOne({ where: { user_id: result.user.id } });
      expect(hostProfile).toBeDefined();
      expect(hostProfile.business_type).toBe('accommodation');
    });

    it('should reject duplicate email', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Test User',
        role: 'tourist'
      });

      await expect(authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Duplicate User',
        role: 'tourist'
      })).rejects.toThrow('correo electrónico ya está registrado');
    });

    it('should require password with complexity', async () => {
      await expect(authService.register({
        email: 'weak@example.com',
        password: 'weak',
        full_name: 'Weak User',
        role: 'tourist'
      })).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email and activate account', async () => {
      const user = await User.create({
        email: testEmail,
        password_hash: 'hashed',
        full_name: 'Verify Test',
        role: 'tourist',
        status: 'pending_verification',
        email_verification_token: 'test-token-123'
      });

      const result = await authService.verifyEmail('test-token-123');

      expect(result.message).toContain('verificado');

      await user.reload();
      expect(user.status).toBe('active');
      expect(user.email_verified_at).toBeDefined();
      expect(user.email_verification_token).toBeNull();
    });

    it('should reject invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token'))
        .rejects.toThrow('Token de verificación inválido');
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const user = await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Login Test',
        role: 'tourist'
      });

      const result = await authService.login(testEmail, 'Test1234!', '127.0.0.1');

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(testEmail);
    });

    it('should reject invalid email', async () => {
      await expect(authService.login('nonexistent@example.com', 'Test1234!', '127.0.0.1'))
        .rejects.toThrow('Credenciales inválidas');
    });

    it('should reject invalid password', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Login Test 2',
        role: 'tourist'
      });

      await expect(authService.login(testEmail, 'Wrong1234!', '127.0.0.1'))
        .rejects.toThrow('Credenciales inválidas');
    });

    it('should lock account after 5 failed attempts', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Lock Test',
        role: 'tourist'
      });

      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(testEmail, 'Wrong1234!', '127.0.0.1');
        } catch (e) {
        }
      }

      await expect(authService.login(testEmail, 'Test1234!', '127.0.0.1'))
        .rejects.toThrow(/bloqueada|15 minutos/);
    });

    it('should reject suspended account', async () => {
      const user = await User.create({
        email: testEmail,
        password_hash: '$2b$12$hashed',
        full_name: 'Suspended Test',
        role: 'tourist',
        status: 'suspended'
      });

      await expect(authService.login(testEmail, 'Test1234!', '127.0.0.1'))
        .rejects.toThrow('Cuenta suspendida');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Forgot Test',
        role: 'tourist'
      });

      const result = await authService.forgotPassword(testEmail);

      expect(result.message).toContain('recibirás');

      const user = await User.findOne({ where: { email: testEmail } });
      expect(user.password_reset_token).toBeDefined();
      expect(user.password_reset_expires).toBeDefined();
    });

    it('should return success for non-existent email (security)', async () => {
      const result = await authService.forgotPassword('nonexistent@example.com');
      expect(result.message).toContain('recibirás');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = await User.create({
        email: testEmail,
        password_hash: '$2b$12$hashed',
        full_name: 'Reset Test',
        role: 'tourist',
        status: 'active',
        password_reset_token: 'reset-token-123',
        password_reset_expires: new Date(Date.now() + 3600000)
      });

      const result = await authService.resetPassword('reset-token-123', 'NewPass123!');

      expect(result.message).toContain('actualizada');

      await user.reload();
      expect(user.password_reset_token).toBeNull();
      expect(user.password_reset_expires).toBeNull();
    });

    it('should reject expired token', async () => {
      await User.create({
        email: testEmail,
        password_hash: '$2b$12$hashed',
        full_name: 'Expired Test',
        role: 'tourist',
        status: 'active',
        password_reset_token: 'expired-token',
        password_reset_expires: new Date(Date.now() - 1000)
      });

      await expect(authService.resetPassword('expired-token', 'NewPass123!'))
        .rejects.toThrow('Token de recuperación inválido');
    });
  });
});