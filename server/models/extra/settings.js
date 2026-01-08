// import { Schema, model } from 'mongoose';
const { Schema, model } = require('mongoose');

const AppSettingsSchema = new Schema({
  languages: [{ type: String, default: 'en' }], // ['en','hi','es','fr','ar']
  currencies: [{ type: String, default: 'INR' }], // ['INR','USD','EUR','GBP','AED']
  features: {
    chatbot: { type: Boolean, default: true },
    multiCurrency: { type: Boolean, default: true },
    multiLanguage: { type: Boolean, default: true }
  }
}, { timestamps: true });

const AppSettings = model('AppSettings', AppSettingsSchema);

// Optional: daily metrics snapshot for dashboards
const DailyMetricsSchema = new Schema({
  date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
  bookingsCount: Number,
  revenueMinor: Number,
  cancellationsCount: Number,
  refundsCount: Number,
  usersCount: Number
}, { timestamps: true });

const DailyMetrics = model('DailyMetrics', DailyMetricsSchema);

module.exports = {
  AppSettings,
  DailyMetrics
};