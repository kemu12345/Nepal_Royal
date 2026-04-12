/**
 * Royal Nepal - Main JavaScript
 * Common functions and utilities
 */

const API_BASE_URL = '../../backend/api';

// Get current user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Logout function
async function logout() {
    try {
        // Call logout API
        await fetch(`${API_BASE_URL}/logout.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Protect pages that require authentication
function requireAuth(requiredRole = null) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();

    if (requiredRole && user.role !== requiredRole) {
        alert('You do not have permission to access this page');
        window.location.href = 'dashboard.html';
        return false;
    }

    return true;
}

// Format currency
function formatCurrency(amount, currency = 'NPR') {
    const formatted = parseFloat(amount).toLocaleString('en-NP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return currency === 'NPR' ? `रू ${formatted}` : `$${formatted}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Make API request with error handling
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Display user info in navbar (if exists)
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

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    // Display user info if logged in
    if (isLoggedIn()) {
        displayUserInfo();
    }

    // Attach logout event to logout buttons
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

// Export functions for use in other scripts
window.RoyalNepal = {
    getCurrentUser,
    isLoggedIn,
    logout,
    requireAuth,
    formatCurrency,
    formatDate,
    apiRequest
};
