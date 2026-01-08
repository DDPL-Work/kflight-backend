// server-render-kflight/server/models/Amendment.model.js

const mongoose = require("mongoose");

const AmendmentSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  amendmentId: { type: String, required: true, unique: true },

  type: { type: String, enum: ["CANCELLATION"], required: true },
  status: String,

  amendmentCharges: Number,
  refundableAmount: Number,

  requestPayload: Object,
  responsePayload: Object,

  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model("Amendment", AmendmentSchema);
