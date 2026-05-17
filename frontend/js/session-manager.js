/**
 * Nepal Royal - Session Management
 * Centralized session handling for user authentication and state management
 */

class SessionManager {
    /**
     * Initialize session manager
     */
    static init() {
        this.checkSessionExpiry();
        this.setupSessionWarning();
    }

    /**
     * Save user data to session
     * @param {object} user - User object to save
     */
    static saveUser(user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('loginTime', new Date().getTime().toString());
        debugLog('User session saved', user.email);
    }

    /**
     * Get current user from session
     * @returns {object|null} User object or null
     */
    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in
     */
    static isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    /**
     * Get user role
     * @returns {string|null} User role or null
     */
    static getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    /**
     * Check if user is admin
     * @returns {boolean} True if admin
     */
    static isAdmin() {
        return this.getUserRole() === 'admin';
    }

    /**
     * Clear session and logout user
     */
    static clearSession() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('sessionWarningShown');
        debugLog('Session cleared');
    }

    /**
     * Check if session has expired (24 hours)
     * @returns {boolean} True if expired
     */
    static isSessionExpired() {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return false;

        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const currentTime = new Date().getTime();
        const loginTimeMs = parseInt(loginTime);

        return (currentTime - loginTimeMs) > SESSION_DURATION;
    }

    /**
     * Check and handle session expiry
     */
    static checkSessionExpiry() {
        if (this.isLoggedIn() && this.isSessionExpired()) {
            showToast('Your session has expired. Please login again.', 'warning');
            this.clearSession();
            redirectTo('login.html', 1500);
        }
    }

    /**
     * Setup session warning (warn before expiry)
     */
    static setupSessionWarning() {
        if (!this.isLoggedIn()) return;

        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return;

        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        const WARNING_TIME = 23 * 60 * 60 * 1000; // Warn at 23 hours

        setInterval(() => {
            const currentTime = new Date().getTime();
            const loginTimeMs = parseInt(loginTime);
            const elapsed = currentTime - loginTimeMs;

            if (elapsed > WARNING_TIME && elapsed < SESSION_DURATION) {
                const warningShown = sessionStorage.getItem('sessionWarningShown');
                if (!warningShown) {
                    showToast('Your session will expire in 1 hour. Please save your work.', 'warning');
                    sessionStorage.setItem('sessionWarningShown', 'true');
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Renew session (update login time)
     */
    static renewSession() {
        if (this.isLoggedIn()) {
            localStorage.setItem('loginTime', new Date().getTime().toString());
            sessionStorage.removeItem('sessionWarningShown');
            debugLog('Session renewed');
        }
    }

    /**
     * Get remaining session time in minutes
     * @returns {number} Minutes remaining
     */
    static getTimeRemaining() {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return 0;

        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        const currentTime = new Date().getTime();
        const loginTimeMs = parseInt(loginTime);
        const remaining = SESSION_DURATION - (currentTime - loginTimeMs);

        return Math.max(0, Math.ceil(remaining / 60000)); // Convert to minutes
    }

    /**
     * Require login - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect back to
     */
    static requireLogin(redirectUrl = window.location.href) {
        if (!this.isLoggedIn()) {
            showToast('Please login first', 'warning');
            redirectTo(`login.html?redirect=${encodeURIComponent(redirectUrl)}`, 1000);
        }
    }

    /**
     * Require admin role - redirect if not admin
     */
    static requireAdmin() {
        if (!this.isLoggedIn()) {
            showToast('Please login first', 'warning');
            redirectTo('login.html', 1000);
            return;
        }

        if (!this.isAdmin()) {
            showToast('Admin access required', 'error');
            redirectTo('dashboard.html', 1000);
        }
    }
}

// Initialize session manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.init();
});
