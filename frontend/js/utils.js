/**
 * Nepal Royal - Shared Utility Functions
 * Central location for common utility functions used across the application
 * Reduces code duplication and improves maintainability
 */

/**
 * Format a number as a price string with locale-specific formatting
 * @param {number} price - The price value to format
 * @param {string} locale - The locale code (default: 'en-NP' for Nepali)
 * @returns {string} Formatted price string
 */
function formatPrice(price, locale = 'en-NP') {
    return parseFloat(price || 0).toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Format a date string into a readable format
 * @param {string} dateString - The date string to format
 * @param {object} options - Formatting options for toLocaleDateString
 * @returns {string} Formatted date string
 */
function formatDate(dateString, options = {}) {
    const defaultOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format a date string to show time ago (e.g., "2 hours ago")
 * @param {string} dateString - The date string to format
 * @returns {string} Time ago string
 */
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return Math.floor(seconds) + ' seconds ago';
}

/**
 * Show a Bootstrap toast notification
 * @param {string} message - The message to display
 * @param {string} type - The toast type ('info', 'success', 'warning', 'error')
 * @param {number} duration - Duration to show in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Ensure the toast container exists
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }

    // Map types to Bootstrap classes
    const typeMap = {
        'info': 'info',
        'success': 'success',
        'warning': 'warning',
        'error': 'danger'
    };

    const bootstrapType = typeMap[type] || 'info';

    // Create and show toast
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${bootstrapType} text-white">
                <strong class="me-auto">Nepal Royal</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    container.appendChild(toastElement.firstElementChild);

    const toast = new bootstrap.Toast(toastElement.firstElementChild);
    toast.show();

    // Remove the toast element after it's hidden
    toastElement.firstElementChild.addEventListener('hidden.bs.toast', () => {
        toastElement.firstElementChild.remove();
    });
}

/**
 * Show an alert-style message (for use in older parts of the app)
 * @param {string} message - The message to display
 * @param {string} type - The message type ('info', 'success', 'warning', 'error')
 */
function showMessage(message, type = 'info') {
    // First try to show as toast (modern approach)
    if (typeof bootstrap !== 'undefined') {
        showToast(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}

/**
 * Logout the current user
 * Clears local storage and reloads the page
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get the current logged-in user from local storage
 * @returns {object|null} User object or null if not logged in
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (exactly 10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.trim());
}

/**
 * Validate that origin and destination are different
 * @param {string} origin - Origin location
 * @param {string} destination - Destination location
 * @returns {boolean} True if different
 */
function isValidRoute(origin, destination) {
    return origin && destination && origin !== destination;
}

/**
 * Format error response for display
 * @param {object} error - Error object from API or exception
 * @returns {string} User-friendly error message
 */
function formatErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.data && error.data.message) return error.data.message;
    return 'An unexpected error occurred';
}

/**
 * Log debug information (respects debug mode setting)
 * @param {string} message - Message to log
 * @param {any} data - Optional data to log
 */
function debugLog(message, data = null) {
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
        console.log(`[Nepal Royal] ${message}`, data || '');
    }
}

/**
 * Log error information
 * @param {string} message - Error message
 * @param {any} error - Optional error object
 */
function errorLog(message, error = null) {
    console.error(`[Nepal Royal ERROR] ${message}`, error || '');
}

/**
 * Get the API base URL from the page
 * @returns {string} API base URL
 */
function getApiBaseUrl() {
    // Check if API_BASE_URL is defined globally
    if (typeof API_BASE_URL !== 'undefined') {
        return API_BASE_URL;
    }
    // Default fallback
    return 'http://localhost:8000/backend/api';
}

/**
 * Parse URL parameters
 * @param {string} url - URL to parse (default: current location)
 * @returns {object} Object with query parameters
 */
function getUrlParams(url = window.location.href) {
    const params = {};
    const queryString = new URL(url).search;
    new URLSearchParams(queryString).forEach((value, key) => {
        params[key] = value;
    });
    return params;
}

/**
 * Redirect to page with optional delay
 * @param {string} url - URL to redirect to
 * @param {number} delay - Delay in milliseconds (default: 0)
 */
function redirectTo(url, delay = 0) {
    if (delay > 0) {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    } else {
        window.location.href = url;
    }
}

/**
 * Check if the device is mobile
 * @returns {boolean} True if device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Debounce function to limit function calls
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 * @param {function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
