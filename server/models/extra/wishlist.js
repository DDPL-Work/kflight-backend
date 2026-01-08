import { Schema, model } from 'mongoose';

const WishlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  items: [{
    productType: { type: String, enum: ['flight','hotel'], required: true },
    supplier: { type: String, default: 'tripjack' },
    supplierRef: { type: String, required: true }, // e.g., hotelId or fareId
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

WishlistSchema.index({ userId: 1 });

export const Wishlist = model('Wishlist', WishlistSchema);