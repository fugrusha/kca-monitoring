const database = require('../config/database');

class MonitoringLog {
  static async create(logData) {
    const { service_id, status, response_time, status_code, error_message } = logData;

    const result = await database.run(`
      INSERT INTO monitoring_logs
      (service_id, status, response_time, status_code, error_message)
      VALUES (?, ?, ?, ?, ?)
    `, [service_id, status, response_time, status_code, error_message]);

    return result.id;
  }

  static async getByServiceId(serviceId, limit = 100) {
    return database.all(`
      SELECT * FROM monitoring_logs
      WHERE service_id = ?
      ORDER BY checked_at DESC
      LIMIT ?
    `, [serviceId, limit]);
  }

  static async getLatestByServiceId(serviceId) {
    return database.get(`
      SELECT * FROM monitoring_logs
      WHERE service_id = ?
      ORDER BY checked_at DESC
      LIMIT 1
    `, [serviceId]);
  }

  static async getHistoryByServiceId(serviceId, hours = 24) {
    return database.all(`
      SELECT * FROM monitoring_logs
      WHERE service_id = ?
        AND checked_at >= datetime('now', '-' || ? || ' hours')
      ORDER BY checked_at ASC
    `, [serviceId, hours]);
  }

  static async getUptimeStats(serviceId, hours = 24) {
    return database.get(`
      SELECT
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as successful_checks,
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        ROUND(CAST(SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as uptime_percentage
      FROM monitoring_logs
      WHERE service_id = ?
        AND checked_at >= datetime('now', '-' || ? || ' hours')
    `, [serviceId, hours]);
  }

  static async getAllServicesStats(hours = 24) {
    return database.all(`
      SELECT
        s.id,
        s.name,
        s.short_name,
        COUNT(l.id) as total_checks,
        SUM(CASE WHEN l.status = 'up' THEN 1 ELSE 0 END) as successful_checks,
        AVG(l.response_time) as avg_response_time,
        ROUND(CAST(SUM(CASE WHEN l.status = 'up' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(l.id) * 100, 2) as uptime_percentage
      FROM kca_services s
      LEFT JOIN monitoring_logs l ON s.id = l.service_id
        AND l.checked_at >= datetime('now', '-' || ? || ' hours')
      WHERE s.is_active = 1
      GROUP BY s.id, s.name, s.short_name
      ORDER BY s.name
    `, [hours]);
  }

  static async deleteOldLogs(daysToKeep = 30) {
    const result = await database.run(`
      DELETE FROM monitoring_logs
      WHERE checked_at < datetime('now', '-' || ? || ' days')
    `, [daysToKeep]);

    return result.changes;
  }
}

module.exports = MonitoringLog;
