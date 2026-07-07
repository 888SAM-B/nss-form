const rateLimit = require('express-rate-limit');

// General api rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Login rate limiting - stricter limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

module.exports = { apiLimiter, loginLimiter };
