const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  images: [{ type: String }], // URLs
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Newsletter", NewsletterSchema);
