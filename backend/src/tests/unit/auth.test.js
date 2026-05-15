const authService = require('../../modules/auth/auth.service');
const { User, sequelize } = require('../../db/models');
const { generateToken, generateRefreshToken, verifyToken } = require('../../utils/jwt.utils');

jest.mock('../../config/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendAccountBlockedEmail: jest.fn().mockResolvedValue({ success: true })
}));

describe('Auth Service - Unit Tests', () => {
  const testEmail = `unit.auth.${Date.now()}@example.com`;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    await User.destroy({
      where: { email: { [require('sequelize').Op.iLike]: '%unit.auth.%' } },
      force: true
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: '123', role: 'tourist' };
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include userId and role in token payload', () => {
      const payload = { userId: 'test-id-123', role: 'host' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe('test-id-123');
      expect(decoded.role).toBe('host');
    });

    it('should have 24h expiration', () => {
      const payload = { userId: '123', role: 'tourist' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      const expDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const hoursDiff = (expDate - now) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThanOrEqual(24);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with 7 days expiration', () => {
      const payload = { userId: '123', role: 'tourist' };
      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      const decoded = verifyToken(token);
      const expDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const daysDiff = (expDate - now) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(6);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Refresh Test',
        role: 'tourist'
      });

      const user = await User.findOne({ where: { email: testEmail } });
      user.status = 'active';
      await user.save();

      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
      const result = await authService.refreshToken(refreshToken);

      expect(result.token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid.token.here'))
        .rejects.toThrow('Token de refresh inválido');
    });

    it('should reject refresh token for inactive user', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Inactive Test',
        role: 'tourist'
      });

      const user = await User.findOne({ where: { email: testEmail } });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      await user.update({ status: 'suspended' });

      await expect(authService.refreshToken(refreshToken))
        .rejects.toThrow('Token inválido');
    });
  });

  describe('Account Lockout', () => {
    it('should reset failed attempts after successful login', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Reset Attempts Test',
        role: 'tourist'
      });

      const user = await User.findOne({ where: { email: testEmail } });
      await user.update({ status: 'active' });

      await authService.login(testEmail, 'Test1234!', '127.0.0.1');

      await user.reload();
      expect(user.failed_login_attempts).toBe(0);
      expect(user.locked_until).toBeNull();
    });

    it('should increment failed attempts on wrong password', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Increment Test',
        role: 'tourist'
      });

      const user = await User.findOne({ where: { email: testEmail } });
      await user.update({ status: 'active' });

      try {
        await authService.login(testEmail, 'WrongPassword!', '127.0.0.1');
      } catch (e) {}

      await user.reload();
      expect(user.failed_login_attempts).toBe(1);
    });

    it('should unlock after 15 minutes', async () => {
      await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Unlock Test',
        role: 'tourist'
      });

      const user = await User.findOne({ where: { email: testEmail } });
      await user.update({
        status: 'active',
        locked_until: new Date(Date.now() - 60000)
      });

      const result = await authService.login(testEmail, 'Test1234!', '127.0.0.1');
      expect(result.token).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await authService.logout('some-user-id');
      expect(result.message).toContain('cerrada');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt factor 12', async () => {
      const user = await authService.register({
        email: testEmail,
        password: 'Test1234!',
        full_name: 'Bcrypt Test',
        role: 'tourist'
      });

      const dbUser = await User.findOne({ where: { email: testEmail } });
      expect(dbUser.password_hash).not.toBe('Test1234!');
      expect(dbUser.password_hash).toMatch(/^\$2b\$12\$.+/);
    });

    it('should reject weak passwords', async () => {
      await expect(authService.register({
        email: testEmail,
        password: '123',
        full_name: 'Weak Password Test',
        role: 'tourist'
      })).rejects.toThrow();
    });
  });
});