
// server-render-kflight/server/middlewares/auth.js


const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Staff = require("../models/Staff.model");

// ======================================================
// VERIFY USER ONLY
// ======================================================
exports.verifyUser = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    req.authType = "user";
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token error" });
  }
};

// ======================================================
// VERIFY ADMIN USER
// ======================================================
exports.verifyAdmin = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const allowedRoles = ["admin", "superadmin", "seo"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.user = user;
    req.authType = "admin";
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token error" });
  }
};

// ======================================================
// VERIFY USER OR STAFF
// ======================================================
exports.verifyUserOrStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ===============================
    // USER TOKEN
    // ===============================
    if (decoded.id) {
      const user = await User.findById(decoded.id).select("-password");

      if (!user || user.isActive === false) {
        return res.status(401).json({ message: "Invalid user token" });
      }

      req.user = user;
      req.authType = "user";
      return next();
    }

    // ===============================
    // STAFF TOKEN
    // ===============================
    if (decoded.staffId) {
      const staff = await Staff.findById(decoded.staffId).select("-password");

      if (!staff || staff.is_active === false) {
        return res.status(401).json({ message: "Invalid staff token" });
      }

      req.staff = staff;
      req.authType = "staff";
      return next();
    }

    return res.status(401).json({ message: "Invalid token owner" });
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Token error" });
  }
};
