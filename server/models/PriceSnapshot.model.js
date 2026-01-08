// models/PriceSnapshot.model.js

const mongoose = require("mongoose");

const PriceSnapshotSchema = new mongoose.Schema(
  {
    searchSessionId: { type: String, required: true },

    priceId: { type: String, required: true, index: true },
    tripType: String,
    routeIndex: Number,

    supplierFare: Number,
    finalFare: Number,
    markupApplied: Number,
// 🔐 PRICE LOCK (POST REVIEW)
reviewedSupplierFare: Number,
reviewedFinalFare: Number,

// 📦 FINAL BOOKING
finalBookingId: String,
bookedAt: Date,

    pricingRules: [
      {
        ruleId: mongoose.Schema.Types.ObjectId,
        name: String,
        markupType: String,
        markupValue: Number,
        platformFee: Number,
        precedence: Number,
      },
    ],

    currency: { type: String, default: "INR" },

    // 🔑 REVIEW STATE
    isReviewed: { type: Boolean, default: false },
    reviewBookingId: { type: String },
    reviewedSupplierFare: Number,
    reviewedFinalFare: Number,
    fareAlert: Boolean,
    reviewedAt: Date,

    // ⏱ EXPIRY (TTL SOURCE OF TRUTH)
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ==================================================
// ✅ TTL INDEX → AUTO DELETE EXPIRED SNAPSHOTS
// ==================================================
PriceSnapshotSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("PriceSnapshot", PriceSnapshotSchema);
