const database = require('./database');
const fs = require('fs');
const path = require('path');

const createTables = async (db) => {
  // Table for KCA services
  await db.run(`
    CREATE TABLE IF NOT EXISTS kca_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL UNIQUE,
      description TEXT,
      service_type TEXT NOT NULL,
      endpoint_url TEXT NOT NULL,
      check_method TEXT DEFAULT 'GET',
      expected_status INTEGER DEFAULT 200,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table for monitoring logs
  await db.run(`
    CREATE TABLE IF NOT EXISTS monitoring_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      response_time INTEGER,
      status_code INTEGER,
      error_message TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES kca_services(id) ON DELETE CASCADE
    )
  `);

  // Table for service incidents
  await db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      started_at DATETIME NOT NULL,
      resolved_at DATETIME,
      severity TEXT NOT NULL,
      description TEXT,
      is_resolved BOOLEAN DEFAULT 0,
      FOREIGN KEY (service_id) REFERENCES kca_services(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_logs_service_id
    ON monitoring_logs(service_id)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_logs_checked_at
    ON monitoring_logs(checked_at)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_incidents_service_id
    ON incidents(service_id)
  `);

  console.log('Database tables created successfully');
};

const insertSampleData = async (db) => {
  // Check if data already exists
  const count = await db.get('SELECT COUNT(*) as count FROM kca_services');

  if (count.count > 0) {
    console.log('Sample data already exists, skipping insertion');
    return;
  }

  // Insert sample KCA services (Ukrainian certification authorities)
  const services = [
    {
      name: 'АЦСК ІДД ДПС України (OCSP)',
      short_name: 'acsk-idd-ocsp',
      description: 'OCSP сервісAccredited Center of Certification Services',
      service_type: 'OCSP',
      endpoint_url: 'http://acsk.privatbank.ua/services/ocsp/',
      check_method: 'GET',
      expected_status: 200
    },
    {
      name: 'ІДД ДПС України (CRL)',
      short_name: 'idd-crl',
      description: 'CRL Distribution Point Information and Reference Directory',
      service_type: 'CRL',
      endpoint_url: 'http://iit.com.ua/download/productfiles/CACertificates.p7b',
      check_method: 'HEAD',
      expected_status: 200
    },
    {
      name: 'Приватбанк АЦСК (TSP)',
      short_name: 'privatbank-tsp',
      description: 'Timestamp Service PrivatBank',
      service_type: 'TSP',
      endpoint_url: 'http://acsk.privatbank.ua/services/tsp/',
      check_method: 'GET',
      expected_status: 200
    },
    {
      name: 'Центральний засвідчувальний орган',
      short_name: 'czo-main',
      description: 'Main Central Certification Authority service',
      service_type: 'CA',
      endpoint_url: 'https://czo.gov.ua/',
      check_method: 'GET',
      expected_status: 200
    }
  ];

  for (const service of services) {
    await db.run(`
      INSERT INTO kca_services
      (name, short_name, description, service_type, endpoint_url, check_method, expected_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      service.name,
      service.short_name,
      service.description,
      service.service_type,
      service.endpoint_url,
      service.check_method,
      service.expected_status
    ]);
  }

  console.log(`Inserted ${services.length} sample KCA services`);
};

const initializeDatabase = async () => {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(path.resolve(require('./config').database.path));
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory: ${dataDir}`);
    }

    await database.connect();
    const db = database;

    console.log('Creating database schema...');
    await createTables(db);

    console.log('Inserting sample data...');
    await insertSampleData(db);

    console.log('Database initialization completed successfully!');

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, createTables, insertSampleData };
