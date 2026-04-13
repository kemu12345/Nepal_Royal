<?php
/**
 * API Endpoint for Generating a CSRF (Cross-Site Request Forgery) Token.
 *
 * This script generates a unique token and stores it in the user's session.
 * The frontend application should fetch this token and include it in the headers
 * or body of subsequent state-changing requests (e.g., POST, PUT, DELETE)
 * to protect against CSRF attacks.
 *
 * Endpoint: GET /backend/api/get-csrf-token.php
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration and middleware files.
include_once '../config/config.php';
include_once '../middleware/CSRFToken.php';

// Start a new session or resume the existing one to store the token.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Only allow GET requests.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit;
}

try {
    // Generate a new CSRF token or retrieve the existing one from the session.
    $token = CSRFToken::generate();

    // Return a success response with the CSRF token.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "csrf_token" => $token
    ]);

} catch (Exception $e) {
    // If any error occurs during token generation, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error generating CSRF token: " . $e->getMessage()
    ]);
}
?>
