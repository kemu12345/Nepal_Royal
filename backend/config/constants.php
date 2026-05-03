<?php
/**
 * Royal Nepal - Application Constants
 * This file contains only constant declarations to comply with PSR-1.
 */

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
