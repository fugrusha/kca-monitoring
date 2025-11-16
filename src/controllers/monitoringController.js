const schedulerService = require('../services/schedulerService');
const monitoringService = require('../services/monitoringService');
const logger = require('../utils/logger');

class MonitoringController {
  /**
   * Get monitoring status
   */
  static async getStatus(req, res) {
    try {
      const status = schedulerService.getStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error fetching monitoring status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch monitoring status'
      });
    }
  }

  /**
   * Manually trigger a monitoring check
   */
  static async triggerCheck(req, res) {
    try {
      logger.info('Manual monitoring check requested via API');

      // Trigger check asynchronously
      schedulerService.triggerManualCheck()
        .catch(error => {
          logger.error('Error in manual monitoring check:', error);
        });

      res.json({
        success: true,
        message: 'Monitoring check triggered',
        note: 'Check is running asynchronously. Results will be available shortly.'
      });
    } catch (error) {
      logger.error('Error triggering monitoring check:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger monitoring check'
      });
    }
  }

  /**
   * Start the monitoring scheduler
   */
  static async startScheduler(req, res) {
    try {
      schedulerService.start();

      res.json({
        success: true,
        message: 'Monitoring scheduler started'
      });
    } catch (error) {
      logger.error('Error starting scheduler:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start scheduler'
      });
    }
  }

  /**
   * Stop the monitoring scheduler
   */
  static async stopScheduler(req, res) {
    try {
      schedulerService.stop();

      res.json({
        success: true,
        message: 'Monitoring scheduler stopped'
      });
    } catch (error) {
      logger.error('Error stopping scheduler:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop scheduler'
      });
    }
  }
}

module.exports = MonitoringController;
