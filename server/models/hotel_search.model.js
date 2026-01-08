// Hotel Search Model
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Hotel Search Schema
const hotelSearchSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  session_id: String,
  destination: String,
  check_in_date: Date,
  check_out_date: Date,
  rooms: Number,
  adults: Number,
  children: Number,
  search_results_count: Number,
  created_at: { type: Date, default: Date.now }
});


const HotelSearch = mongoose.model('HotelSearch', hotelSearchSchema);

module.exports = { HotelSearch };