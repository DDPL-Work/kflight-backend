// models/PricingRule.model.js

const mongoose = require("mongoose");

const PricingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },

  serviceType: {
    type: String,
    enum: ["flight", "hotel"],
    required: true
  },

  markupType: { type: String, enum: ["flat", "percent"], required: true },
  markupValue: { type: Number, required: true },

  platformFee: { type: Number, default: 0 },

  // 🔹 FLIGHT ONLY
  airlines: [{ type: String }],
  routes: [{ from: String, to: String }],

  // 🔹 HOTEL ONLY
  hotelIds: [{ type: String }],
  cities: [{ type: String }],
  countries: [{ type: String }],
  ratings: [{ type: Number }],

  region: { type: String, default: "global" },

  conditions: {
    minFare: { type: Number, default: 0 },
    maxFare: { type: Number, default: 99999999 }
  },

  precedence: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("PricingRule", PricingRuleSchema);
