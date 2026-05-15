const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class ContentReport extends Model {}

ContentReport.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reporter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  content_type: {
    type: DataTypes.ENUM('listing', 'review'),
    allowNull: false
  },
  content_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'edited', 'removed'),
    defaultValue: 'pending'
  },
  resolved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ContentReport',
  tableName: 'content_reports',
  indexes: [
    { fields: ['content_type', 'content_id'] },
    { fields: ['status'] }
  ]
});

module.exports = ContentReport;