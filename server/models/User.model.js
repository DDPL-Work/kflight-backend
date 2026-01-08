// server/models/User.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: String,

  // Verification
  email_verified: { type: Boolean, default: false },
  phone_verified: { type: Boolean, default: true },

  // Basic Info
  first_name: String,
  middle_name: String,
  last_name: String,
  gender: String,
  date_of_birth: Date,
  nationality: String,
  marital_status: String,
  anniversary: Date,
  city_of_residence: String,
  state: String,

  // Contact Info
  country_code: String,
  country: String,

  // Document Info
  passport_no: String,
  passport_expiry: Date,
  issuing_country: String,
  pan_card_number: String,

  // Profile completion flag
  isProfileComplete: { type: Boolean, default: false },
profileCompletionNotified: { type: Boolean, default: false },

  fcmToken: { type: String, default: "" },
welcomeMailSent: { type: Boolean, default: false },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
