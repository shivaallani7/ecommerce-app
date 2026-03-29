import { Router } from 'express';
import {
  register, login, logout, refreshToken,
  getProfile, updateProfile, changePassword,
  registerValidation, loginValidation,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', authLimiter, validate(registerValidation), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 */
router.post('/login', authLimiter, validate(loginValidation), login);

router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
