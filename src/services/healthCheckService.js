const axios = require('axios');
const config = require('../config/config');

class HealthCheckService {
  /**
   * Perform health check on a service endpoint
   * @param {Object} service - Service object from database
   * @returns {Object} Health check result
   */
  static async checkService(service) {
    const startTime = Date.now();

    try {
      const result = await this.performCheck(service);
      const responseTime = Date.now() - startTime;

      return {
        service_id: service.id,
        status: result.success ? 'up' : 'down',
        response_time: responseTime,
        status_code: result.statusCode,
        error_message: result.error || null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        service_id: service.id,
        status: 'down',
        response_time: responseTime,
        status_code: error.response?.status || null,
        error_message: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Perform the actual HTTP check based on service configuration
   * @param {Object} service - Service configuration
   * @returns {Object} Check result
   */
  static async performCheck(service) {
    const { endpoint_url, check_method, expected_status, service_type } = service;

    const axiosConfig = {
      timeout: config.monitoring.checkTimeout,
      validateStatus: () => true, // Don't throw on any status code
      maxRedirects: 5,
      headers: {
        'User-Agent': 'KCA-Monitoring/1.0'
      }
    };

    try {
      let response;

      // Different check methods based on service type
      switch (check_method.toUpperCase()) {
        case 'GET':
          response = await axios.get(endpoint_url, axiosConfig);
          break;

        case 'HEAD':
          response = await axios.head(endpoint_url, axiosConfig);
          break;

        case 'POST':
          // For OCSP or other POST-based services
          response = await axios.post(endpoint_url, null, axiosConfig);
          break;

        default:
          response = await axios.get(endpoint_url, axiosConfig);
      }

      // Check if response status matches expected status
      const isSuccess = response.status === (expected_status || 200);

      // Additional validation for specific service types
      const typeValidation = this.validateServiceType(service_type, response);

      return {
        success: isSuccess && typeValidation.valid,
        statusCode: response.status,
        error: typeValidation.valid ? null : typeValidation.message
      };

    } catch (error) {
      // Network errors, timeouts, etc.
      throw error;
    }
  }

  /**
   * Validate response based on service type
   * @param {String} serviceType - Type of service (OCSP, CRL, TSP, CA)
   * @param {Object} response - Axios response
   * @returns {Object} Validation result
   */
  static validateServiceType(serviceType, response) {
    switch (serviceType.toUpperCase()) {
      case 'OCSP':
        // OCSP services should return specific content types
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/ocsp-response') ||
            response.status === 200) {
          return { valid: true };
        }
        return {
          valid: true, // Still consider it up if we get a response
          message: 'Unexpected content type for OCSP service'
        };

      case 'CRL':
        // CRL should be downloadable
        if (response.status === 200) {
          return { valid: true };
        }
        return {
          valid: false,
          message: 'CRL not accessible'
        };

      case 'TSP':
        // Timestamp service check
        if (response.status === 200 || response.status === 400) {
          // 400 is OK for TSP without proper request body
          return { valid: true };
        }
        return {
          valid: false,
          message: 'TSP service unavailable'
        };

      case 'CA':
        // General certificate authority website
        if (response.status === 200) {
          return { valid: true };
        }
        return {
          valid: false,
          message: 'CA service unavailable'
        };

      default:
        // Generic HTTP check
        return { valid: response.status >= 200 && response.status < 400 };
    }
  }

  /**
   * Check multiple services in parallel
   * @param {Array} services - Array of service objects
   * @returns {Array} Array of check results
   */
  static async checkMultipleServices(services) {
    const checkPromises = services.map(service =>
      this.checkService(service).catch(error => ({
        service_id: service.id,
        status: 'down',
        response_time: 0,
        status_code: null,
        error_message: error.message
      }))
    );

    return Promise.all(checkPromises);
  }

  /**
   * Determine service health status based on response
   * @param {Number} statusCode - HTTP status code
   * @param {Number} responseTime - Response time in ms
   * @returns {String} Health status: 'up', 'degraded', 'down'
   */
  static determineHealthStatus(statusCode, responseTime) {
    if (!statusCode || statusCode >= 500) {
      return 'down';
    }

    if (statusCode >= 400 || responseTime > 5000) {
      return 'degraded';
    }

    if (statusCode >= 200 && statusCode < 400) {
      return 'up';
    }

    return 'down';
  }
}

module.exports = HealthCheckService;
