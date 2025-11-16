// Dashboard State
let charts = {
    uptime: null,
    responseTime: null
};

let autoRefreshInterval = null;
const REFRESH_INTERVAL = 30000; // 30 seconds

// API Base URL
const API_BASE = '/api';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initializing...');
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    refreshData();

    // Setup auto-refresh
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    if (autoRefreshCheckbox.checked) {
        startAutoRefresh();
    }
}

function setupEventListeners() {
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    autoRefreshCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    autoRefreshInterval = setInterval(refreshData, REFRESH_INTERVAL);
    console.log('Auto-refresh enabled');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('Auto-refresh disabled');
    }
}

// Main refresh function
async function refreshData() {
    console.log('Refreshing dashboard data...');
    updateLastUpdateTime();

    try {
        await Promise.all([
            loadServices(),
            loadStats(),
            loadIncidents()
        ]);
        console.log('Dashboard data refreshed successfully');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showError('Failed to refresh dashboard data');
    }
}

// Load services and display status cards
async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/kca/all`);
        const data = await response.json();

        if (data.success) {
            displayServices(data.data);
            updateHeaderStats(data.data);
        }
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('servicesGrid').innerHTML =
            '<div class="loading">Помилка завантаження даних сервісів</div>';
    }
}

// Display service cards
function displayServices(services) {
    const grid = document.getElementById('servicesGrid');

    if (!services || services.length === 0) {
        grid.innerHTML = '<div class="loading">Немає доступних сервісів</div>';
        return;
    }

    grid.innerHTML = services.map(service => createServiceCard(service)).join('');
}

// Create individual service card
function createServiceCard(service) {
    const status = service.last_status || 'unknown';
    const responseTime = service.last_response_time || '-';
    const lastChecked = service.last_checked_at ? formatDateTime(service.last_checked_at) : 'Ніколи';
    const statusCode = service.last_status_code || '-';

    return `
        <div class="service-card status-${status}">
            <div class="service-header">
                <div class="service-name">${service.name}</div>
                <div class="service-status ${status}">${getStatusText(status)}</div>
            </div>
            <div class="service-type">${service.service_type}</div>
            <div class="service-description">${service.description || ''}</div>
            <div class="service-metrics">
                <div class="metric">
                    <div class="metric-label">Час відповіді</div>
                    <div class="metric-value ${responseTime < 1000 ? 'good' : 'bad'}">
                        ${responseTime !== '-' ? responseTime + ' мс' : '-'}
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-label">HTTP код</div>
                    <div class="metric-value">${statusCode}</div>
                </div>
            </div>
            <div style="margin-top: 12px; font-size: 0.85em; color: #718096;">
                Останя перевірка: ${lastChecked}
            </div>
        </div>
    `;
}

// Update header statistics
function updateHeaderStats(services) {
    const totalServices = services.length;
    const servicesUp = services.filter(s => s.last_status === 'up').length;
    const servicesDown = services.filter(s => s.last_status === 'down').length;

    // Calculate average response time
    const responseTimes = services
        .filter(s => s.last_response_time && s.last_status === 'up')
        .map(s => s.last_response_time);

    const avgResponse = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    document.getElementById('totalServices').textContent = totalServices;
    document.getElementById('servicesUp').textContent = servicesUp;
    document.getElementById('servicesDown').textContent = servicesDown;
    document.getElementById('avgResponse').textContent = avgResponse > 0 ? avgResponse + ' мс' : '-';
}

// Load and display statistics with charts
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats?hours=24`);
        const data = await response.json();

        if (data.success) {
            displayStatsTable(data.data);
            createCharts(data.data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('statsTableBody').innerHTML =
            '<tr><td colspan="7" class="loading">Помилка завантаження статистики</td></tr>';
    }
}

// Display statistics table
function displayStatsTable(stats) {
    const tbody = document.getElementById('statsTableBody');

    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Немає даних статистики</td></tr>';
        return;
    }

    tbody.innerHTML = stats.map(stat => {
        const uptime = stat.uptime_percentage || 0;
        const avgResponse = stat.avg_response_time ? Math.round(stat.avg_response_time) : '-';
        const currentStatus = stat.total_checks > 0 ? (uptime > 50 ? 'up' : 'down') : 'unknown';

        return `
            <tr>
                <td><strong>${stat.name}</strong></td>
                <td><span class="service-type">${stat.short_name.split('-')[0].toUpperCase()}</span></td>
                <td><strong>${uptime.toFixed(2)}%</strong></td>
                <td>${stat.total_checks || 0}</td>
                <td>${stat.successful_checks || 0}</td>
                <td>${avgResponse !== '-' ? avgResponse + ' мс' : '-'}</td>
                <td>
                    <span class="status-badge ${currentStatus}">
                        ${getStatusText(currentStatus)}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Create charts
function createCharts(stats) {
    createUptimeChart(stats);
    createResponseTimeChart(stats);
}

// Create uptime chart
function createUptimeChart(stats) {
    const ctx = document.getElementById('uptimeChart');
    if (!ctx) return;

    // Destroy existing chart
    if (charts.uptime) {
        charts.uptime.destroy();
    }

    const labels = stats.map(s => s.short_name);
    const data = stats.map(s => s.uptime_percentage || 0);

    charts.uptime = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Доступність (%)',
                data: data,
                backgroundColor: data.map(val =>
                    val >= 95 ? 'rgba(72, 187, 120, 0.8)' :
                    val >= 80 ? 'rgba(237, 137, 54, 0.8)' :
                    'rgba(245, 101, 101, 0.8)'
                ),
                borderColor: data.map(val =>
                    val >= 95 ? 'rgba(72, 187, 120, 1)' :
                    val >= 80 ? 'rgba(237, 137, 54, 1)' :
                    'rgba(245, 101, 101, 1)'
                ),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Доступність: ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Create response time chart
function createResponseTimeChart(stats) {
    const ctx = document.getElementById('responseTimeChart');
    if (!ctx) return;

    // Destroy existing chart
    if (charts.responseTime) {
        charts.responseTime.destroy();
    }

    const labels = stats.map(s => s.short_name);
    const data = stats.map(s => s.avg_response_time ? Math.round(s.avg_response_time) : 0);

    charts.responseTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Середній час відповіді (мс)',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' мс';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Час: ' + context.parsed.y + ' мс';
                        }
                    }
                }
            }
        }
    });
}

// Load and display incidents
async function loadIncidents() {
    try {
        const response = await fetch(`${API_BASE}/incidents`);
        const data = await response.json();

        if (data.success) {
            displayIncidents(data.data);
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
        document.getElementById('incidentsContainer').innerHTML =
            '<div class="loading">Помилка завантаження інцидентів</div>';
    }
}

// Display incidents
function displayIncidents(incidents) {
    const container = document.getElementById('incidentsContainer');

    if (!incidents || incidents.length === 0) {
        container.innerHTML = `
            <div class="no-incidents">
                <div>Активних інцидентів немає</div>
                <div style="font-size: 0.9em; margin-top: 8px;">Всі сервіси працюють нормально</div>
            </div>
        `;
        return;
    }

    container.innerHTML = incidents.map(incident => createIncidentCard(incident)).join('');
}

// Create incident card
function createIncidentCard(incident) {
    const startedAt = formatDateTime(incident.started_at);
    const duration = calculateDuration(incident.started_at);

    return `
        <div class="incident-card">
            <div class="incident-header">
                <div class="incident-service">${incident.service_name}</div>
                <div class="incident-severity">${incident.severity}</div>
            </div>
            <div class="incident-description">${incident.description || 'Сервіс недоступний'}</div>
            <div class="incident-time">
                Почато: ${startedAt} (${duration})
            </div>
        </div>
    `;
}

// Utility Functions
function getStatusText(status) {
    const statusMap = {
        'up': 'Активний',
        'down': 'Недоступний',
        'unknown': 'Невідомо'
    };
    return statusMap[status] || 'Невідомо';
}

function formatDateTime(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} год тому`;

    return date.toLocaleString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateDuration(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now - start;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} хвилин`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} годин`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} днів`;
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('uk-UA');
}

function showError(message) {
    console.error(message);
    // You could add a toast notification here
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        refreshData,
        loadServices,
        loadStats,
        loadIncidents
    };
}
