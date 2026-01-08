const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  pageType: { type: String, enum: ['Page','Hotel','Post','Offer','Flight'], required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, required: false },
  status: { type: String, enum: ['draft','published'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
}, { timestamps: true });

// Index for fast lookup
seoSchema.index({ slug: 1 });
seoSchema.index({ status: 1, pageType: 1 });

module.exports = mongoose.model('SEO', seoSchema);
