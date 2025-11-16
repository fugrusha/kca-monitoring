require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    path: process.env.DB_PATH || './data/kca-monitoring.db'
  },
  monitoring: {
    intervalMinutes: parseInt(process.env.MONITORING_INTERVAL) || 5,
    checkTimeout: parseInt(process.env.CHECK_TIMEOUT) || 10000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
