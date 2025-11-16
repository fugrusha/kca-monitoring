const app = require('./app');
const config = require('./config/config');
const database = require('./config/database');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

const PORT = config.server.port;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal. Closing server gracefully...');

  try {
    // Stop monitoring scheduler
    schedulerService.stop();
    logger.info('Monitoring scheduler stopped');

    // Close database connection
    await database.close();
    logger.info('Database connection closed');

    logger.info('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Start server
const startServer = async () => {
  try {
    logger.info('Starting KCA Monitoring Server...');

    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`KCA Monitoring Server`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Dashboard: http://localhost:${PORT}`);
      logger.info('=================================');

      // Start monitoring scheduler
      schedulerService.start();
      logger.info(`Monitoring interval: ${config.monitoring.intervalMinutes} minutes`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
