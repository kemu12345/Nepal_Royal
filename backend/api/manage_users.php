<?php
/**
 * API Endpoint for Admin User Management.
 *
 * PUT  — toggle a user's active status or change their role
 * DELETE — permanently delete a user (cannot delete yourself)
 *
 * Endpoint: /backend/api/manage_users.php
 *
 * @package RoyalNepal
 */
use RoyalNepal\config\Database;

header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied. Admin role required."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['PUT', 'DELETE'], true)) {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "user_id is required"]);
    exit();
}

$targetId   = (int) $data->user_id;
$currentId  = (int) $_SESSION['user_id'];

if ($targetId === $currentId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "You cannot modify your own account here."]);
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
    $check = $db->prepare("SELECT user_id, role, is_active FROM users WHERE user_id = ?");
    $check->execute([$targetId]);
    $user = $check->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    if ($method === 'PUT') {
        if (isset($data->is_active)) {
            $newStatus = $data->is_active ? 1 : 0;
            $stmt = $db->prepare("UPDATE users SET is_active = ? WHERE user_id = ?");
            $stmt->execute([$newStatus, $targetId]);
            $label = $newStatus ? 'activated' : 'deactivated';
            echo json_encode(["success" => true, "message" => "User $label successfully"]);
        } elseif (isset($data->role)) {
            $allowed = ['user', 'vendor', 'admin'];
            $newRole = strtolower(trim($data->role));
            if (!in_array($newRole, $allowed, true)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid role"]);
                exit();
            }
            $stmt = $db->prepare("UPDATE users SET role = ? WHERE user_id = ?");
            $stmt->execute([$newRole, $targetId]);
            echo json_encode(["success" => true, "message" => "User role updated to $newRole"]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Provide is_active or role to update"]);
        }
    } elseif ($method === 'DELETE') {
        $db->beginTransaction();
        try {
            // Associated bookings have ON DELETE RESTRICT in schema.sql
            // Child tables of bookings (flight_bookings, etc) have ON DELETE CASCADE
            $stmtBookings = $db->prepare("DELETE FROM bookings WHERE user_id = ?");
            $stmtBookings->execute([$targetId]);

            $stmt = $db->prepare("DELETE FROM users WHERE user_id = ?");
            $stmt->execute([$targetId]);
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "User and their bookings deleted successfully"]);
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$database->closeConnection();
