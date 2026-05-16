require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler.middleware');
const { generalLimiter, authLimiter } = require('./src/middleware/rateLimit.middleware');

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Eco Turismo Experiencial API',
      version: '1.0.0',
      description: 'API REST para reservas de alojamientos rurales y actividades de naturaleza en Colombia'
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Servidor de desarrollo' }
    ]
  },
  apis: ['./swagger.yaml']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const authRoutes = require('./src/modules/auth/auth.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const listingsRoutes = require('./src/modules/listings/listings.routes');
const reservationsRoutes = require('./src/modules/reservations/reservations.routes');
const paymentsRoutes = require('./src/modules/payments/payments.routes');
const reviewsRoutes = require('./src/modules/reviews/reviews.routes');
const subscriptionsRoutes = require('./src/modules/subscriptions/subscriptions.routes');
const adminRoutes = require('./src/modules/admin/admin.routes');
const notificationsRoutes = require('./src/modules/notifications/notifications.routes');
const availabilityRoutes = require('./src/modules/availability/availability.routes');
const favoritesRoutes = require('./src/modules/favorites/favorites.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  skip: (req) => req.url === '/health'
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: 'unknown',
    redis: 'unknown'
  };

  try {
    const { sequelize } = require('./src/config/db');
    await sequelize.authenticate();
    health.db = 'ok';
  } catch {
    health.db = 'error';
    health.status = 'degraded';
  }

  try {
    const { redis } = require('./src/config/redis');
    await redis.ping();
    health.redis = 'ok';
  } catch {
    health.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/listings/:id/availability', availabilityRoutes);
app.use('/api/v1/reservations', reservationsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/favorites', favoritesRoutes);

app.use('/api/v1/search', require('./src/modules/search/search.routes'));
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    console.log('✅ All services connected');

    try {
      const { startCronJobs } = require('./src/modules/notifications/cron.service');
      startCronJobs();
    } catch (e) {
      console.warn('Cron jobs skipped (requires Redis):', e.message);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };