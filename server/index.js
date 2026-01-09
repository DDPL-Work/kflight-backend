//index.js

const express = require("express");
require('dotenv').config();
require("./config/dbConfig");
const cors = require("cors");
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require("crypto");
const updateSessionActivity = require("./middlewares/updateSessionActivity.js");
const app = express();


// app.set('trust proxy', true);
// Trust proxy only in production (Railway, Render, AWS, etc.)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);  
} else {
  app.set("trust proxy", false);
}


app.use(cors({origin: process.env.CORS_ORIGIN || '*'||"http://localhost:5173"}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(updateSessionActivity);

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000,
//   message: "no more",
//   standardHeaders: true,
//   legacyHeaders: false,
//   ipFromHeader: "x-forwarded-for"   // FIXES THE ERROR
// });


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);


// app.use("/api/translate", require("./routes/translate"));
app.use("/api/blogs", require("./routes/blogRoutes"))
app.use("/api/staff-reset", require("./routes/reset_super_admin.routes.js"));
app.use("/api/payment", require("./routes/payment.routes.js"));
// app.use("/api/admins", require("./routes/adminRoutes"));
// app.use("/api/hotels", require("./routes/HotelBooking.route"));
app.use("/api/offers", require("./routes/offers.route.js"));
app.use("/api", require("./routes/editorUploadRoute.js"))
app.use("/api/faqs", require("./routes/faq.routes.js"))
app.use("/api/user", require("./routes/user.route")); 
app.use("/api/notifications", require("./routes/notificationTest.routes"));
app.use("/api/flights", require("./routes/flightSearch.routes"))
app.use("/api/flight-booking", require("./routes/flightBooking.routes.js"));
app.use("/api/reset", require("./routes/reset.route.js")); 
app.use("/api/admin/pricing", require("./routes/pricingRule.routes"));
app.use("/api/hotel-pricing-rules", require("./routes/hotelPricingRule.routes"));
app.use("/api/hotels", require("./routes/hotelSearch.routes"));
app.use("/refunds", require("./routes/refund.routes"));
// app.use("/api/search", require("./routes/search.route"));
// app.use("/api/bookings", require("./routes/HotelBooking.route"));
app.use("/api/seo", require("./routes/seoPage.route"));
// app.use("/api/transactions", require("./routes/transaction.route"));
// app.use("/api/cancellation", require("./routes/cancellation.route"));
app.use("/api/webhooks", require("./routes/webhooks.route"));
app.use("/api/otp", require("./routes/otp.route"));
app.use("/api/sessions", require("./routes/session.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/subscriptions", require("./routes/subscription.routes"));
app.use("/api/campaigns", require("./routes/campaign.routes"));
app.use("/api/newsletters", require("./routes/newsletter.routes"));
app.use("/api/admin", require("./routes/adminActions.routes"));
app.use("/api/staff", require("./routes/staff_auth.route.js"))
app.use("/api/booking", require("./routes/booking.routes"));
app.use("/api/firebase-test", require("./routes/firebaseTest"));
app.use("/api/test", require("./routes/test.route"));
app.use("/api/notifications", require("./routes/notificaton.route"));
app.use("/webhooks", require("./routes/webhook.routes"));

// start scheduler (side-effect import)
require("./utils/scheduler");
app.get("/", (req, res) => {
  res.send("Welcome to KFlight API");
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});
// const admin = require("./config/firebase");
// console.log("Firebase initialized:", !!admin.apps.length);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port number ${port}`);
});