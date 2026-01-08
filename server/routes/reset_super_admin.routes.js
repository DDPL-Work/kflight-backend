const express = require("express");
const router = express.Router();
const {
  requestStaffPasswordReset,
  resetStaffPassword,
} = require("../controllers/reset_super_admin_password.controller");

// Step 1: Request OTP
router.post("/request", requestStaffPasswordReset);

// Step 2: Reset password
router.post("/reset", resetStaffPassword);

module.exports = router;
