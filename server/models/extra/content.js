// import { Schema, model } from 'mongoose';
const { Schema, model } = require('mongoose');

const SeoPageSchema = new Schema({
  slug: { type: String, required: true, unique: true }, // e.g., '/hotels/mumbai-5-star'
  title: { type: String, required: true },
  description: { type: String },
  keywords: [{ type: String }],
  meta: { type: Schema.Types.Mixed }, // OpenGraph, etc.
  sitemapInclude: { type: Boolean, default: true }
}, { timestamps: true });

 const SeoPage = model('SeoPage', SeoPageSchema);

const BlogPostSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true }, // HTML/MD
  coverImageUrl: { type: String },
  categories: [{ type: String }],
  tags: [{ type: String }],
  language: { type: String, default: 'en' },
  status: { type: String, enum: ['draft','pending_approval','published'], default: 'draft', index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date, index: true }
}, { timestamps: true });

BlogPostSchema.index({ status: 1, publishedAt: -1 });

 const BlogPost = model('BlogPost', BlogPostSchema);

const OfferSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  couponCode: { type: String },
  imageUrl: { type: String },
  productType: { type: String, enum: ['flight','hotel','any'], default: 'any' },
  active: { type: Boolean, default: true, index: true },
  startsAt: { type: Date, index: true },
  endsAt: { type: Date, index: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  meta: { type: Schema.Types.Mixed } // link to TripJack deals if needed
}, { timestamps: true });

OfferSchema.index({ active: 1, startsAt: 1, endsAt: 1 });

 const Offer = model('Offer', OfferSchema);

 module.exports = {
   SeoPage,
   BlogPost,
   Offer
 };