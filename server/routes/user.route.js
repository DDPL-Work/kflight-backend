// server/routes/user.route.js

const express = require("express");
const router = express.Router();

const userAuth = require("../middlewares/userAuth");

// Controllers
const {
  getProfile,
  updateProfile,
  saveFcmToken
} = require("../controllers/user.controller");

// Protected routes
router.get("/profile", userAuth, getProfile);
router.put("/profile", userAuth, updateProfile);

// 🔥 New Route: Save FCM Token
router.post("/save-fcm-token", userAuth, saveFcmToken);

module.exports = router;
