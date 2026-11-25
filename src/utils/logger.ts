// src/utils/logger.ts
import { env } from '../config/env';

const logger = {
  info: (...args: any[]) => {
    if (env.NODE_ENV !== 'test') {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (env.NODE_ENV !== 'test') {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (env.NODE_ENV !== 'test') {
      console.warn('[WARN]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', ...args);
    }
  },
};

export default logger;