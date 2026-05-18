<?php
/**
 * Royal Nepal - Update Logged-in User Profile API
 * Endpoint: POST /backend/api/update_profile.php
 */
use RoyalNepal\classes\User;
use RoyalNepal\config\Database;

header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->first_name) || empty($data->last_name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "First name and last name are required"]);
    exit();
}

if (!preg_match('/^[\p{L}\s]+$/u', $data->first_name) || !preg_match('/^[\p{L}\s]+$/u', $data->last_name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "First name and last name can contain letters and spaces only"]);
    exit();
}

if (!empty($data->phone) && !preg_match('/^[0-9]{10}$/', $data->phone)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Phone number must be exactly 10 digits"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

try {
    $user = new User($db);
    $user->user_id = (int) $_SESSION['user_id'];
    $user->first_name = preg_replace('/\s+/', ' ', trim($data->first_name));
    $user->last_name = preg_replace('/\s+/', ' ', trim($data->last_name));
    $user->phone = isset($data->phone) ? trim((string) $data->phone) : null;

    if ($user->updateProfile()) {
        $updatedUser = $user->getUserById($user->user_id);

        if ($updatedUser) {
            $_SESSION['first_name'] = $updatedUser['first_name'];
            $_SESSION['last_name'] = $updatedUser['last_name'];
            $_SESSION['phone'] = $updatedUser['phone'] ?? null;
        }

        echo json_encode([
            "success" => true,
            "message" => "Profile updated successfully",
            "data" => $updatedUser ?: [
                "user_id" => $user->user_id,
                "first_name" => $user->first_name,
                "last_name" => $user->last_name,
                "phone" => $user->phone
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Unable to update profile"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$database->closeConnection();