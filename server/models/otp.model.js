// server/models/otp.model.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  email: String,
  phone: String,
  otp: { type: String, required: true },
  purpose: { type: String, enum: ["registration", "password_reset", "login"], required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

module.exports = mongoose.model("OTP", otpSchema);
