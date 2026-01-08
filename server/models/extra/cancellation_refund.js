// import { Schema, model } from 'mongoose';
// import { MoneySchema } from './common.js';
const { Schema, model } = require('mongoose');
const { MoneySchema }  = require('./common.js');

const CancellationRequestSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true, required: true },
  reason: { type: String },
  status: { type: String, enum: ['requested','approved','rejected','processed'], default: 'requested', index: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // customer or admin
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  financeApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Finance Admin
  fullRefundAddOnSelected: { type: Boolean, default: false },
  addOnFeeCharged: { type: MoneySchema }, // if selected at checkout
  notes: { type: String }
}, { timestamps: true });

 const CancellationRequest = model('CancellationRequest', CancellationRequestSchema);

const RefundSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true, required: true },
  cancellationRequestId: { type: Schema.Types.ObjectId, ref: 'CancellationRequest' },
  status: { type: String, enum: ['initiated','succeeded','failed'], default: 'initiated', index: true },
  amount: { type: MoneySchema, required: true },
  provider: { type: String, enum: ['razorpay','stripe'] },
  providerRefundId: { type: String, index: true },
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

 const Refund = model('Refund', RefundSchema);

module.exports = {
  CancellationRequest,
  Refund
};