//session.controller.js


const Session = require("../models/Session.model");
const UAParser = require('ua-parser-js');
const axios = require("axios");

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
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
};

// Helper function to get location from IP (you can use a service like ipapi.co)

// Helper function to get location from IP
// session.controller.js
const getLocationFromIP = async (ip) => {
  try {
    if (!ip) ip = '';
    
    // If multiple IPs, take the first one
    const clientIP = ip.split(',')[0].trim();

    // Handle localhost/private IPs
    if (clientIP.startsWith("127.") || clientIP.startsWith("::1") || clientIP.startsWith("10.") || clientIP.startsWith("192.") || clientIP.startsWith("172.")) {
      return {
        city: "Localhost",
        region: "Local Network",
        country: "Unknown",
        timezone: "Unknown",
      };
    }

    // Call IP geolocation API
    const response = await axios.get(`https://ipapi.co/${clientIP}/json/`);
    const data = response.data;

    return {
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
      timezone: data.timezone || "Unknown",
    };
  } catch (error) {
    console.error("🌍 IP Location Fetch Error:", error.message);
    return {
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      timezone: "Unknown",
    };
  }
};


// 🟢 Get all active sessions for the logged-in user
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ loginTime: -1 });
    
    // Format sessions for frontend
    const formattedSessions = sessions.map(session => {
      const deviceInfo = session.deviceInfo || {};
      const location = session.location || {};
      
      // Generate device name from parsed info
      let deviceName = 'Unknown Device';
      if (deviceInfo.browser && deviceInfo.os) {
        deviceName = `${deviceInfo.browser} on ${deviceInfo.os}`;
      } else if (deviceInfo.userAgent) {
        deviceName = deviceInfo.userAgent.substring(0, 50) + '...';
      }
      
      // Generate platform info
      let platform = 'Unknown Platform';
      if (deviceInfo.deviceType === 'mobile') {
        platform = 'Mobile';
      } else if (deviceInfo.deviceType === 'tablet') {
        platform = 'Tablet';
      } else {
        platform = 'Desktop';
      }
      
      if (deviceInfo.os) {
        platform = deviceInfo.os;
      }
      
      // Generate location string
      let locationString = 'Unknown Location';
      if (location.city && location.country) {
        locationString = `${location.city}, ${location.country}`;
      } else if (location.country) {
        locationString = location.country;
      }
      
      // Check if this is the current session
      const isCurrent = req.headers.authorization?.includes(session.token);
      
      return {
        _id: session._id,
        deviceName,
        deviceType: deviceInfo.deviceType || 'desktop',
        platform,
        location: locationString,
        ipAddress: deviceInfo.ip || 'Unknown',
        lastActive: session.lastActive,
        loginTime: session.loginTime,
        isCurrent,
        // Raw data for debugging
        rawDeviceInfo: deviceInfo,
        rawLocation: location
      };
    });

    res.json({ 
      success: true, 
      sessions: formattedSessions,
      total: formattedSessions.length
    });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Create or update session (call this during login)
exports.createSession = async (userId, token, ip, userAgent) => {
  try {
    const deviceInfo = {
      ip,
      userAgent,
      ...parseUserAgent(userAgent)
    };
    
    const location = await getLocationFromIP(ip);
    
    const session = new Session({
      userId,
      token,
      deviceInfo,
      location,
      loginTime: new Date(),
      lastActive: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    await session.save();
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// 🔴 Logout from a specific device (by session ID)
exports.logoutFromDevice = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = await Session.findOneAndDelete({ _id: sessionId, userId: req.user.id });
    if (!deleted)
      return res.status(404).json({ success: false, message: "Session not found" });

    res.json({ success: true, message: "Logged out from device successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔴 Logout from all devices
exports.logoutFromAllDevices = async (req, res) => {
  try {
    await Session.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🟢 Update session activity
exports.updateSessionActivity = async (token) => {
  try {
    await Session.findOneAndUpdate(
      { token },
      { lastActive: new Date() }
    );
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
};