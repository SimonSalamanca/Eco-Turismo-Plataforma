const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Listing extends Model {}

Listing.init({
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('accommodation', 'activity'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price_per_unit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'deleted'),
    defaultValue: 'active'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  municipality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  photos: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  average_rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  badge: {
    type: DataTypes.ENUM('none', 'premium', 'pro'),
    defaultValue: 'none'
  },
  search_boost: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Listing',
  tableName: 'listings',
  indexes: [
    { fields: ['department', 'municipality'] },
    { fields: ['latitude', 'longitude'] },
    { fields: ['host_id'] },
    { fields: ['status', 'type'] }
  ]
});

module.exports = Listing;