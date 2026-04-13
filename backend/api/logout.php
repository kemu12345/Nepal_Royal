<?php
/**
 * Royal Nepal - User Logout API
 * Endpoint: POST /backend/api/logout.php
 */

header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Only allow POST requests
if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Destroy session
session_unset();
session_destroy();

// Clear session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Logged out successfully"
]);
?>
