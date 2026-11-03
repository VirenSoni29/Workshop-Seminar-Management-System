import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,  // 15 minute window
   max: 100,              // max 100 requests per window per IP
   standardHeaders: true,            // sends limit info in response headers
   legacyHeaders: false,
   message: {
      success: false,
      message: 'Too many requests, please try again after 15 minutes'
   }
});

const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 20,
   standardHeaders: true,
   legacyHeaders: false,
   handler: (req, res) =>
      res.status(429).json({
         success: false,
         message: 'Too many attempts. Please try again after 15 minutes.',
      }),
});

export { rateLimiter, authLimiter };