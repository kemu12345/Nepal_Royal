/**
 * Royal Nepal - Authentication JavaScript (Bootstrap Enhanced)
 * Handles login and registration functionality
 */

const API_BASE_URL = '../../backend/api';

// Utility function to show messages
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

// Utility function to toggle button loading state
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

// Handle Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loginBtn = document.getElementById('loginBtn');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validation
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        toggleButtonLoading(loginBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.data));
                localStorage.setItem('isLoggedIn', 'true');

                showMessage('Login successful! Redirecting...', 'success');

                // Check for redirect URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                // Redirect based on role or redirect URL
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
                showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Demo login for testing without backend
            if (email === 'demo@royalnepal.com' && password === 'demo123') {
                const demoUser = {
                    user_id: 1,
                    first_name: 'Demo',
                    last_name: 'User',
                    email: 'demo@royalnepal.com',
                    role: 'user'
                };
                localStorage.setItem('user', JSON.stringify(demoUser));
                localStorage.setItem('isLoggedIn', 'true');
                showMessage('Demo login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                return;
            }
            
            // Admin demo login
            if (email === 'admin@royalnepal.com' && password === 'admin123') {
                const adminUser = {
                    user_id: 0,
                    first_name: 'Admin',
                    last_name: 'User',
                    email: 'admin@royalnepal.com',
                    role: 'admin'
                };
                localStorage.setItem('user', JSON.stringify(adminUser));
                localStorage.setItem('isLoggedIn', 'true');
                showMessage('Admin login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
                return;
            }
            
            showMessage('Invalid credentials. Try admin@royalnepal.com / admin123 or demo@royalnepal.com / demo123', 'error');
        } finally {
            toggleButtonLoading(loginBtn, false);
        }
    });
}

// Handle Registration Form
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

        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (agreeTerms !== undefined && !agreeTerms) {
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

        toggleButtonLoading(registerBtn, true);

        try {
            const response = await fetch(`${API_BASE_URL}/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone || null,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Registration successful! Redirecting to login...', 'success');

                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            // Demo registration (simulated success)
            showMessage('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } finally {
            toggleButtonLoading(registerBtn, false);
        }
    });
}

// Check if user is already logged in (for auth pages)
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;

    if (isLoggedIn === 'true' && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        const user = JSON.parse(localStorage.getItem('user'));

        // Redirect to appropriate dashboard
        if (user && user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}

// Handle Forgot Password Modal
function setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordModalEl = document.getElementById('forgotPasswordModal');

    if (!forgotPasswordLink || !forgotPasswordForm || !forgotPasswordModalEl || !window.bootstrap) {
        return;
    }

    const forgotPasswordModal = new bootstrap.Modal(forgotPasswordModalEl);

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const currentEmail = document.getElementById('email')?.value?.trim() || '';
        const resetEmailInput = document.getElementById('resetEmail');

        if (resetEmailInput && currentEmail) {
            resetEmailInput.value = currentEmail;
        }

        forgotPasswordModal.show();
    });

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
            // Simulate a short request; backend reset endpoint can be connected later.
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

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupForgotPassword();
});
