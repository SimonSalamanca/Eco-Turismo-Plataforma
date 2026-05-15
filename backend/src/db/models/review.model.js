const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Review extends Model {}

Review.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reservation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'reservations', key: 'id' }
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
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  host_response: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  host_responded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Review',
  tableName: 'reviews',
  indexes: [
    { fields: ['listing_id'] },
    { fields: ['tourist_id'] }
  ]
});

module.exports = Review;