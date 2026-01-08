const jwt = require("jsonwebtoken");
const Redis = require("ioredis");

// Redis connection setup (use REDIS_URL or fallback to localhost)
const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // for Redis Cloud
});

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Token expired, please login again."
            : "Invalid token, authorization denied.",
      });
    }

    const adminId = decoded.id;
    const redisKey = `adminuser:${adminId}:token`;

    const storedToken = await redis.get(redisKey);

    if (!storedToken || storedToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Token invalidated or not recognized.",
      });
    }

    req.adminuser = {
      id: adminId,
      ...(decoded.username && { username: decoded.username }),
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authorization.",
    });
  }
};

module.exports = adminAuth;
