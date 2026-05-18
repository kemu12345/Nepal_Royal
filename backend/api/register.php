<?php
/**
 * Royal Nepal - User Registration API
 * Endpoint: POST /backend/api/register.php
 */
use RoyalNepal\classes\User;
use RoyalNepal\config\Database;


header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';
// Only allow POST requests
if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if(empty($data->email) || empty($data->password) || empty($data->first_name) || empty($data->last_name)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "All fields are required (email, password, first_name, last_name)"
    ]);
    exit();
}

// Validate email format
if(!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format"
    ]);
    exit();
}

// Validate password length
if(strlen($data->password) < PASSWORD_MIN_LENGTH) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least " . PASSWORD_MIN_LENGTH . " characters"
    ]);
    exit();
}

// Validate first and last names contain letters and spaces only.
if (!preg_match('/^[\p{L}\s]+$/u', $data->first_name) || !preg_match('/^[\p{L}\s]+$/u', $data->last_name)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "First name and last name can contain letters and spaces only"
    ]);
    exit();
}

// Validate phone number (exactly 10 digits)
if (empty($data->phone) || !preg_match('/^[0-9]{10}$/', $data->phone)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Phone number must be exactly 10 digits"
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

// Check if email already exists
if($user->emailExists()) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "Email already registered"
    ]);
    exit();
}

// Set user properties
$user->password = $data->password;
$user->first_name = preg_replace('/\s+/', ' ', trim($data->first_name));
$user->last_name = preg_replace('/\s+/', ' ', trim($data->last_name));
$user->phone = $data->phone ?? null;
$user->role = 'user'; // Default role

// Register user
if($user->register()) {
    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully",
        "data" => [
            "user_id" => $user->user_id,
            "email" => $user->email,
            "first_name" => $user->first_name,
            "last_name" => $user->last_name,
            "role" => $user->role
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to register user"
    ]);
}

$database->closeConnection();
