import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Login/Register-ku strict limit: 15 min-ku 10 attempts mattum
// (password guess panra brute-force attack thadukka)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
