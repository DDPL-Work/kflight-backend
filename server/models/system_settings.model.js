const mongoose = require('mongoose');
const { Schema } = mongoose;

// System Settings Schema
const systemSettingSchema = new Schema({
  key: { type: String, unique: true, required: true },
  value: Schema.Types.Mixed,
  description: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

module.exports = { SystemSetting };