const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes: verifies Bearer token
const protect = async (req, res, next) => {
  let token;

  // 1. Look for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach user to request, exclude password from search to keep it secure
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(`[Auth Middleware Error] ${error.message}`);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // Handle case where no token is provided
  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Middleware for role-based access (e.g. farmer only, admin only)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the role of the attached user matches any of the required roles
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
