const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Payment extends Model {}

Payment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reservation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'reservations', key: 'id' }
  },
  tourist_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_charge_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  platform_commission: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  host_payout: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'COP'
  },
  status: {
    type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  receipt_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments'
});

module.exports = Payment;