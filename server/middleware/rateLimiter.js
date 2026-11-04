import rateLimit from 'express-rate-limit';

const verifyLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 60,
   standardHeaders: true,
   legacyHeaders: false,
   handler: (req, res) =>
      res.status(429).json({
         success: false,
         message: 'Too many verification attempts. Please try again later.',
      }),
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

export { verifyLimiter, authLimiter };