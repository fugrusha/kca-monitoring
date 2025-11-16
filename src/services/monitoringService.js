const KcaService = require('../models/KcaService');
const MonitoringLog = require('../models/MonitoringLog');
const Incident = require('../models/Incident');
const HealthCheckService = require('./healthCheckService');
const logger = require('../utils/logger');

class MonitoringService {
  constructor() {
    this.isRunning = false;
    this.checkCount = 0;
  }

  /**
   * Run a single monitoring cycle for all services
   */
  async runMonitoringCycle() {
    if (this.isRunning) {
      logger.warn('Monitoring cycle already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.checkCount++;

    try {
      logger.info(`Starting monitoring cycle #${this.checkCount}`);

      // Get all active services
      const services = await KcaService.getAll();

      if (services.length === 0) {
        logger.warn('No active services to monitor');
        this.isRunning = false;
        return;
      }

      logger.info(`Checking ${services.length} services...`);

      // Perform health checks
      const results = await HealthCheckService.checkMultipleServices(services);

      // Process results
      for (const result of results) {
        await this.processCheckResult(result);
      }

      // Log summary
      const upCount = results.filter(r => r.status === 'up').length;
      const downCount = results.filter(r => r.status === 'down').length;

      logger.info(
        `Monitoring cycle #${this.checkCount} completed: ` +
        `${upCount} up, ${downCount} down, ` +
        `avg response: ${this.calculateAvgResponseTime(results)}ms`
      );

    } catch (error) {
      logger.error('Error during monitoring cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single health check result
   * @param {Object} result - Health check result
   */
  async processCheckResult(result) {
    try {
      // Save monitoring log
      await MonitoringLog.create(result);

      // Check for incidents
      await this.handleIncidents(result);

      const service = await KcaService.getById(result.service_id);
      const statusSymbol = result.status === 'up' ? '✓' : '✗';

      logger.debug(
        `${statusSymbol} ${service.short_name}: ${result.status} ` +
        `(${result.response_time}ms, HTTP ${result.status_code || 'N/A'})`
      );

    } catch (error) {
      logger.error(`Error processing check result for service ${result.service_id}:`, error);
    }
  }

  /**
   * Handle incident detection and resolution
   * @param {Object} result - Health check result
   */
  async handleIncidents(result) {
    const { service_id, status, error_message } = result;

    // Check if there's an active incident for this service
    const activeIncident = await Incident.getActiveByServiceId(service_id);

    if (status === 'down') {
      // Service is down
      if (!activeIncident) {
        // Create new incident
        await this.createIncident(service_id, error_message);
      }
      // If incident already exists, it remains active
    } else if (status === 'up') {
      // Service is up
      if (activeIncident) {
        // Resolve the incident
        await this.resolveIncident(activeIncident.id, service_id);
      }
    }
  }

  /**
   * Create a new incident
   * @param {Number} serviceId - Service ID
   * @param {String} errorMessage - Error message
   */
  async createIncident(serviceId, errorMessage) {
    try {
      const service = await KcaService.getById(serviceId);

      const incidentId = await Incident.create({
        service_id: serviceId,
        severity: 'major',
        description: errorMessage || 'Service is not responding'
      });

      logger.warn(
        `🚨 INCIDENT CREATED #${incidentId}: ${service.name} is DOWN - ${errorMessage || 'No response'}`
      );

    } catch (error) {
      logger.error('Error creating incident:', error);
    }
  }

  /**
   * Resolve an existing incident
   * @param {Number} incidentId - Incident ID
   * @param {Number} serviceId - Service ID
   */
  async resolveIncident(incidentId, serviceId) {
    try {
      const service = await KcaService.getById(serviceId);

      await Incident.resolve(incidentId, 'Service restored');

      logger.info(
        `✅ INCIDENT RESOLVED #${incidentId}: ${service.name} is back UP`
      );

    } catch (error) {
      logger.error('Error resolving incident:', error);
    }
  }

  /**
   * Calculate average response time from results
   * @param {Array} results - Array of check results
   * @returns {Number} Average response time in ms
   */
  calculateAvgResponseTime(results) {
    if (results.length === 0) return 0;

    const total = results.reduce((sum, r) => sum + (r.response_time || 0), 0);
    return Math.round(total / results.length);
  }

  /**
   * Get monitoring statistics
   * @returns {Object} Monitoring stats
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      totalChecks: this.checkCount,
      uptime: process.uptime()
    };
  }

  /**
   * Reset monitoring statistics
   */
  reset() {
    this.checkCount = 0;
    logger.info('Monitoring statistics reset');
  }
}

// Export singleton instance
module.exports = new MonitoringService();
