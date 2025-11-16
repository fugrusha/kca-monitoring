const database = require('../config/database');

class KcaService {
  static async getAll() {
    return database.all(`
      SELECT * FROM kca_services
      WHERE is_active = 1
      ORDER BY name
    `);
  }

  static async getById(id) {
    return database.get(`
      SELECT * FROM kca_services
      WHERE id = ?
    `, [id]);
  }

  static async getByShortName(shortName) {
    return database.get(`
      SELECT * FROM kca_services
      WHERE short_name = ?
    `, [shortName]);
  }

  static async create(serviceData) {
    const { name, short_name, description, service_type, endpoint_url, check_method, expected_status } = serviceData;

    const result = await database.run(`
      INSERT INTO kca_services
      (name, short_name, description, service_type, endpoint_url, check_method, expected_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, short_name, description, service_type, endpoint_url, check_method || 'GET', expected_status || 200]);

    return this.getById(result.id);
  }

  static async update(id, serviceData) {
    const { name, short_name, description, service_type, endpoint_url, check_method, expected_status, is_active } = serviceData;

    await database.run(`
      UPDATE kca_services
      SET name = ?,
          short_name = ?,
          description = ?,
          service_type = ?,
          endpoint_url = ?,
          check_method = ?,
          expected_status = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, short_name, description, service_type, endpoint_url, check_method, expected_status, is_active, id]);

    return this.getById(id);
  }

  static async delete(id) {
    return database.run(`
      DELETE FROM kca_services
      WHERE id = ?
    `, [id]);
  }

  static async getServicesWithLatestStatus() {
    return database.all(`
      SELECT
        s.*,
        l.status as last_status,
        l.response_time as last_response_time,
        l.status_code as last_status_code,
        l.checked_at as last_checked_at
      FROM kca_services s
      LEFT JOIN (
        SELECT
          service_id,
          status,
          response_time,
          status_code,
          checked_at,
          ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY checked_at DESC) as rn
        FROM monitoring_logs
      ) l ON s.id = l.service_id AND l.rn = 1
      WHERE s.is_active = 1
      ORDER BY s.name
    `);
  }
}

module.exports = KcaService;
