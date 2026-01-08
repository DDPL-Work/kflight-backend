const mongoose = require('mongoose');
const { Schema } = mongoose;

// Review Schema
const reviewSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking' },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  comment: String,
  review_type: { type: String, enum: ['flight', 'hotel'], required: true },
  flight_id: { type: Schema.Types.ObjectId, ref: 'Flight' },
  hotel_id: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  status: { 
    type: String, 
    enum: ['approved', 'pending', 'rejected'], 
    default: 'pending' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Review };