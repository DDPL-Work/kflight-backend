// Flight Search Model

const mongoose = require('mongoose');
const { Schema } = mongoose;


const flightSearchSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  session_id: String,
  origin: String,
  destination: String,
  departure_date: Date,
  return_date: Date,
  adults: Number,
  children: Number,
  infants: Number,
  cabin_class: String,
  direct_flights_only: Boolean,
  search_results_count: Number,
  created_at: { type: Date, default: Date.now }
});

const FlightSearch = mongoose.model('FlightSearch', flightSearchSchema);

module.exports = { FlightSearch };