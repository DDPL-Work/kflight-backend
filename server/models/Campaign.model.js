const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["deal", "announcement", "offer", "newsletter", "custom"], default: "custom" },

  subject: { type: String, required: true },
  message: { type: String, required: true }, // HTML content

  attachments: [{ url: String, filename: String }],

  target: {
    region: { type: String },
    date: { type: Date }
  },

  scheduleDate: {
    date: { type: Date },
    isSent: { type: Boolean, default: false }
  },

  stats: {
    totalSubscribers: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },

  // UPDATED: Added approval workflow statuses
  status: { 
    type: String, 
    enum: ["draft", "pending_approval", "approved", "rejected", "scheduled", "sent"], 
    default: "draft" 
  },

  // NEW: Rejection reason
  rejectionReason: { type: String },

  // NEW: Approved by Super Admin
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  approvedAt: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
}, { timestamps: true });

module.exports = mongoose.model("Campaign", CampaignSchema);
