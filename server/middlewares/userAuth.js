const jwt = require("jsonwebtoken");
const Session = require("../models/Session.model");
const User = require("../models/User.model");

const userAuth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "No token provided" });

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check session existence and expiration
    const session = await Session.findOne({ token });
    if (!session)
      return res.status(401).json({ success: false, message: "Session expired or logged out" });

    if (session.expiresAt < new Date()) {
      await session.deleteOne(); // cleanup expired session
      return res.status(401).json({ success: false, message: "Session expired, please login again" });
    }

    // Update lastActive timestamp
    session.lastActive = new Date();
    await session.save();

    const user = await User.findById(decoded.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    req.user = user;
    req.session = session; // optional: attach session
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(401).json({
      success: false,
      message:
        err.name === "TokenExpiredError"
          ? "Token expired, please login again"
          : "Invalid or expired token",
    });
  }
};

module.exports = userAuth;
