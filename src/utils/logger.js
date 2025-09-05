/**
 * Logger utility that only logs in development mode
 * Prevents console pollution in production
 */

const isDev = import.meta.env.DEV;

const logger = {
  // Debug and info only log in development
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },
  
  // Warnings only in development
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },
  
  // Errors always log (but could be sent to monitoring service in production)
  error: (...args) => {
    console.error('[ERROR]', ...args);
    // In production, could send to error tracking service like Sentry
  },
  
  // Group related logs (dev only)
  group: (label) => {
    if (isDev) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  }
};

export default logger;