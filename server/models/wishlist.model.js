const mongoose = require('mongoose');
const { Schema } = mongoose;

// Wishlist Schema
const wishlistSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  is_public: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = { Wishlist };