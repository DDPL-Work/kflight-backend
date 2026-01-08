// models/PriceAudit.model.js
const mongoose = require("mongoose");

const PriceAuditSchema = new mongoose.Schema({
  sourceType: { 
    type: String, 
    enum: [
      "flight",
      "hotel",
      "manual",
      "tripjack",
      "flight_search",
      "system"
    ], 
    required: true 
  },

  sourceId: String, // tripjack id or internal id

  baseFare: { type: Number, required: true },

  currency: { type: String, default: "INR" },

  appliedRules: [
    {
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "PricingRule" },
      name: String,
      markupApplied: Number,
      platformFeeApplied: Number,
      resultingFare: Number
    }
  ],

  finalFare: { type: Number, required: true },

  computedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

  meta: { type: mongoose.Schema.Types.Mixed, default: {} }

}, { timestamps: true });

module.exports = mongoose.model("PriceAudit", PriceAuditSchema);
