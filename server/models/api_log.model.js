const mongoose = require('mongoose');
const { Schema } = mongoose;

// API Log Schema
const apiLogSchema = new Schema({
  endpoint: String,
  method: String,
  request_body: Schema.Types.Mixed,
  response_body: Schema.Types.Mixed,
  status_code: Number,
  response_time: Number,
  created_at: { type: Date, default: Date.now }
});

const ApiLog = mongoose.model('ApiLog', apiLogSchema);

module.exports = {ApiLog};