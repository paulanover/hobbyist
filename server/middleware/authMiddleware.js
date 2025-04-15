const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler.js');
const User = require('../models/User.js');

// Protect routes - Verify JWT from HttpOnly cookie
const protect = asyncHandler(async (req, res, next) => {
  let token;
  // Log the original URL requested by the client and the cookies received
  console.log(`[Protect Middleware] Triggered for URL: ${req.originalUrl}`);
  console.log('[Protect Middleware] Received Cookies:', req.cookies); // Log the whole cookies object

  // Read the JWT from the 'jwt' cookie
  token = req.cookies.jwt; // Read from cookie instead of header

  if (token) {
    console.log('[Protect Middleware] Found JWT cookie value (first few chars):', token.substring(0, 10) + '...'); // Log confirmation and part of token
    try {
      // Verify token
      console.log('[Protect Middleware] Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Protect Middleware] Token verified successfully. Decoded ID:', decoded.id);

      // Get user from the token payload (id) and attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('[Protect Middleware] User not found for decoded ID.');
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      console.log(`[Protect Middleware] User ${req.user.email} attached to request for URL: ${req.originalUrl}`);
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error(`[Protect Middleware] Token verification failed for URL: ${req.originalUrl}:`, error.message); // Log specific error with URL
      res.status(401);
      // Clear the invalid cookie if verification fails
      const isProduction = process.env.NODE_ENV === 'production'; // Check NODE_ENV
      console.log(`[Protect Middleware] Clearing invalid cookie. Secure flag will be: ${isProduction}`); // Log secure flag
      res.cookie('jwt', '', {
        httpOnly: true,
        secure: isProduction, // Use the result here
        sameSite: 'lax',
        expires: new Date(0),
        path: '/', // Match the setting used when creating/clearing
      });
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Not authorized, token failed or expired');
      } else {
        throw new Error('Not authorized, token processing error');
      }
    }
  } else {
    // If no token cookie was found
    console.log(`[Protect Middleware] No JWT cookie found for URL: ${req.originalUrl}`); // Log if no cookie with URL
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

// Authorization middleware - Check for admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, proceed
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };
