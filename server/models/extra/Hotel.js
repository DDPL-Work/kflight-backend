const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  amenities: {
    type: [String],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  }
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
