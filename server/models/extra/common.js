const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/** Monetary value in minor units: e.g., INR paise or USD cents */
const MoneySchema = new Schema({
  amount: { type: Number, required: true, min: 0 }, // integer, minor units
  currency: { type: String, required: true, uppercase: true, trim: true } // e.g. 'INR','USD'
}, { _id: false });

/** Audit trail actor reference */
const ActorRefSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, trim: true }
}, { _id: false });

/** Contact info */
const ContactSchema = new Schema({
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  phone: { type: String, trim: true }
}, { _id: false });

module.exports = {
  MoneySchema,
  ActorRefSchema,
  ContactSchema
};