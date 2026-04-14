<?php
/**
 * API Endpoint for Admin Dashboard Statistics.
 *
 * Returns aggregate counts: total users, total bookings,
 * active flights, active buses, active hotels, active packages.
 *
 * Endpoint: GET /backend/api/get_admin_stats.php
 *
 * @package RoyalNepal
 */

header("Content-Type: application/json; charset=UTF-8");

include_once '../config/config.php';
include_once '../config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Admin only
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
    $stats = [];

    $queries = [
        'total_users'    => "SELECT COUNT(*) FROM users",
        'total_bookings' => "SELECT COUNT(*) FROM bookings",
        'total_flights'  => "SELECT COUNT(*) FROM domestic_flights WHERE is_active = 1",
        'total_buses'    => "SELECT COUNT(*) FROM buses WHERE is_active = 1",
        'total_hotels'   => "SELECT COUNT(*) FROM hotels WHERE is_active = 1",
        'total_packages' => "SELECT COUNT(*) FROM tour_packages WHERE is_active = 1",
    ];

    foreach ($queries as $key => $sql) {
        $stmt = $db->query($sql);
        $stats[$key] = (int) $stmt->fetchColumn();
    }

    http_response_code(200);
    echo json_encode(["success" => true, "data" => $stats]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error retrieving stats: " . $e->getMessage()]);
}

$database->closeConnection();
?>
