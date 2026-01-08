// models/HotelPriceSnapshot.model.js

const mongoose = require("mongoose");

const HotelPriceSnapshotSchema = new mongoose.Schema({
  searchSessionId: { type: String, required: true },

  hotelId: String,
  optionId: String,
  roomId: String,

  supplierFare: Number,
  finalFare: Number,
  markupApplied: Number,

  pricingRules: [Object],

  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model(
  "HotelPriceSnapshot",
  HotelPriceSnapshotSchema
);
