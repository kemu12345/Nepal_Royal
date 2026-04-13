<?php
/**
 * Royal Nepal - User Login API
 * Endpoint: POST /backend/api/login.php
 */

include_once '../config/config.php';

header("Content-Type: application/json; charset=UTF-8");
include_once '../config/database.php';
include_once '../classes/User.php';
include_once '../middleware/CSRFToken.php';

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

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate CSRF token
if (!isset($data->csrf_token) || !CSRFToken::validate($data->csrf_token)) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Invalid CSRF token"
    ]);
    exit();
}

// Validate required fields
if(empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);
    exit();
}

// Database connection
$database = new Database();
$db = $database->getConnection();

if($db === null) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

// Create user object
$user = new User($db);
$user->email = $data->email;
$user->password = $data->password;

// Attempt login
$userData = $user->login();

if($userData) {
    // Store user data in session
    $_SESSION['user_id'] = $userData['user_id'];
    $_SESSION['email'] = $userData['email'];
    $_SESSION['role'] = $userData['role'];
    $_SESSION['first_name'] = $userData['first_name'];
    $_SESSION['last_name'] = $userData['last_name'];
    $_SESSION['logged_in'] = true;

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "data" => [
            "user_id" => $userData['user_id'],
            "email" => $userData['email'],
            "first_name" => $userData['first_name'],
            "last_name" => $userData['last_name'],
            "phone" => $userData['phone'],
            "role" => $userData['role'],
            "profile_image" => $userData['profile_image'],
            "email_verified" => $userData['email_verified']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
}

$database->closeConnection();
