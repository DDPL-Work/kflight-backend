// controllers/staff_password_reset.controller.js

const Staff = require("../models/staff.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcryptjs");
const { generateOTP } = require("../utils/generateOTP");
const { sendEmail } = require("../utils/notification");

// STEP 1️⃣ — Request Password Reset (send OTP)
exports.requestStaffPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const otpCode = generateOTP();
    const expiry = new Date(Date.now() + 1000 * 60 * 5); // 5 mins

    // Save OTP in DB
    await OTP.create({
      email,
      otp: otpCode,
      purpose: "password_reset",
      expiresAt: expiry,
    });

    // Send OTP via Email
    const html = `
      <h3>Password Reset Request</h3>
      <p>Hi ${staff.first_name || "there"},</p>
      <p>Your OTP for resetting password is: <b>${otpCode}</b></p>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you didn’t request this, please ignore this email.</p>
      <br/>
      <p>Regards,<br/>KaroFlight Team</p>
    `;

    await sendEmail(email, "KaroFlight Password Reset OTP", html);

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (error) {
    console.error("Request Reset Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// STEP 2️⃣ — Verify OTP and reset password
exports.resetStaffPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    const otpDoc = await OTP.findOne({
      email,
      otp,
      purpose: "password_reset",
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Update password
    staff.password = await bcrypt.hash(new_password, 10);
    await staff.save();

    // Mark OTP as used
    otpDoc.verified = true;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};
