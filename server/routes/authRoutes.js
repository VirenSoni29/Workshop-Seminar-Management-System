import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerRules, loginRules } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, ...registerRules, validate, register);
router.post('/login', authLimiter, ...loginRules, validate, login);
router.get('/me', protect, getMe);

export default router;