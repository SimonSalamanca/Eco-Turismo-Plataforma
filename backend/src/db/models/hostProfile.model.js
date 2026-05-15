const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class HostProfile extends Model {}

HostProfile.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  business_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  business_type: {
    type: DataTypes.ENUM('accommodation', 'activity', 'both'),
    defaultValue: 'accommodation'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  municipality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bank_info_encrypted: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscription_plan: {
    type: DataTypes.ENUM('basic', 'premium', 'pro'),
    defaultValue: 'basic'
  },
  subscription_status: {
    type: DataTypes.ENUM('active', 'cancelled', 'past_due', 'trialing'),
    defaultValue: 'trialing'
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'HostProfile',
  tableName: 'host_profiles'
});

module.exports = HostProfile;