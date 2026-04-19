/*
    This script provides common, reusable functions and utilities for the entire application.
    It includes functions for user authentication, API requests, data formatting,
    and initializes common elements like the logout button.
*/

// Base URL for the backend API.
const API_BASE_URL = (() => {
    const { protocol, port, hostname, origin, pathname } = window.location;
    if (protocol === 'file:' || port === '5500') {
        return `http://${hostname || 'localhost'}:8000/backend/api`;
    }
    
    // Support for subdirectories (like XAMPP's htdocs/Nepal_Royal/)
    const pathParts = pathname.split('/');
    const frontendIndex = pathParts.indexOf('frontend');
    if (frontendIndex > 0) {
        const basePath = pathParts.slice(0, frontendIndex).join('/');
        return `${origin}${basePath}/backend/api`;
    }
    
    return '/backend/api';
})();

/**
 * Retrieves the current user's data from local storage.
 * @returns {object|null} The user object or null if not found.
 */
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Checks if the user is currently logged in by checking local storage.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Handles the user logout process.
 * It calls the logout API endpoint and clears user data from local storage.
 */
async function logout() {
    try {
        // Call the backend logout script.
        await fetch(`${API_BASE_URL}/logout.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout API call failed:', error);
    } finally {
        // Always clear local storage regardless of API call success.
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        // Redirect the user to the login page.
        window.location.href = 'login.html';
    }
}

/**
 * Protects pages that require user authentication.
 * Redirects to the login page if the user is not logged in.
 * Can also check for a specific user role (e.g., 'admin').
 * @param {string|null} requiredRole - The role required to access the page.
 * @returns {boolean} True if the user is authenticated and has the required role.
 */
function requireAuth(requiredRole = null) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();

    // If a role is required, check if the user has that role.
    if (requiredRole && user && user.role !== requiredRole) {
        alert('You do not have permission to access this page.');
        window.location.href = 'dashboard.html'; // Redirect to a safe page.
        return false;
    }

    return true;
}

/**
 * Formats a number into a currency string (e.g., "रू 1,234.56").
 * @param {number|string} amount - The amount to format.
 * @param {string} currency - The currency code (defaults to 'NPR').
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount, currency = 'NPR') {
    const formatted = parseFloat(amount).toLocaleString('en-NP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return currency === 'NPR' ? `रू ${formatted}` : `$${formatted}`;
}

/**
 * Formats a date string into a more readable format (e.g., "January 1, 2023").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * A wrapper for making API requests using the Fetch API.
 * It includes default headers and error handling.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<object>} A promise that resolves with the JSON response data.
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const method = options.method || 'GET';
        const isFormData = options.body instanceof FormData;
        const headers = {
            ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            ...options,
            method,
            credentials: 'include',
            headers
        });

        const raw = await response.text();
        let data;
        try {
            data = raw ? JSON.parse(raw) : {};
        } catch (_parseError) {
            const preview = raw.slice(0, 120).replace(/\s+/g, ' ').trim();
            throw new Error(`Unexpected response from server: ${preview || 'empty response'}`);
        }

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Displays the current user's name and role in the UI, if the elements exist.
 */
function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (userNameElement) {
        userNameElement.textContent = `${user.first_name} ${user.last_name}`;
    }

    if (userRoleElement) {
        userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
}

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Display user info in the navbar if the user is logged in.
    if (isLoggedIn()) {
        displayUserInfo();
    }

    // Attach a click event listener to all logout buttons.
    const logoutButtons = document.querySelectorAll('.logout-btn, #logoutBtn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });
});

// Expose key functions to the global window object to be accessible from other scripts.
window.RoyalNepal = {
    getCurrentUser,
    isLoggedIn,
    logout,
    requireAuth,
    formatCurrency,
    formatDate,
    apiRequest
};
