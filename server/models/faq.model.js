const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },        // optional ordering
    is_hidden: { type: Boolean, default: false } // admin can hide individual items
  },
  { timestamps: false }
);

const faqSchema = new mongoose.Schema(
  {
    // Document applies to one or more page slugs. Use '*' for global.
    pageSlugs: { type: [String], default: ['*'], index: true },

    // The actual array of Q/A items
    faqs: { type: [faqItemSchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    is_deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index for quick lookup by pageSlug
faqSchema.index({ pageSlugs: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
