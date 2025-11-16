const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Root endpoint (landing page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler for non-API routes
app.use((req, res, next) => {
  // If it's an API request, return JSON error
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  } else {
    // For non-API requests, serve the 404 page or redirect
    res.status(404).send('<h1>404 - Page Not Found</h1><p><a href="/">Go to Home</a> | <a href="/dashboard">Go to Dashboard</a></p>');
  }
});

// Error handler
app.use(errorHandler);

module.exports = app;
