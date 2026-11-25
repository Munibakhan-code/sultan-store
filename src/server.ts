// src/server.ts (Updated with Socket.IO)
import { env } from './config/env';
import { connectDB } from './config/database';
import app from './app';
import { createServer } from 'http';
import { SocketService } from './services/socket.service';
import logger from './utils/logger';

const PORT = parseInt(env.PORT);

const startServer = async () => {
  try {
    await connectDB();

    const server = createServer(app);
    
    // Initialize Socket.IO
    const socketService = new SocketService(server);
    logger.info('Socket.IO service initialized');

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Client URL: ${env.CLIENT_URL}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();