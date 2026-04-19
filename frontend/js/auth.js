/*
    This script handles the client-side functionality for user authentication,
    including login, registration, and session management.
    It communicates with the backend API to verify credentials and create users.
*/

const API_BASE_STORAGE_KEY = 'royalNepalApiBaseUrl';

/**
 * Builds preferred API base candidates for local development and same-origin serving.
 * @returns {string[]}
 */
function buildApiBaseCandidates() {
    const { protocol, port, hostname, origin, pathname } = window.location;
    const candidates = new Set();

    try {
        const savedBase = localStorage.getItem(API_BASE_STORAGE_KEY);
        if (savedBase) {
            candidates.add(savedBase);
        }
    } catch (error) {
        console.warn('Unable to read saved API base URL:', error);
    }

    // For local development with separate servers
    if (protocol === 'file:' || port === '5500' || port === '5501') {
        candidates.add(`http://${hostname || 'localhost'}:8000/backend/api`);
    }

    // Since all HTML files are in frontend/pages/, the backend is always at ../../backend/api
    candidates.add('../../backend/api');

    // Dynamic detection for XAMPP subdirectories (e.g., /Nepal_Royal/)
    const parts = pathname.split('/');
    const index = parts.findIndex(part => part.toLowerCase() === 'nepal_royal');
    if (index !== -1) {
        const projectBase = parts.slice(0, index + 1).join('/');
        candidates.add(`${projectBase}/backend/api`);
        candidates.add(`${origin}${projectBase}/backend/api`);
    }

    candidates.add(`${origin}/backend/api`);
    candidates.add('/backend/api');

    return Array.from(candidates);
}

const API_BASE_CANDIDATES = buildApiBaseCandidates();
let activeApiBaseUrl = API_BASE_CANDIDATES[0] || '/backend/api';

/**
 * Persists and updates the active API base URL after a successful request.
 * @param {string} apiBaseUrl
 */
function rememberApiBaseUrl(apiBaseUrl) {
    activeApiBaseUrl = apiBaseUrl;
    try {
        localStorage.setItem(API_BASE_STORAGE_KEY, apiBaseUrl);
    } catch (error) {
        console.warn('Unable to persist API base URL:', error);
    }
}

/**
 * Fetches an API path using fallback base URLs when network errors or non-JSON 404 pages occur.
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<{response: Response, apiBaseUrl: string}>}
 */
async function apiFetch(path, options = {}) {
    const tried = new Set();
    const orderedBases = [activeApiBaseUrl, ...API_BASE_CANDIDATES];
    let lastNetworkError = null;

    for (const apiBaseUrl of orderedBases) {
        if (!apiBaseUrl || tried.has(apiBaseUrl)) {
            continue;
        }
        tried.add(apiBaseUrl);

        try {
            const response = await fetch(`${apiBaseUrl}${path}`, options);
            const contentType = (response.headers.get('content-type') || '').toLowerCase();

            // Skip non-JSON pages (like raw PHP files served by Live Server) so it doesn't break
            if (!contentType.includes('application/json')) {
                continue;
            }

            rememberApiBaseUrl(apiBaseUrl);
            return { response, apiBaseUrl };
        } catch (error) {
            if (error instanceof TypeError) {
                lastNetworkError = error;
                continue;
            }
            throw error;
        }
    }

    if (lastNetworkError) {
        throw lastNetworkError;
    }

    throw new Error('Unable to resolve a working backend API URL.');
}

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('info', 'success', 'error').
 */
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    // The message will automatically disappear after 5 seconds.
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

/**
 * Toggles the loading state of a button, disabling it and showing a spinner.
 * @param {HTMLElement} button - The button element to toggle.
 * @param {boolean} isLoading - Whether to show the loading state or not.
 */
function toggleButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline';
        button.disabled = true;
    } else {
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
        button.disabled = false;
    }
}

/**
 * Fetches and sets the CSRF token.
 */
async function fetchAndSetCsrfToken(silent = false) {
    try {
        const { response, apiBaseUrl } = await apiFetch('/get-csrf-token.php', {
            credentials: 'include' // Send cookies with the request
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token (${response.status})`);
        }

        const data = await response.json();
        if (data.success) {
            const csrfTokenInput = document.getElementById('csrfToken');
            if (csrfTokenInput) {
                csrfTokenInput.value = data.csrf_token;
            }
            rememberApiBaseUrl(apiBaseUrl);
            return data.csrf_token;
        } else {
            if (!silent) {
                showMessage(data.message || 'Failed to fetch security token.', 'error');
            }
            return '';
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        if (!silent) {
            const backendUrl = `${activeApiBaseUrl}/get-csrf-token.php`;
            if (error instanceof TypeError) {
                showMessage(`Cannot reach backend API. Start PHP server and retry. Endpoint: ${backendUrl}`, 'error');
            } else {
                showMessage(`Security token request failed: ${error.message}`, 'error');
            }
        }
        return '';
    }
}

// Attaches an event listener to the login form.
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevents the default form submission.

        const loginBtn = document.getElementById('loginBtn');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const csrfTokenInput = document.getElementById('csrfToken');
        let csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

        // Basic client-side validation.
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        if (!csrfToken) {
            csrfToken = await fetchAndSetCsrfToken();
        }

        if (!csrfToken) {
            showMessage('Security token missing. Please refresh the page.', 'error');
            return;
        }

        toggleButtonLoading(loginBtn, true);

        try {
            let data = null;

            // Retry once with a freshly fetched token when backend reports CSRF failure.
            for (let attempt = 0; attempt < 2; attempt += 1) {
                const { response } = await apiFetch('/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Send cookies with the request
                    body: JSON.stringify({
                        email,
                        password,
                        csrf_token: csrfToken
                    })
                });

                data = await response.json();

                if (data.success) {
                    break;
                }

                const isCsrfFailure = response.status === 403 || /csrf/i.test(data.message || '');
                if (attempt === 0 && isCsrfFailure) {
                    csrfToken = await fetchAndSetCsrfToken(true);
                    if (!csrfToken) {
                        break;
                    }
                    continue;
                }

                break;
            }

            if (data && data.success) {
                // Store user data in localStorage for dashboard verification
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(data.data));

                showMessage('Login successful! Redirecting...', 'success');

                // Check if there's a redirect URL in the query parameters.
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                // Redirect the user to the appropriate dashboard or the redirect URL.
                setTimeout(() => {
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else if (data.data.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } else {
                showMessage((data && data.message) || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An error occurred during login. Please try again.', 'error');
        } finally {
            toggleButtonLoading(loginBtn, false);
        }
    });
}

// Attaches an event listener to the registration form.
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const registerBtn = document.getElementById('registerBtn');
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim() || '';
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms')?.checked;
        const csrfTokenInput = document.getElementById('csrfToken');
        let csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

        // Basic client-side validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        const namePattern = /^[\p{L}]+$/u;
        if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
            showMessage('First name and last name must contain letters only', 'error');
            return;
        }

        if (!agreeTerms) {
            showMessage('Please agree to the Terms of Service', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        if (!csrfToken) {
            csrfToken = await fetchAndSetCsrfToken();
        }

        if (!csrfToken) {
            showMessage('Security token missing. Please refresh the page.', 'error');
            return;
        }

        toggleButtonLoading(registerBtn, true);

        try {
            // Sends the new user data to the backend API.
            const { response } = await apiFetch('/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send cookies with the request
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone || null,
                    password: password,
                    csrf_token: csrfToken
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Registration successful! Redirecting to login...', 'success');

                // Redirects to the login page after successful registration.
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('An error occurred during registration. Please try again.', 'error');
        } finally {
            toggleButtonLoading(registerBtn, false);
        }
    });
}

/**
 * Checks if a user is already logged in. If so, it redirects them from
 * the login/register pages to their dashboard.
 */
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;

    if (isLoggedIn === 'true' && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        const user = JSON.parse(localStorage.getItem('user'));

        // Redirect to the appropriate dashboard based on user role.
        if (user && user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

/**
 * Logs the user out by clearing their data from localStorage and redirecting to the home page.
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}

/**
 * Sets up the functionality for the "Forgot Password" modal.
 */
function setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordModalEl = document.getElementById('forgotPasswordModal');

    if (!forgotPasswordLink || !forgotPasswordForm || !forgotPasswordModalEl || !window.bootstrap) {
        return;
    }

    const forgotPasswordModal = new bootstrap.Modal(forgotPasswordModalEl);

    // Show the modal when the "Forgot Password" link is clicked.
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const currentEmail = document.getElementById('email')?.value?.trim() || '';
        const resetEmailInput = document.getElementById('resetEmail');

        // Pre-fill the email in the modal if it's already entered in the login form.
        if (resetEmailInput && currentEmail) {
            resetEmailInput.value = currentEmail;
        }

        forgotPasswordModal.show();
    });

    // Handle the submission of the forgot password form.
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const resetPasswordBtn = document.getElementById('resetPasswordBtn');
        const resetEmail = document.getElementById('resetEmail')?.value?.trim();

        if (!resetEmail) {
            showMessage('Please enter your email address', 'error');
            return;
        }

        toggleButtonLoading(resetPasswordBtn, true);

        try {
            // This is a simulation. In a real application, this would send a request
            // to a backend endpoint to handle the password reset process.
            await new Promise((resolve) => setTimeout(resolve, 800));
            forgotPasswordModal.hide();
            forgotPasswordForm.reset();
            showMessage('If this email exists, a reset link has been sent.', 'success');
        } catch (error) {
            console.error('Forgot password error:', error);
            showMessage('Unable to process reset request right now. Please try again.', 'error');
        } finally {
            toggleButtonLoading(resetPasswordBtn, false);
        }
    });
}

// When the page content is fully loaded, run initial checks.
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupForgotPassword();

    if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
        fetchAndSetCsrfToken(true);
    }
});
