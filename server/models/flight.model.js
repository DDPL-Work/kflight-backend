// Flight Model


const mongoose = require('mongoose');
const { Schema } = mongoose;


// Flight Schema
const flightSchema = new Schema({
  tripjack_id: String,
  airline_code: String,
  airline_name: String,
  flight_number: String,
  departure_airport_code: String,
  departure_airport_name: String,
  departure_city: String,
  departure_country: String,
  arrival_airport_code: String,
  arrival_airport_name: String,
  arrival_city: String,
  arrival_country: String,
  departure_time: Date,
  arrival_time: Date,
  duration: Number,
  stops: Number,
  fare_details: Schema.Types.Mixed,
  cabin_class: String,
  aircraft_type: String,
  available_seats: Number,
  last_updated: Date,
  raw_data: Schema.Types.Mixed,
  version: { type: Number, default: 1 },
  backup_data: Schema.Types.Mixed,
    basePrice: { type: Number, default: 0 },        // base (fare + tax) used for pricing
  finalPrice: { type: Number, default: 0 },       // after markups/fees
  priceBreakdown: { type: Schema.Types.Mixed },   // array of applied rules {ruleId,name,markup,fee,resultingFare}
  last_priced_at: Date,
  created_by: { type: Schema.Types.ObjectId, ref: 'Staff' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'Staff' }
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = { Flight };