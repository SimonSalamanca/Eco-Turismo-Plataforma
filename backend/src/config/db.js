const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.url, {
  dialect: env.db.dialect,
  pool: env.db.pool,
  logging: env.db.logging,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    if (env.nodeEnv === 'development' && process.env.USE_MIGRATIONS !== 'true') {
      console.log('⚠️ Skipping automatic sync (USE_MIGRATIONS=false) - using manual SQL schema');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };