// src/services/token.service.ts - Fix jwt sign options
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { IUser } from '../models/User';

export class TokenService {
  generateAuthToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }

  generateVerificationToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, expires };
  }

  generateResetPasswordToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, expires };
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

export const tokenService = new TokenService();