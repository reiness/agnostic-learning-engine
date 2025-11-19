// NOTE: This file is duplicated in frontend/backend. Please keep them in sync.
/**
 * NOTE: This logger implementation is duplicated in src/utils/logger.js
 * Please ensure any changes are applied to both files to maintain consistency.
 */
const LOG_LEVELS = {
  TRACK: 0,
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5,
};

// Placeholder for sensitive data sanitization
function sanitizeData(data) {
  // In a real application, this function would
  // deeply inspect and redact sensitive information
  // e.g., credit card numbers, passwords, PII.
  // For now, it's a pass-through.
  return data;
}

class Logger {
  constructor(minLevel = LOG_LEVELS.INFO) {
    this.minLevel = minLevel;
  }

  _log(level, message, context = {}) {
    if (level < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const sanitizedContext = sanitizeData(context);
    const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN';

    // Ensure logs are atomic and fast by directly using console methods
    // and preparing the message and context beforehand.
    const logEntry = `[${levelName}] [${timestamp}] ${message}`;

    switch (level) {
      case LOG_LEVELS.TRACK:
      case LOG_LEVELS.TRACE:
      case LOG_LEVELS.DEBUG:
        console.debug(logEntry, sanitizedContext);
        break;
      case LOG_LEVELS.INFO:
        console.info(logEntry, sanitizedContext);
        break;
      case LOG_LEVELS.WARN:
        console.warn(logEntry, sanitizedContext);
        break;
      case LOG_LEVELS.ERROR:
        console.error(logEntry, sanitizedContext);
        break;
      default:
        console.log(logEntry, sanitizedContext);
    }
  }

  track(message, context) {
    this._log(LOG_LEVELS.TRACK, message, context);
  }

  trace(message, context) {
    this._log(LOG_LEVELS.TRACE, message, context);
  }

  debug(message, context) {
    this._log(LOG_LEVELS.DEBUG, message, context);
  }

  info(message, context) {
    this._log(LOG_LEVELS.INFO, message, context);
  }

  warn(message, context) {
    this._log(LOG_LEVELS.WARN, message, context);
  }

  error(message, error, context = {}) {
    const errorContext = {
      ...context,
      error: error ? error.message : 'No error object provided',
      stack: error ? error.stack : 'No stack trace available',
    };
    this._log(LOG_LEVELS.ERROR, message, errorContext);
  }
}

// Create a single, exported instance of the logger
const logger = new Logger(LOG_LEVELS.DEBUG); // Default to DEBUG level for development

export default logger;