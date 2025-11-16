const cron = require('node-cron');
const monitoringService = require('./monitoringService');
const config = require('../config/config');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.scheduledTask = null;
    this.isScheduled = false;
  }

  /**
   * Start the monitoring scheduler
   */
  start() {
    if (this.isScheduled) {
      logger.warn('Scheduler is already running');
      return;
    }

    const intervalMinutes = config.monitoring.intervalMinutes;

    // Create cron expression for the interval
    // For every N minutes: */N * * * *
    const cronExpression = `*/${intervalMinutes} * * * *`;

    logger.info(`Starting monitoring scheduler (every ${intervalMinutes} minutes)`);

    this.scheduledTask = cron.schedule(cronExpression, async () => {
      try {
        await monitoringService.runMonitoringCycle();
      } catch (error) {
        logger.error('Error in scheduled monitoring cycle:', error);
      }
    });

    this.isScheduled = true;

    // Run initial check immediately
    logger.info('Running initial monitoring check...');
    setTimeout(async () => {
      try {
        await monitoringService.runMonitoringCycle();
      } catch (error) {
        logger.error('Error in initial monitoring cycle:', error);
      }
    }, 5000); // Wait 5 seconds after server start

    logger.info('Scheduler started successfully');
  }

  /**
   * Stop the monitoring scheduler
   */
  stop() {
    if (!this.isScheduled || !this.scheduledTask) {
      logger.warn('Scheduler is not running');
      return;
    }

    this.scheduledTask.stop();
    this.isScheduled = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Get scheduler status
   * @returns {Object} Scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isScheduled,
      intervalMinutes: config.monitoring.intervalMinutes,
      monitoringStats: monitoringService.getStats()
    };
  }

  /**
   * Manually trigger a monitoring cycle
   */
  async triggerManualCheck() {
    logger.info('Manual monitoring check triggered');
    await monitoringService.runMonitoringCycle();
  }
}

// Export singleton instance
module.exports = new SchedulerService();
