// server/middlewares/updateSessionActivity.js
const Session = require("../models/Session.model.js");

const updateSessionActivity = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await Session.findOneAndUpdate(
        { token },
        { lastActive: new Date() }
      );
    }
    next();
  } catch (error) {
    console.error('Error updating session activity:', error);
    next();
  }
};

module.exports = updateSessionActivity;