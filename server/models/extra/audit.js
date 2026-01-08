// import { Schema, model } from 'mongoose';
// import { ActorRefSchema } from './common.js';
const  { Schema, model } = require('mongoose');
const { ActorRefSchema } = require('./common.js');

const AuditLogSchema = new Schema({
  action: { type: String, required: true }, 
  entity: {
    collection: { type: String, required: true },
    id: { type: String, required: true }
  },
  actor: { type: ActorRefSchema },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });
AuditLogSchema.index({ 'entity.collection': 1, 'entity.id': 1, createdAt: -1 });

const AuditLog = model('AuditLog', AuditLogSchema);

module.exports = AuditLog;