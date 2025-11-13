const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: { message: 'Access token required' } });
    }
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: { message: 'Invalid or expired token' }
      });
    }

    // Find user and check if still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: { message: 'User not found' }
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        error: { message: 'Account has been banned. Please contact support.' }
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        error: { message: 'Account is inactive. Please contact support.' }
      });
    }

    // Add user info to request
    req.user = user;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: { message: 'Authentication failed' }
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: { message: 'Admin access required' }
    });
  }
  next();
};

// Middleware to check if user is owner or admin
const requireOwnerOrAdmin = (fieldName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own data
    if (req.user._id.toString() === req.params[fieldName] || 
        req.user._id.toString() === req.body[fieldName]) {
      return next();
    }

    return res.status(403).json({
      error: { message: 'Access denied' }
    });
  };
};

// Optional authentication - doesn't fail if no token, but adds user if valid
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.status === 'active') {
          req.user = user;
          req.userId = decoded.userId;
          req.userRole = decoded.role;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Alias for authenticate middleware
const requireAuth = authenticate;

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
  requireOwnerOrAdmin,
  optionalAuth
};
