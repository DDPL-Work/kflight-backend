// server/routes/reset.route.js

const express = require("express");
const router = express.Router();
const userAuth = require("../middlewares/userAuth");
const {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPasswordWithOldPassword,
} = require("../controllers/password_reset.controller");

// Forgot password flow (not logged in)
router.post("/send-otp", sendForgotPasswordOTP);
router.post("/verify-otp", verifyForgotPasswordOTP);

// Reset password for logged-in users
router.post("/update-password", userAuth, resetPasswordWithOldPassword);

module.exports = router;
