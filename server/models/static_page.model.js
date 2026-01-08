const mongoose = require('mongoose');
const { Schema } = mongoose;

const staticPageSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: String,
  meta_title: String,
  meta_description: String,
  created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
  updated_at: { type: Date, default: Date.now }
});

const StaticPage = mongoose.model('StaticPage', staticPageSchema);

module.exports = { StaticPage };