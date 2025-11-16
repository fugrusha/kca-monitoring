const KcaService = require('../models/KcaService');
const MonitoringLog = require('../models/MonitoringLog');
const Incident = require('../models/Incident');

class KcaController {
  // Get all KCA services with their latest status
  static async getAllServices(req, res) {
    try {
      const services = await KcaService.getServicesWithLatestStatus();
      res.json({
        success: true,
        data: services,
        count: services.length
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch services'
      });
    }
  }

  // Get specific service by ID
  static async getServiceById(req, res) {
    try {
      const { id } = req.params;
      const service = await KcaService.getById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service'
      });
    }
  }

  // Get service status history
  static async getServiceHistory(req, res) {
    try {
      const { id } = req.params;
      const hours = parseInt(req.query.hours) || 24;

      const service = await KcaService.getById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      const history = await MonitoringLog.getHistoryByServiceId(id, hours);
      const stats = await MonitoringLog.getUptimeStats(id, hours);

      res.json({
        success: true,
        data: {
          service,
          history,
          stats
        }
      });
    } catch (error) {
      console.error('Error fetching service history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service history'
      });
    }
  }

  // Get overall statistics for all services
  static async getStats(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const stats = await MonitoringLog.getAllServicesStats(hours);

      res.json({
        success: true,
        data: stats,
        period_hours: hours
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  // Get active incidents
  static async getActiveIncidents(req, res) {
    try {
      const incidents = await Incident.getAllActive();

      res.json({
        success: true,
        data: incidents,
        count: incidents.length
      });
    } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch incidents'
      });
    }
  }

  // Get incidents for a specific service
  static async getServiceIncidents(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const service = await KcaService.getById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      const incidents = await Incident.getByServiceId(id, limit);

      res.json({
        success: true,
        data: {
          service,
          incidents
        }
      });
    } catch (error) {
      console.error('Error fetching service incidents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service incidents'
      });
    }
  }
}

module.exports = KcaController;
