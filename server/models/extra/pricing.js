// File: models/PricingConfig.js
const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['flight', 'hotel'],
    required: true
  },
  markupType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  markupValue: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  refundProtectionFee: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
pricingConfigSchema.index({ configType: 1, isActive: 1 });

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);