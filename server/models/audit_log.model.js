const mongoose = require('mongoose');
const { Schema } = mongoose;

// Audit Log Schema
const auditLogSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  action: String,
  entity_type: String,
  entity_id: Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
  details: Schema.Types.Mixed
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {AuditLog};