import { Request, Response } from 'express';
import { body } from 'express-validator';
import { User, UserRole } from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { AppError } from '../utils/AppError';

// ────────────────────────────────────────────────────────────
// Validation chains (exported for use in routes)
// ────────────────────────────────────────────────────────────
export const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage('Password must be 8+ chars with at least one uppercase letter and number'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// ────────────────────────────────────────────────────────────
// Handlers
// ────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, password } = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash: password, // BeforeCreate hook will hash it
    role: UserRole.CUSTOMER,
  });

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  await user.update({ refreshToken });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account disabled', 403);

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  await user.update({ refreshToken });

  res.json({
    success: true,
    data: { user: user.toJSON(), accessToken, refreshToken },
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string };
  if (!token) throw new AppError('Refresh token required', 400);

  const payload = verifyRefreshToken(token);
  const user = await User.findByPk(payload.userId);
  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  await user.update({ refreshToken: newRefreshToken });

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (userId) {
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.user!.userId);
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user.toJSON() });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, phone } = req.body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  const user = await User.findByPk(req.user!.userId);
  if (!user) throw new AppError('User not found', 404);

  await user.update({ firstName, lastName, phone });
  res.json({ success: true, data: user.toJSON() });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  const user = await User.findByPk(req.user!.userId);
  if (!user) throw new AppError('User not found', 404);

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  await user.update({ passwordHash: newPassword }); // BeforeUpdate hook hashes it
  res.json({ success: true, message: 'Password updated successfully' });
}
