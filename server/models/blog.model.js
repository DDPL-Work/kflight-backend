const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  text: { type: String, required: true },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
  moderatedAt: Date,
  meta: { type: Schema.Types.Mixed, default: {} }
}, { _id: true });

const ImageSchema = new Schema({
  url: String,
  alt: { type: String, default: '' },
  public_id: { type: String, default: null }
}, { _id: false });

const SectionSchema = new Schema({
  sub_title: String,
  body: String,
  image: ImageSchema
}, { _id: false });

const BlogSchema = new Schema({
  author: { type: String, required: true },
  author_id: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },

  title: { type: String, required: true },
  summary: { type: String, default: '' },
  sub_title: { type: String, default: '' },
  content: { type: String, required: true },

  slug: { type: String, required: true, unique: true, index: true },
  blog_url: { type: String, required: true },

  featured_image: { type: ImageSchema, default: null },
  body_image: { type: ImageSchema, default: null },
  sections: [SectionSchema],

  categories: [{ type: String, required: true }],
  tags: [{ type: String }],

  meta_title: { type: String, required: true, maxlength: 60 },
  meta_description: { type: String, required: true, maxlength: 160 },
  meta_keywords: [{ type: String }],
  image_alt_text: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'approved', 'published', 'rejected', 'archived'], 
    default: 'draft' 
  },
  published_at: { type: Date, default: null },
  rejection_reason: { type: String, default: '' }, 

  view_count: { type: Number, default: 0 },
  seo_score: { type: Number, default: 0 },
  comments: [CommentSchema],

  is_deleted: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// text index
BlogSchema.index({
  title: 'text',
  summary: 'text',
  content: 'text',
  meta_title: 'text',
  meta_description: 'text'
}, {
  weights: { title: 5, meta_title: 4, summary: 3, content: 1 },
  name: 'BlogTextIndex'
});

BlogSchema.index({ status: 1, published_at: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ categories: 1 });

module.exports = mongoose.model('Blog', BlogSchema);
