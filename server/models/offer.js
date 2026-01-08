// const mongoose = require('mongoose');

// const OfferSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   price: { type: Number, required: true },
//   createdAt: { type: Date, default: Date.now },
//   revoked: { type: Boolean, default: false },
//   isUsed: { type: Boolean, default: false },
//   usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   usedAt: { type: Date },
// });

// module.exports = mongoose.model('Offer', OfferSchema);


const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },  
  description: String,
  type: { type: String, enum: ['percentage','fixed','coupon','bundle','tripjack'], default: 'percentage' },
  value: { type: Number, required: true },  
  currency: { type: String, default: process.env.DEFAULT_CURRENCY || 'USD' },
  code: { type: String },  
  minSpend: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 0 },  
  perUserLimit: { type: Number, default: 0 },  
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date, default: null },
  onlyForMembers: { type: Boolean, default: false },
  active: { type: Boolean, default: null },
    imageUrl: String, 
  metadata: { type: Object, default: {} },  
  linkedTripjackReference: { type: String, default: null },  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// helpful index for active offers
OfferSchema.index({ active: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model('Offer', OfferSchema);
