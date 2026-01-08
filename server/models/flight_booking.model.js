// server-render-kflight/server/models/flight_booking.model.js

const mongoose = require("mongoose");

const FlightBookingSchema = new mongoose.Schema({
  searchSessionId: { type: String, required: true },
  snapshotId: { type: mongoose.Schema.Types.ObjectId, ref: "PriceSnapshot", required: true },

  bookingId: { type: String, required: true }, // TripJack final PNR
  status: { type: String, default: "BOOKED" },

  travellers: [
    {
      ti: String,
      pt: String,
      fN: String,
      lN: String,
      dob: String,
      pNum: String,
      eD: String,
      pNat: String,
      pid: String,
      di: String,
      ssrBaggageInfos: [{ key: String, code: String }],
      ssrMealInfos: [{ key: String, code: String }],
      ssrSeatInfos: [{ key: String, code: String }],
      ssrExtraServiceInfos: [{ key: String, code: String }],
    },
  ],

  flightSegments: [
    {
      segmentId: String,
      from: String,
      to: String,
      departure: Date,
      arrival: Date,
      airlineCode: String,
      flightNumber: String,
    },
  ],

  fare: {
    supplierFare: Number,
    finalFare: Number,
    markup: Number,
    seatTotal: Number,
    currency: { type: String, default: "INR" },
  },

  gstInfo: {
    gstNumber: String,
    registeredName: String,
    email: String,
    mobile: String,
    address: String,
  },

  deliveryInfo: {
    emails: [String],
    contacts: [String],
  },

  contactInfo: {
    ecn: String,
    emails: [String],
    contacts: [String],
  },
notificationSent: { type: Boolean, default: false },

  bookedAt: Date,
  ticketedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("FlightBooking", FlightBookingSchema);
