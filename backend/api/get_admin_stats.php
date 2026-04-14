<?php
/**
 * API Endpoint for Fetching Admin Dashboard Statistics (Admin Only).
 *
 * Returns aggregate counts for users, bookings, flights, hotels, buses,
 * and packages, plus the 10 most recent bookings.
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
    $stats = [];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM users");
    $stats['total_users'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM bookings");
    $stats['total_bookings'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM domestic_flights WHERE is_active = 1");
    $stats['total_flights'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM hotels WHERE is_active = 1");
    $stats['total_hotels'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM buses WHERE is_active = 1");
    $stats['total_buses'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    $stmt = $db->query("SELECT COUNT(*) AS cnt FROM tour_packages WHERE is_active = 1");
    $stats['total_packages'] = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

    // Fetch the 10 most recent bookings with basic user info.
    $recentQuery = "SELECT b.booking_id, b.booking_reference, b.booking_type,
                           b.booking_status, b.total_amount, b.currency, b.booking_date,
                           u.first_name, u.last_name, u.email
                    FROM bookings b
                    INNER JOIN users u ON b.user_id = u.user_id
                    ORDER BY b.booking_date DESC
                    LIMIT 10";
    $stmt = $db->query($recentQuery);
    $recent_bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success"         => true,
        "stats"           => $stats,
        "recent_bookings" => $recent_bookings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error retrieving stats: " . $e->getMessage()]);
}

$database->closeConnection();
?>
