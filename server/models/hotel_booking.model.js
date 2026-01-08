const mongoose = require('mongoose');
const { Schema } = mongoose;

// Hotel Booking Schema
const hotelBookingSchema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  hotel_id: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  room_type: String,
  guest_details: Schema.Types.Mixed,
  special_requests: String,
  meal_plan: String
});

const HotelBooking = mongoose.model('HotelBooking', hotelBookingSchema);

module.exports = { HotelBooking };