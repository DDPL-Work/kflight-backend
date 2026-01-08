// server/models/Booking.model.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      index: true,
      unique: true
    },

    snapshotIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceSnapshot",
      required: true
    }],

    priceIds: [{
      type: String,
      required: true
    }],

    travellerInfo: {
      type: Array,
      required: true
    },

    contactInfo: Object,

    status: {
      type: String,
      enum: [
        "REVIEWED",
        "HOLD",
        "FARE_VALIDATED",
        "TICKETED",
        "FAILED",
        "EXPIRED"
      ],
      default: "REVIEWED"
    },

    supplierPNR: String,
    ticketNumbers: [String],

    supplierFare: Number,
    finalFare: Number,
    markupApplied: Number,

    errors: Array
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
