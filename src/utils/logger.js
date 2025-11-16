const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.currentLevel = this.logLevels[config.logging.level] || this.logLevels.info;
    this.logDir = path.join(__dirname, '../../logs');

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message with timestamp and level
   * @param {String} level - Log level
   * @param {String} message - Log message
   * @returns {String} Formatted message
   */
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Write log to file
   * @param {String} level - Log level
   * @param {String} message - Formatted message
   */
  writeToFile(level, message) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(this.logDir, `${date}.log`);

    try {
      fs.appendFileSync(logFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Log a message at specified level
   * @param {String} level - Log level
   * @param {String} message - Message to log
   * @param {*} data - Additional data to log
   */
  log(level, message, data = null) {
    const levelValue = this.logLevels[level];

    if (levelValue > this.currentLevel) {
      return; // Skip logs below current level
    }

    const fullMessage = data
      ? `${message} ${JSON.stringify(data, null, 2)}`
      : message;

    const formattedMessage = this.formatMessage(level, fullMessage);

    // Console output with colors
    this.consoleLog(level, formattedMessage);

    // File output (only for warn and error in production)
    if (config.server.env === 'production' && levelValue <= this.logLevels.warn) {
      this.writeToFile(level, formattedMessage);
    } else if (config.server.env !== 'production') {
      this.writeToFile(level, formattedMessage);
    }
  }

  /**
   * Output to console with appropriate color
   * @param {String} level - Log level
   * @param {String} message - Formatted message
   */
  consoleLog(level, message) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    console.log(`${color}${message}${reset}`);
  }

  /**
   * Log error message
   * @param {String} message - Error message
   * @param {Error|Object} error - Error object or data
   */
  error(message, error = null) {
    if (error instanceof Error) {
      this.log('error', `${message}: ${error.message}`, { stack: error.stack });
    } else {
      this.log('error', message, error);
    }
  }

  /**
   * Log warning message
   * @param {String} message - Warning message
   * @param {*} data - Additional data
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }

  /**
   * Log info message
   * @param {String} message - Info message
   * @param {*} data - Additional data
   */
  info(message, data = null) {
    this.log('info', message, data);
  }

  /**
   * Log debug message
   * @param {String} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }

  /**
   * Clean up old log files
   * @param {Number} daysToKeep - Number of days to keep logs
   */
  cleanOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning old logs', error);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
