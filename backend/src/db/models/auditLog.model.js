const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/db');

class AuditLog extends Model {}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  old_value: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  new_value: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  indexes: [
    { fields: ['admin_id', 'created_at'] },
    { fields: ['entity_type', 'entity_id'] }
  ]
});

module.exports = AuditLog;