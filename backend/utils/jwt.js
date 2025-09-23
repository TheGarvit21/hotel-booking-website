const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (userId, role = 'user') => {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  const refreshToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiresIn
  });

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
