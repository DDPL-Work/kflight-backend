// import { Schema, model } from 'mongoose';
const { Schema, model } = require('mongoose');

const SupplierConfigSchema = new Schema({
  supplier: { type: String, enum: ['tripjack'], default: 'tripjack', unique: true },
  enabled: { type: Boolean, default: true },
  credentials: {
    apiKey: { type: String },
    secret: { type: String },
    sandbox: { type: Boolean, default: true }
  },
  rateLimitsPerMin: { type: Number, default: 60 }
}, { timestamps: true });

const SupplierConfig = model('SupplierConfig', SupplierConfigSchema);

// Optional: request/response store & webhook logs
const WebhookLogSchema = new Schema({
  provider: { type: String, required: true }, // 'tripjack','razorpay','stripe','mailchimp'
  eventType: { type: String },
  externalId: { type: String, index: true },
  payload: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['received','processed','failed'], default: 'received' },
  error: { type: String }
}, { timestamps: true });

WebhookLogSchema.index({ provider: 1, externalId: 1 });

const WebhookLog = model('WebhookLog', WebhookLogSchema);

module.exports = {
  SupplierConfig,
  WebhookLog
};