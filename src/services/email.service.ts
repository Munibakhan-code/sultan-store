// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
      logger.info('Email service initialized');
    } else {
      logger.warn('Email service not configured - email features disabled');
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email service not configured - email not sent');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM || 'noreply@sultanpubgstore.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      logger.info(`Email sent to ${options.to}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Sultan Official PUBG Store!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Sultan Official PUBG Store',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #f44336; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Sultan Official PUBG Store',
      html,
    });
  }
}

export const emailService = new EmailService();