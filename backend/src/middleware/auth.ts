import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models';
import { AppError } from '../utils/AppError';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwt.secret) as TokenPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwt.secret) as TokenPayload;
    req.user = payload;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(payload: Pick<TokenPayload, 'userId'>): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): Pick<TokenPayload, 'userId'> {
  return jwt.verify(token, env.jwt.refreshSecret) as Pick<TokenPayload, 'userId'>;
}
