// // server/models/Session.model.js
// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const sessionSchema = new Schema({
//   staff: {
//     type: Schema.Types.ObjectId,
//     ref: "Staff",
//     required: true,
//   },
//   token: {
//     type: String,
//     required: true,
//     unique: true, // ✅ prevents duplicate sessions with same token
//   },
//   deviceInfo: {
//     ip: String,
//     userAgent: String,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     expires: "7d", // ✅ auto-delete session after 7 days (MongoDB TTL index)
//   },
// });

// module.exports = mongoose.model("Session", sessionSchema);



const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  deviceInfo: {
    ip: String,
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    deviceType: String,
    deviceVendor: String,
    deviceModel: String,
  },
  location: {
    city: String,
    region: String,
    country: String,
  },
  loginTime: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("Session", SessionSchema);
