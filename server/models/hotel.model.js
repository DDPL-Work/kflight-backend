// Hotel Model

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Hotel Schema
const hotelSchema = new Schema({
  tripjack_id: String,
  name: String,
  chain: String,
  rating: Number,
  address: String,
  city: String,
  state: String,
  country: String,
  zip_code: String,
  latitude: Number,
  longitude: Number,
  description: String,
  amenities: Schema.Types.Mixed,
  room_types: Schema.Types.Mixed,
  basePrice: { type: Number, default: 0 },
finalPrice: { type: Number, default: 0 },
priceBreakdown: { type: Schema.Types.Mixed },
last_priced_at: Date,
  images: Schema.Types.Mixed,
  check_in_time: String,
  check_out_time: String,
  policies: Schema.Types.Mixed,
  contact_info: Schema.Types.Mixed,
  last_updated: Date,
  raw_data: Schema.Types.Mixed,
  created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'Admin' }
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = { Hotel };