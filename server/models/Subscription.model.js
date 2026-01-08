// subscription.model.js

const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  subscribedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "unsubscribed"], default: "active" },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
