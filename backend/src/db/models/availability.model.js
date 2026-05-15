const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Availability extends Model {}

Availability.init({
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'blocked', 'special_price'),
    defaultValue: 'available'
  },
  special_price: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reservation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'reservations', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'Availability',
  tableName: 'availability',
  indexes: [
    { fields: ['listing_id', 'date'] },
    { fields: ['listing_id', 'status'] }
  ]
});

module.exports = Availability;