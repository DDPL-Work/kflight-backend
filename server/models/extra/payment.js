// import { Schema, model } from 'mongoose';
// import { MoneySchema } from './common.js';
const {Schema, model} = require('mongoose');
const {MoneySchema} = require('./common.js');

const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true, required: true },
  provider: { type: String, enum: ['razorpay','stripe'], required: true }, // domestic vs international
  status: { type: String, enum: ['created','authorized','captured','failed','refunded','partially_refunded'], index: true },
  amount: { type: MoneySchema, required: true },
  providerOrderId: { type: String, index: true },
  providerPaymentId: { type: String, index: true },
  providerRefundId: { type: String, index: true },
  method: { type: String }, // upi, card, netbanking, wallet, etc.
  receipt: { type: String },
  error: { type: String },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

PaymentSchema.index({ provider: 1, providerOrderId: 1 });

const Payment = model('Payment', PaymentSchema);

module.exports = {
  Payment
};