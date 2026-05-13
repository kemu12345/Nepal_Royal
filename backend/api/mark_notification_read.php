<?php
/**
 * API Endpoint for Marking a Notification as Read.
 * Endpoint: POST /backend/api/mark_notification_read.php
 */
use RoyalNepal\classes\Notification;
use RoyalNepal\config\Database;

header("Content-Type: application/json; charset=UTF-8");
include_once '../config/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Please login"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (empty($data->notification_id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "notification_id is required"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

include_once '../classes/Notification.php';
$notif = new Notification($db);

try {
    $success = $notif->markAsRead(intval($data->notification_id));
    echo json_encode(["success" => $success]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$database->closeConnection();
