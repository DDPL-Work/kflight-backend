// //server/models/global.model.js

// const mongoose = require('mongoose');
// const { Schema } = mongoose;


// // OAuth Token Schema for better token management
// const oauthTokenSchema = new Schema({
//   user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   provider: { type: String, enum: ['google', 'facebook', 'apple', 'github'], required: true },
//   access_token: { type: String, required: true },
//   refresh_token: String,
//   expires_at: Date,
//   scope: String,
//   created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now }
// });

// // Session Schema (updated for OAuth)
// const sessionSchema = new Schema({
//   user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   session_token: { type: String, required: true },
//   auth_method: { type: String, enum: ['local', 'google', 'facebook', 'apple', 'github'], required: true },
//   expires_at: { type: Date, required: true },
//   ip_address: String,
//   user_agent: String,
//   created_at: { type: Date, default: Date.now }
// });
























// // Static Page Schema








// // Create models
// const OAuthToken = mongoose.model('OAuthToken', oauthTokenSchema);
// const Session = mongoose.model('Session', sessionSchema);



// module.exports = {
//   User,
//   OAuthToken,
//   Session,
//   Flight,
//   Hotel,
//   FlightSearch,
//   HotelSearch,
//   Wishlist,
//   WishlistItem,
//   Booking,
//   FlightBooking,
//   HotelBooking,
//   Payment,
//   Blog,
//   BlogComment,
//   Review,
//   Notification,
//   ApiLog,
//   SystemSetting,
//   Superadmin,
//   Admin,
//   StaticPage,
//   SEO,
//   CancellationRefund,
//   AuditLog,
//   Exception
// };