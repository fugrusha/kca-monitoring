const database = require('../config/database');

class Incident {
  static async create(incidentData) {
    const { service_id, severity, description } = incidentData;

    const result = await database.run(`
      INSERT INTO incidents
      (service_id, started_at, severity, description)
      VALUES (?, CURRENT_TIMESTAMP, ?, ?)
    `, [service_id, severity, description]);

    return result.id;
  }

  static async resolve(id, description = null) {
    await database.run(`
      UPDATE incidents
      SET resolved_at = CURRENT_TIMESTAMP,
          is_resolved = 1,
          description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END
      WHERE id = ?
    `, [description, description, id]);

    return this.getById(id);
  }

  static async getById(id) {
    return database.get(`
      SELECT * FROM incidents
      WHERE id = ?
    `, [id]);
  }

  static async getActiveByServiceId(serviceId) {
    return database.get(`
      SELECT * FROM incidents
      WHERE service_id = ?
        AND is_resolved = 0
      ORDER BY started_at DESC
      LIMIT 1
    `, [serviceId]);
  }

  static async getByServiceId(serviceId, limit = 50) {
    return database.all(`
      SELECT * FROM incidents
      WHERE service_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `, [serviceId, limit]);
  }

  static async getAllActive() {
    return database.all(`
      SELECT
        i.*,
        s.name as service_name,
        s.short_name as service_short_name
      FROM incidents i
      JOIN kca_services s ON i.service_id = s.id
      WHERE i.is_resolved = 0
      ORDER BY i.started_at DESC
    `);
  }

  static async getAll(limit = 100) {
    return database.all(`
      SELECT
        i.*,
        s.name as service_name,
        s.short_name as service_short_name
      FROM incidents i
      JOIN kca_services s ON i.service_id = s.id
      ORDER BY i.started_at DESC
      LIMIT ?
    `, [limit]);
  }
}

module.exports = Incident;
