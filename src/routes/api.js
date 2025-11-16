const express = require('express');
const router = express.Router();
const KcaController = require('../controllers/kcaController');

// KCA Services routes
router.get('/kca/all', KcaController.getAllServices);
router.get('/kca/:id', KcaController.getServiceById);
router.get('/kca/:id/history', KcaController.getServiceHistory);
router.get('/kca/:id/incidents', KcaController.getServiceIncidents);

// Statistics routes
router.get('/stats', KcaController.getStats);

// Incidents routes
router.get('/incidents', KcaController.getActiveIncidents);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
