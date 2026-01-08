// middlewares/staffAuth.middleware.js

const jwt = require("jsonwebtoken");
const Staff = require("../models/staff.model");

// Authenticate any staff
const staffAuth = () => {
  return async (req, res, next) => {
    console.log("🟢 [Auth Middleware] Hit!");

    try {
      const authHeader = req.headers["authorization"];
      console.log("🔸 Authorization Header:", authHeader);

      if (!authHeader) {
        return res.status(401).json({ success: false, message: "Authorization header missing" });
      }

      const token = authHeader.split(" ")[1];
      console.log("🔸 Extracted Token:", token);

      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      //  Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔹 Decoded Token:", decoded);
      } catch (err) {
        console.error("❌ Token verification failed:", err.message);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
      }

      //  Extract staffId
      const staffId = decoded.staffId || decoded.id;
      console.log("🔹 Extracted staffId:", staffId);

      if (!staffId) {
        return res.status(401).json({ success: false, message: "Invalid token payload (missing staffId)" });
      }

      //  Fetch staff from DB
      const staff = await Staff.findById(staffId);
      console.log("🔹 Staff Found in DB:", staff ? staff.email : "❌ Not Found");

      if (!staff) {
        return res.status(404).json({ success: false, message: "Staff not found" });
      }

      if (!staff.is_active) {
        return res.status(403).json({ success: false, message: "Account deactivated by superadmin" });
      }

      // Attach staff to request
      req.staff = staff;
      console.log("✅ Staff Authenticated:", staff.role, "-", staff.email);

      next();
    } catch (err) {
      console.error("🔥 Staff Auth Middleware Error:", err);
      res.status(500).json({
        success: false,
        message: "Authentication failed",
        error: err.message,
      });
    }
  };
};

// Only superadmin can access
const superAdminOnly = (req, res, next) => {
  console.log("🟠 [SuperAdmin Middleware] Role:", req.staff ? req.staff.role : "None");

  if (!req.staff || req.staff.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Only superadmin can perform this action" });
  }

  console.log(" Superadmin access granted");
  next();
};

//  SEO or Superadmin only
const seoOrSuperAdminOnly = (req, res, next) => {
  console.log("🟣 [SEO/SuperAdmin Middleware] Role:", req.staff ? req.staff.role : "None");

  if (!req.staff || !["seo", "superadmin"].includes(req.staff.role)) {
    return res.status(403).json({
      success: false,
      message: "Only SEO or Superadmin can access this resource",
    });
  }

  console.log(" SEO or Superadmin access granted");
  next();
};

module.exports = { staffAuth, superAdminOnly, seoOrSuperAdminOnly };
