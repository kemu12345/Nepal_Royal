<?php
/**
 * API Endpoint for Fetching All Users (Admin Only).
 *
 * Returns a list of all registered users. Passwords are never included.
 *
 * Endpoint: GET /backend/api/get_all_users.php
 *
 * @package RoyalNepal
 */

header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';
include_once '../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Admin-only endpoint.
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Admin role required."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
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
    $query = "SELECT user_id, first_name, last_name, email, phone, role, is_active, created_at, last_login
              FROM users
              ORDER BY created_at DESC";

    $stmt = $db->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "count"   => count($users),
        "data"    => $users
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error retrieving users: " . $e->getMessage()]);
}

$database->closeConnection();
?>
