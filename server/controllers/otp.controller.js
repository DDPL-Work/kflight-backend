// server/controllers/otp.controller.js

const OTP = require("../models/otp.model");
const { sendEmail, sendSMS } = require("../utils/notification");

// -------------------
// Send OTP for any purpose (login, registration, password reset)
// -------------------
exports.sendOTP = async (req, res) => {
  try {
    const { email, phone, purpose } = req.body;

    if (!email && !phone)
      return res.status(400).json({ success: false, message: "Email or phone required" });
    if (!purpose)
      return res.status(400).json({ success: false, message: "OTP purpose is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({ email, phone, otp, purpose, expiresAt });

    if (email)
      await sendEmail(email, "Your OTP Code", `<p>Your OTP for ${purpose} is <b>${otp}</b>. It expires in 10 minutes.</p>`);

    if (phone)
      await sendSMS(phone, `Your OTP for ${purpose} is ${otp}. Valid for 10 minutes.`);

    res.json({ success: true, message: "OTP sent successfully", purpose });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ success: false, message: "Server error sending OTP" });
  }
};

// -------------------
// Verify OTP
// -------------------
exports.verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp, purpose } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: "OTP required" });
    if (!purpose) return res.status(400).json({ success: false, message: "OTP purpose required" });

    const record = await OTP.findOne({ $or: [{ email }, { phone }], otp, purpose });

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    record.verified = true;
    await record.save();

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ success: false, message: "Server error verifying OTP" });
  }
};
