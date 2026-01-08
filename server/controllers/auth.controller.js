//auth.controller.js
const validator = require('validator');
const {notifyUser} = require("../utils/notify");
const User = require("../models/User.model");
const OTP = require("../models/otp.model");
const Session = require("../models/Session.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail, sendSMS } = require("../utils/notification");
const { generateOTP } = require("../utils/generateOTP");
const UAParser = require('ua-parser-js');
const { getLocationFromIP } = require('./session.controller'); // adjust path if needed
const { isValidPhoneNumber } = require('libphonenumber-js');

class AuthController {
  // Helper — Generate JWT
  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
  }

  // Helper — Parse user agent for device info
  static parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
      deviceType: result.device.type || 'desktop',
      deviceVendor: result.device.vendor || 'Unknown',
      deviceModel: result.device.model || 'Unknown'
    };
  }

  // Helper — Get client IP
 static getClientIP(req) {
  // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim(); // take the first one (real client IP)
  }

  // fallback to other properties
  return req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'Unknown';
}

  // Helper — Create session
static async createSession(userId, token, req) {
  try {
    const clientIP = this.getClientIP(req); // single IP only
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const deviceInfo = {
      ip: clientIP,
      userAgent,
      ...this.parseUserAgent(userAgent),
    };

    const location = await getLocationFromIP(clientIP);

    const session = await Session.create({
      userId,
      token,
      deviceInfo,
      location,
      loginTime: new Date(),
      lastActive: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}




  // ===============================
  // STEP 1 — Send OTP
  // ===============================
  static async sendOTP(req, res) {
    try {
      const { email, phone } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ success: false, message: "Email or phone required" });
      }

      // Validate input
      if (email && !validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      if (phone && !isValidPhoneNumber(phone, "IN")) { // assuming IN as default country
        return res.status(400).json({ success: false, message: "Invalid phone number" });
      }

      // Rate limiting: max 6 OTPs per 10 minutes
      const recentOTPs = await OTP.find({
        $or: [{ email }, { phone }],
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });
      if (recentOTPs.length >= 6) {
        return res.status(429).json({ success: false, message: "Too many OTP requests. Try later." });
      }

      let user = null;
      if (email) user = await User.findOne({ email });
      if (!user && phone) user = await User.findOne({ phone });

      const purpose = user ? "login" : "registration";
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete previous OTPs
      await OTP.deleteMany({ email: email || null, phone: phone || null, purpose });

      // Save new OTP record
      await OTP.create({
        email: email || null,
        phone: phone || null,
        otp: hashedOTP,
        purpose,
        expiresAt,
        attempts: 0,
      });

      // Send OTP via email/SMS
  if (email) {
  await sendEmail({
    to: email,
    templateId: 42575287
, // Your Postmark template ID
    model: {
      otp,               // OTP code
      purpose,           // Purpose (login, registration, etc.)
      expiryMinutes: 10, // Expiry info
    },
  });
}


      if (phone) {
        sendSMS(
          phone,
          `Your OTP for ${purpose} is ${otp}. Valid for 10 minutes.`
        ).catch(console.error);
      }

      res.json({
        success: true,
        message: user
          ? "User exists. Please verify OTP to login."
          : "New user. Please verify OTP to register.",
        purpose,
        userExists: !!user,
      });
    } catch (err) {
      console.error("Send OTP Error:", err);
      res.status(500).json({ success: false, message: "Server error sending OTP", error: err.message });
    }
  }


  // ===============================
  // STEP 2 — Verify OTP & Set Password (Registration)
  // ===============================
static async verifyOTPAndSetPassword(req, res) {
  try {
    const { email, phone, otp, password } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP required" });
    }

    // Find the OTP record (ignore OTP value here; we'll compare hashed version)
    const record = await OTP.findOne({
      email: email || null,
      phone: phone || null,
    });

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Compare provided OTP with hashed OTP
    const isValidOTP = await bcrypt.compare(otp, record.otp);
    if (!isValidOTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark OTP as verified
    record.verified = true;
    await record.save();

    // Find or create user
    let user = null;
    if (email) user = await User.findOne({ email });
    if (phone && !user) user = await User.findOne({ phone });

    // Registration flow
  if (record.purpose === "registration") {
  if (!user) {
    if (!password) {
      return res.status(400).json({ success: false, message: "Password required to register" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      email: email || null,
      phone: phone || null,
      password: hashedPassword,
      email_verified: !!email,
      phone_verified: !!phone,
    });

    // ✅ Send welcome email after successful registration
    if (user.email) {
      try {
        await AuthController.sendWelcomeMail(user);
        user.welcome_email_sent = true;
        await user.save();
      } catch (err) {
        console.error("Error sending welcome email:", err);
      }
    }
  } else {
    // User exists but OTP marked as registration
    if (!password) {
      return res.json({
        success: true,
        message: "User exists. Enter password to login.",
        userId: user._id,
      });
    }
    user.password = await bcrypt.hash(password, 10);
    if (email) user.email_verified = true;
    if (phone) user.phone_verified = true;
    await user.save();
  }
}

    // Login flow
    else if (record.purpose === "login") {
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (password) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      } else {
        return res.json({
          success: true,
          message: "Please enter your password to login.",
          userId: user._id,
        });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP purpose" });
    }

    // Generate token & create session
    const token = AuthController.generateToken(user._id);

    try {
      await AuthController.createSession(user._id, token, req);
    } catch (sessionError) {
      console.error("Session creation failed:", sessionError);
    }

    // Clean up verified OTP
    await OTP.deleteOne({ _id: record._id });

    // Optional push notification (import if used)
    // await notifyUser({ userId: user._id, title: "Registration Completed", message: "Your account has been created successfully.", type: "auth" });

    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
      },
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error verifying OTP" });
  }
}


  // ===============================
  // STEP 3 — Login with Password
  // ===============================
  static async userLogin(req, res) {
    try {
      const { email, phone, password } = req.body;
      
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: "Password required" 
        });
      }

      let user = null;
      if (email) user = await User.findOne({ email });
      if (phone && !user) user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid password" 
        });
      }

      // Generate JWT token
      const token = AuthController.generateToken(user._id);

      // Create session
    try {
    const ip = AuthController.getClientIP(req);
    const userAgent = req.headers['user-agent'];
    const { createSession } = require('./session.controller'); // import helper
    await createSession(user._id, token, ip, userAgent);
} catch (sessionError) {
    console.error('Session creation failed:', sessionError);
}


      // Send welcome email (if not sent before)
     if (user.email && !user.welcome_email_sent) {
    AuthController.sendWelcomeMail(user).catch(console.error);
        user.welcome_email_sent = true;
        await user.save();
      }
// await notifyUser({
//   userId: user._id,
//   title: "Login Successful",
//   message: "You have logged in successfully.",
//   type: "auth"
// });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
        },
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error during login" 
      });
    }
  }

  // =============================== 
  // STEP 4 — Logout (Single Session)
  // ===============================
  static async userLogout(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "No token provided" 
        });
      }

      // Delete the session
      await Session.findOneAndDelete({ token });

      res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    } catch (err) {
      console.error("Logout Error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error during logout" 
      });
    }
  }

  // ===============================
  // STEP 5 — Change Password (logged-in user)
  // ===============================
  static async changePassword(req, res) {
    try {
      const { old_password, new_password } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: "Old password is incorrect" 
        });
      }

      user.password = await bcrypt.hash(new_password, 10);
      await user.save();

      // Send email notification
      if (user.email) {
        await sendEmail(
          user.email,
          "Password Changed Successfully",
          `<p>Hi ${user.first_name || "User"},</p>
           <p>Your password has been changed successfully on ${new Date().toLocaleString()}.</p>
           <p>If you did not initiate this change, please reset your password immediately.</p>`
        ).catch(console.error);
      }

      res.json({ 
        success: true, 
        message: "Password changed successfully" 
      });
    } catch (err) {
      console.error("Change Password Error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error changing password" 
      });
    }
  }

  // ===============================
  // Welcome Email
  // ===============================
  static async sendWelcomeMail(user) {
    try {
      if (!user.email) return;

      const subject = "Welcome to Our Platform!";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">s, ${user.first_name || 'User'}!</h2>
          <p>Thank you for registering with us. We're excited to have you on board.</p>
          <p>Start exploring our features and make the most of your experience.</p>
          <br/>
          <p>Best regards,<br/>The Team</p>
        </div>
      `;

      await sendEmail(user.email, subject, html);


      await notifyUser({
  userId: user._id,
  title: "🎉 Welcome to KaroFlight!",
  message: "Your profile is complete. You can now book flights seamlessly.",
  type: "PROFILE",
  meta: {
    action: "PROFILE_COMPLETED"
  }
});
      console.log('✅ Welcome email sent to:', user.email);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }

  // ===============================
  // Get User Profile
  // ===============================
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          country_code: user.country_code,
          city_of_residence: user.city_of_residence,
          state: user.state,
          country: user.country,
          passport_no: user.passport_no,
          passport_expiry: user.passport_expiry,
          issuing_country: user.issuing_country,
          pan_card_number: user.pan_card_number,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        },
      });
    } catch (err) {
      console.error("Get Profile Error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error fetching profile" 
      });
    }
  }

  // ===============================
  // Update User Profile
  // ===============================
  static async updateProfile(req, res) {
    try {
      const {
        first_name,
        last_name,
        gender,
        date_of_birth,
        country_code,
        city_of_residence,
        state,
        country,
        passport_no,
        passport_expiry,
        issuing_country,
        pan_card_number,
      } = req.body;

      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Update fields
      if (first_name !== undefined) user.first_name = first_name;
      if (last_name !== undefined) user.last_name = last_name;
      if (gender !== undefined) user.gender = gender;
      if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
      if (country_code !== undefined) user.country_code = country_code;
      if (city_of_residence !== undefined) user.city_of_residence = city_of_residence;
      if (state !== undefined) user.state = state;
      if (country !== undefined) user.country = country;
      if (passport_no !== undefined) user.passport_no = passport_no;
      if (passport_expiry !== undefined) user.passport_expiry = passport_expiry;
      if (issuing_country !== undefined) user.issuing_country = issuing_country;
      if (pan_card_number !== undefined) user.pan_card_number = pan_card_number;

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          country_code: user.country_code,
          city_of_residence: user.city_of_residence,
          state: user.state,
          country: user.country,
          passport_no: user.passport_no,
          passport_expiry: user.passport_expiry,
          issuing_country: user.issuing_country,
          pan_card_number: user.pan_card_number,
        },
      });
    } catch (err) {
      console.error("Update Profile Error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Server error updating profile" 
      });
    }
  }
}

module.exports = AuthController;