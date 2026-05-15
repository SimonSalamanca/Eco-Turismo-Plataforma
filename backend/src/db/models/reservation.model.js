const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Reservation extends Model {}

Reservation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  listing_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'listings', key: 'id' }
  },
  tourist_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  host_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  guests_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  subtotal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  platform_fee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  cancellation_reason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.ENUM('tourist', 'host', 'admin'),
    allowNull: true
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  confirmation_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Reservation',
  tableName: 'reservations',
  indexes: [
    { fields: ['tourist_id', 'status'] },
    { fields: ['host_id', 'status'] },
    { fields: ['listing_id'] },
    { fields: ['confirmation_code'] }
  ]
});

module.exports = Reservation;