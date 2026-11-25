// src/app.ts (Updated with upload validators)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import cartRoutes from './routes/cart.routes';
import settingsRoutes from './routes/settings.routes';
import paymentRoutes from './routes/payment.routes';
import orderRoutes from './routes/order.routes';
import conversationRoutes from './routes/conversation.routes';
import customDemandRoutes from './routes/customDemand.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { validateImageUpload, validateVideoUpload, validateScreenshotUpload } from './middleware/uploadValidator';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsers with size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment-methods', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/custom-demands', customDemandRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.path} not found`,
    errors: [],
  });
});

// Error handler
app.use(errorHandler);

export default app;