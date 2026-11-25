// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { tokenService } from '../services/token.service';
import { emailService } from '../services/email.service';
import { AppError } from '../utils/AppError';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);

      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        throw new AppError('User already exists with this email', 400);
      }

      const { token, expires } = tokenService.generateVerificationToken();

      const user = await User.create({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: 'user',
        verificationToken: token,
        verificationTokenExpires: expires,
      });

      // await emailService.sendVerificationEmail(user.email, token);

      console.log("-------token----------")
      console.log(`${env.CLIENT_URL}/verify-email?token=${token}`)
      console.log("-----------------")


      res.status(201).json({
        success: true,
        data: {
          message:
            'Registration successful. Please check your email for verification.',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await User.findOne({ email: validatedData.email }).select(
        '+password'
      );

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      const isPasswordValid = await user.comparePassword(validatedData.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      const token = tokenService.generateAuthToken(user);

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('auth_token');
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isEmailVerified: req.user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);

      const user = await User.findOne({
        verificationToken: validatedData.token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError('Invalid or expired verification token', 400);
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Email verified successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = resendVerificationSchema.parse(req.body);

      const user = await User.findOne({ email: validatedData.email });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isEmailVerified) {
        throw new AppError('Email already verified', 400);
      }

      const { token, expires } = tokenService.generateVerificationToken();

      user.verificationToken = token;
      user.verificationTokenExpires = expires;
      await user.save();

      // await emailService.sendVerificationEmail(user.email, token);

      console.log("-------token----------")
      console.log(`${env.CLIENT_URL}/verify-email?token=${token}`)
      console.log("-----------------")

      res.status(200).json({
        success: true,
        data: {
          message: 'Verification email resent successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      const user = await User.findOne({ email: validatedData.email });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const { token, expires } = tokenService.generateResetPasswordToken();

      user.resetPasswordToken = token;
      user.resetPasswordExpires = expires;
      await user.save();

      await emailService.sendPasswordResetEmail(user.email, token);

      res.status(200).json({
        success: true,
        data: {
          message: 'Password reset link sent to your email',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      const user = await User.findOne({
        resetPasswordToken: validatedData.token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      user.password = validatedData.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();