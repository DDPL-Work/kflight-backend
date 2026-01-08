// server/models/payment.model.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, index: true }, // TripJack bookingId
    snapshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceSnapshot",
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    gateway: {
      type: String,
      enum: ["razorpay"],
      required: true,
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "REFUNDED"],
      default: "CREATED",
    },

    gatewayResponse: mongoose.Schema.Types.Mixed,

    createdAt: { type: Date, default: Date.now },
    paidAt: Date,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Payment", paymentSchema);
