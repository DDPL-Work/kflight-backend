// import { Schema, model } from 'mongoose';
const {Schema, model} = require('mongoose');

const EnquirySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open', index: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  channel: { type: String, enum: ['web','chatbot','email'], default: 'web' }
}, { timestamps: true });

const Enquiry = model('Enquiry', EnquirySchema);

module.exports = {
  Enquiry
};