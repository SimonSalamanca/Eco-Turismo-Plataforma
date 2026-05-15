const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Subscription extends Model {}

Subscription.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  host_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  plan: {
    type: DataTypes.ENUM('basic', 'premium', 'pro'),
    defaultValue: 'basic'
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'annual'),
    defaultValue: 'monthly'
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'past_due', 'trialing'),
    defaultValue: 'trialing'
  },
  stripe_subscription_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_price_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Subscription',
  tableName: 'subscriptions',
  indexes: [
    { fields: ['host_id', 'status'] },
    { fields: ['stripe_subscription_id'] }
  ]
});

module.exports = Subscription;