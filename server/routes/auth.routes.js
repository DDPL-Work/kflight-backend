// server/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller");
const userAuth = require("../middlewares/userAuth"); // JWT middleware

// -------------------
// OTP-based login/registration
// -------------------
router.post("/send-otp", AuthController.sendOTP);
router.post("/verify-otp", AuthController.verifyOTPAndSetPassword);

// -------------------
// Login with password
// -------------------
router.post("/login", AuthController.userLogin);

// -------------------
// Logout (requires valid token)
// -------------------
router.post("/logout", userAuth, AuthController.userLogout);

// -------------------
// Change password (logged-in user)
// -------------------
router.post("/change-password", userAuth, AuthController.changePassword);

// -------------------
// Get profile (logged-in user)
// -------------------
router.get("/profile", userAuth, AuthController.getProfile);

// -------------------
// Update profile (logged-in user)
// -------------------
router.put("/profile", userAuth, AuthController.updateProfile);

module.exports = router;
