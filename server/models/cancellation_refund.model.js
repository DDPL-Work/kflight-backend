const mongoose = require('mongoose');
const { Schema } = mongoose;

// Cancellation & Refund Schema
const cancellationRefundSchema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  cancellation_reason: String,
  cancellation_policy: String,
  refund_amount: Number,
  currency: { type: String, default: 'USD' },
  refund_status: { 
    type: String, 
    enum: ['pending', 'processed', 'rejected'], 
    default: 'pending' 
  },
  initiated_by: { type: String, enum: ['user', 'admin'] },
  initiated_at: { type: Date, default: Date.now },
  processed_by: { type: Schema.Types.ObjectId, ref: 'Superadmin' },
  processed_at: Date,
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const CancellationRefund = mongoose.model('CancellationRefund', cancellationRefundSchema);

module.exports = { CancellationRefund };