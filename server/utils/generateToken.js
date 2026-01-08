const jwt = require('jsonwebtoken')

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    // role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
