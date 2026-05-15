require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'ecoturismo',
    user: process.env.DB_USER || 'ecoturismo',
    password: process.env.DB_PASSWORD || 'ecoturismo123',
    dialect: 'postgres',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379
  },

  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY || 'dummy-secret-key-for-development-only-32chars',
    publicKey: process.env.JWT_PUBLIC_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2023-10-16'
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@ecoturismo.com'
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  },

  encryption: {
    aesSecretKey: process.env.AES_SECRET_KEY
  },

  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10485760,
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(',')
  },

  plans: {
    basic: { price: 0, photos: 5, listings: 2, badge: 'none', search_boost: 0 },
    premium: { price: 49900, photos: 15, listings: 5, badge: 'premium', search_boost: 1 },
    pro: { price: 99900, photos: 30, listings: null, badge: 'pro', search_boost: 2 }
  },

  platform: {
    fee: 0.10,
    currency: 'COP'
  }
};