const mongoose = require('mongoose');
const { Schema } = mongoose;

// Wishlist Item Schema
const wishlistItemSchema = new Schema({
  wishlist_id: { type: Schema.Types.ObjectId, ref: 'Wishlist', required: true },
  item_type: { type: String, enum: ['flight', 'hotel'], required: true },
  flight_id: { type: Schema.Types.ObjectId, ref: 'Flight' },
  hotel_id: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  added_at: { type: Date, default: Date.now },
  notes: String
});

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

module.exports = { WishlistItem };