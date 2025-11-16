const app = require('./app');
const config = require('./config/config');
const database = require('./config/database');

const PORT = config.server.port;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal. Closing server gracefully...');

  try {
    await database.close();
    console.log('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    console.log('Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`KCA Monitoring Server`);
      console.log(`Environment: ${config.server.env}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
