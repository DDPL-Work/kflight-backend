const mongoose = require("mongoose");

const bookingSeatSchema = new mongoose.Schema({
  bookingId: { type: String, index: true },
  travellerIndex: Number,
  segmentId: String,
  seatCode: String,
  price: Number,
  expiresAt: { type: Date, index: { expires: 0 } },
});

module.exports = mongoose.model("BookingSeat", bookingSeatSchema);
