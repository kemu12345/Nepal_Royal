<?php
/**
 * Royal Nepal - Configuration Settings
 * Global application settings and constants
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Timezone
date_default_timezone_set('Asia/Kathmandu');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS

// CORS headers for API (adjust origin in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Application constants
define('APP_NAME', 'Royal Nepal');
define('APP_TAGLINE', 'Experience the pride of Nepalese');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost');
define('API_BASE_URL', BASE_URL . '/backend/api');

// Security
define('JWT_SECRET_KEY', 'your-secret-key-change-in-production-2024');
define('PASSWORD_MIN_LENGTH', 6);

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// File upload settings
define('UPLOAD_MAX_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);

// Currency settings
define('DEFAULT_CURRENCY', 'NPR');
define('NPR_TO_USD_RATE', 0.0075); // Approximate conversion rate
?>
