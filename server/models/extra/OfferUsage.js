// models/OfferUsage.js

const mongoose = require('mongoose');

const OfferUsageSchema = new mongoose.Schema({
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false },
  eventType: { type: String, enum: ['impression', 'click', 'redeem'], required: true },
  valueCaptured: { type: Number, default: 0 }, // e.g., discount value at redemption
  currency: { type: String, default: process.env.DEFAULT_CURRENCY || 'USD' },
  ip: String,
  userAgent: String,
  meta: { type: Object, default: {} },
}, { timestamps: true });

OfferUsageSchema.index({ offerId: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.models.OfferUsage || mongoose.model('OfferUsage', OfferUsageSchema);
