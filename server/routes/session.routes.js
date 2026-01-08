// server/routes/session.routes.js
const express = require("express");
const router = express.Router();
const userAuth = require("../middlewares/userAuth");
const {
  getActiveSessions,
  logoutFromDevice,
  logoutFromAllDevices,
  createSession, // Add this import
  updateSessionActivity, // Add this import
} = require("../controllers/session.controller");

// List all logged-in devices
router.get("/", userAuth, getActiveSessions);

// Create new session (call this during login)
router.post("/", userAuth, createSession);

// Update session activity (for keeping track of active sessions)
router.patch("/activity", userAuth, updateSessionActivity);

// Logout from one device
router.delete("/:sessionId", userAuth, logoutFromDevice);

// Logout from all devices
router.delete("/", userAuth, logoutFromAllDevices);

module.exports = router;