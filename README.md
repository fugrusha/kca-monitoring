# KCA Monitoring System

Ukrainian Key Certification Authority (KCA) monitoring application that tracks the availability and performance of various Ukrainian certification services.

## Features

- Real-time monitoring of KCA services
- Historical uptime tracking
- Response time analysis
- Incident management
- RESTful API for data access
- SQLite database for persistent storage

## Project Structure

```
kca-monitoring/
├── src/
│   ├── config/          # Configuration files
│   │   ├── config.js    # Application configuration
│   │   ├── database.js  # Database connection
│   │   └── initDb.js    # Database initialization
│   ├── models/          # Database models
│   │   ├── KcaService.js
│   │   ├── MonitoringLog.js
│   │   └── Incident.js
│   ├── controllers/     # Request handlers
│   │   └── kcaController.js
│   ├── routes/          # API routes
│   │   └── api.js
│   ├── middleware/      # Express middleware
│   │   └── errorHandler.js
│   ├── services/        # Business logic (Phase 2)
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── public/              # Static files
│   └── index.html       # Landing page
├── data/                # Database files
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json         # Dependencies

```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   cd kca-monitoring
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Web Interface: http://localhost:3000
   - API: http://localhost:3000/api

## API Endpoints

### KCA Services

- `GET /api/kca/all` - Get all KCA services with current status
- `GET /api/kca/:id` - Get specific service details
- `GET /api/kca/:id/history?hours=24` - Get service monitoring history
- `GET /api/kca/:id/incidents` - Get incidents for a service

### Statistics

- `GET /api/stats?hours=24` - Get overall statistics for all services

### Incidents

- `GET /api/incidents` - Get all active incidents

### Monitoring

- `GET /api/monitoring/status` - Get monitoring service status
- `POST /api/monitoring/check` - Manually trigger a monitoring check
- `POST /api/monitoring/start` - Start the monitoring scheduler
- `POST /api/monitoring/stop` - Stop the monitoring scheduler

### Health Check

- `GET /api/health` - API health check

## Environment Variables

Configuration is managed through the `.env` file:

```env
NODE_ENV=development
PORT=3000
DB_PATH=./data/kca-monitoring.db
MONITORING_INTERVAL=5
CHECK_TIMEOUT=10000
LOG_LEVEL=info
```

## Database Schema

### Tables

1. **kca_services** - KCA service definitions
   - Service details (name, endpoint, check method)
   - Configuration for health checks

2. **monitoring_logs** - Health check results
   - Response time
   - Status code
   - Error messages
   - Timestamps

3. **incidents** - Service incidents
   - Incident tracking
   - Resolution status
   - Severity levels

## Development Roadmap

### Phase 1: Backend Foundation ✅ (Complete)
- [x] Project structure setup
- [x] Database schema
- [x] RESTful API
- [x] Data models

### Phase 2: Monitoring Service ✅ (Complete)
- [x] Health check implementation
- [x] Scheduled monitoring jobs
- [x] Incident detection and tracking
- [x] Logging system

### Phase 3: Frontend Dashboard
- [ ] React/Vue.js setup
- [ ] Real-time status display
- [ ] Interactive charts (Chart.js)
- [ ] Responsive design

### Phase 4: Advanced Features
- [ ] WebSocket for real-time updates
- [ ] Email notifications
- [ ] Custom alert rules
- [ ] Export reports

## Monitored KCA Services

The application monitors the following Ukrainian KCA services:

1. **Центральний засвідчувальний орган (ЦЗО)** - Central Certification Authority
2. **ІДД ДПС України** - Information and Reference Directory main page
3. **АЦСК ІДД ДПС - OCSP** - OCSP service
4. **АЦСК ІДД ДПС - TSP** - Timestamp service
5. **Приватбанк АЦСК** - PrivatBank ACSK main service
6. **Test Service** - Test service for incident detection (always unavailable)

## Features Implemented

### Phase 2 Features

- **Automated Health Checks**: Monitors all KCA services at configurable intervals (default: 5 minutes)
- **Service Type Support**: Different validation logic for OCSP, TSP, CRL, and CA services
- **Response Time Tracking**: Records response times for each health check
- **Incident Management**: Automatically creates incidents when services go down and resolves them when restored
- **Comprehensive Logging**: Color-coded console output and file-based logging
- **Scheduler Control**: Start/stop monitoring via API or automatic startup
- **Manual Checks**: Trigger on-demand health checks via API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License