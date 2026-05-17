/**
 * Nepal Royal - API Request Handler
 * Centralized API request handling with improved error handling and logging
 */

class APIHandler {
    /**
     * Initialize API handler
     * @param {string} baseUrl - Base API URL
     */
    static init(baseUrl = null) {
        this.baseUrl = baseUrl || getApiBaseUrl();
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Make an API request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Request options
     * @returns {Promise<object>} API response
     */
    static async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        const body = options.body;
        const headers = options.headers || {};

        // Set default headers
        if (!(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const url = `${this.baseUrl}/${endpoint}`;
        debugLog(`API Request: ${method} ${endpoint}`);

        try {
            const response = await this._fetchWithTimeout(url, {
                method,
                headers,
                body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
                credentials: 'include'
            });

            const data = await this._parseResponse(response);

            // Check for API-level errors
            if (!response.ok) {
                const errorMsg = data.message || `HTTP ${response.status}: ${response.statusText}`;
                errorLog(`API Error on ${endpoint}`, data);
                throw new APIError(errorMsg, response.status, data);
            }

            if (data.success === false) {
                errorLog(`API Response Error on ${endpoint}`, data);
                throw new APIError(data.message || 'API request failed', response.status, data);
            }

            debugLog(`API Success: ${endpoint}`, data);
            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            // Handle network errors
            if (error.name === 'AbortError') {
                throw new APIError('Request timeout. Please try again.', 408, null);
            }

            errorLog(`API Request Failed: ${endpoint}`, error);
            throw new APIError(error.message || 'Network request failed', 0, null);
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    static async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(fullEndpoint, { method: 'GET' });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<object>} API response
     */
    static async post(endpoint, data = {}) {
        return this.request(endpoint, { method: 'POST', body: data });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<object>} API response
     */
    static async put(endpoint, data = {}) {
        return this.request(endpoint, { method: 'PUT', body: data });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<object>} API response
     */
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Fetch with timeout
     * @private
     */
    static async _fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    /**
     * Parse response
     * @private
     */
    static async _parseResponse(response) {
        const text = await response.text();
        if (!text) return {};

        try {
            return JSON.parse(text);
        } catch (error) {
            errorLog('Failed to parse response', text.slice(0, 100));
            return { message: 'Invalid response format', data: text };
        }
    }

    /**
     * Retry a request with exponential backoff
     * @param {string} endpoint - API endpoint
     * @param {object} options - Request options
     * @param {number} attempt - Current attempt number
     * @returns {Promise<object>} API response
     */
    static async retryRequest(endpoint, options = {}, attempt = 1) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (attempt >= this.retryAttempts || error.status >= 400) {
                throw error;
            }

            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            debugLog(`Retrying ${endpoint} in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryRequest(endpoint, options, attempt + 1);
        }
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    /**
     * Constructor
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {object} data - Response data
     */
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    /**
     * Check if error is authentication-related
     * @returns {boolean}
     */
    isAuthError() {
        return this.status === 401 || this.status === 403;
    }

    /**
     * Check if error is validation-related
     * @returns {boolean}
     */
    isValidationError() {
        return this.status === 400;
    }

    /**
     * Check if error is server-related
     * @returns {boolean}
     */
    isServerError() {
        return this.status >= 500;
    }

    /**
     * Check if error is network-related
     * @returns {boolean}
     */
    isNetworkError() {
        return this.status === 0 || this.status === 408;
    }
}

// Initialize API handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    APIHandler.init();
});
