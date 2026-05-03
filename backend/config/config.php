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
ini_set('session.cookie_samesite', 'Lax');

// CORS headers for API (allow trusted local origins in development)
$allowed_origins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'null' // file:// pages send Origin: null
];

$request_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($request_origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $request_origin);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include application constants (PSR-1 separation of declarations and side effects)
require_once __DIR__ . '/constants.php';

/**
 * PSR-4 Autoloader
 * Automatically loads classes based on their namespace.
 */
spl_autoload_register(function ($class) {
    // Project-specific namespace prefix
    $prefix = 'RoyalNepal\\';

    // Base directory for the namespace prefix
    $base_dir = __DIR__ . '/../';

    // Does the class use the namespace prefix?
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // No, move to the next registered autoloader
        return;
    }

    // Get the relative class name
    $relative_class = substr($class, $len);

    // Replace namespace separators with directory separators in the relative class name,
    // append with .php
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require_once $file;
    }
});
