// server-render-kflight/server/models/Notification.model.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null
  },

  title: { type: String, required: true },
  message: { type: String, required: true },

  type: {
  type: String,
  enum: ["SYSTEM", "BOOKING", "PAYMENT", "ALERT", "ERROR", "PROFILE", "CAMPAIGN", "BLOG", "OFFER", "SUBSCRIPTION"],
  default: "SYSTEM"
},


  meta: { type: Object, default: {} },

  isRead: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ staffId: 1, createdAt: -1 });

// Optional safety (recommended)
notificationSchema.pre("save", function (next) {
  if (!this.userId && !this.staffId) {
    return next(new Error("Notification must belong to a user or staff"));
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
