// import { Schema, model } from 'mongoose';
const { Schema, model } = require('mongoose');

// Ephemeral caches (TTL) – results from TripJack searches
const FlightOfferCacheSchema = new Schema({
  searchHash: { type: String, index: true }, // hash of search params
  offers: { type: Schema.Types.Mixed },      // as returned (normalized if needed)
  ttlAt: { type: Date, index: true }
}, { timestamps: true });

FlightOfferCacheSchema.index({ ttlAt: 1 }, { expireAfterSeconds: 0 });
 const FlightOfferCache = model('FlightOfferCache', FlightOfferCacheSchema);

const HotelOfferCacheSchema = new Schema({
  searchHash: { type: String, index: true },
  offers: { type: Schema.Types.Mixed },
  ttlAt: { type: Date, index: true }
}, { timestamps: true });

HotelOfferCacheSchema.index({ ttlAt: 1 }, { expireAfterSeconds: 0 });
const HotelOfferCache = model('HotelOfferCache', HotelOfferCacheSchema);

module.exports = {
  FlightOfferCache,
  HotelOfferCache
};