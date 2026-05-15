const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class Favorite extends Model {}

Favorite.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tourist_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  listing_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'listings', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'Favorite',
  tableName: 'favorites',
  indexes: [
    { unique: true, fields: ['tourist_id', 'listing_id'] },
    { fields: ['tourist_id'] },
    { fields: ['listing_id'] }
  ]
});

module.exports = Favorite;