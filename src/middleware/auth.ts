// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const decoded = tokenService.verifyToken(token);

    if (!decoded) {
      throw new AppError('Invalid or expired token. Please log in again.', 401);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found. Please log in again.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw new AppError('Forbidden: Admin access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};