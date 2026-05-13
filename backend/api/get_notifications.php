<?php
/**
 * API Endpoint for Fetching User Notifications.
 * Endpoint: GET /backend/api/get_notifications.php
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

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

include_once '../classes/Notification.php';
$notif = new Notification($db);

try {
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
    $notifications = $notif->getForUser($_SESSION['user_id'], $unreadOnly);

    echo json_encode([
        "success" => true,
        "count" => count($notifications),
        "data" => $notifications
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$database->closeConnection();
