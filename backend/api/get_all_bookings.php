<?php
/**
 * API Endpoint for Fetching All Bookings (Admin Only).
 *
 * Returns all bookings in the system, joined with the relevant user's name
 * and e-mail address, ordered by most-recent first.
 *
 * Endpoint: GET /backend/api/get_all_bookings.php
 *
 * Optional query parameters:
 *   status  – filter by booking_status (pending|confirmed|cancelled|completed)
 *   type    – filter by booking_type   (flight|bus|hotel|package)
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
    $params  = [];
    $where   = [];

    // Optional status filter.
    $allowed_statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!empty($_GET['status']) && in_array($_GET['status'], $allowed_statuses, true)) {
        $where[]  = "b.booking_status = ?";
        $params[] = $_GET['status'];
    }

    // Optional type filter.
    $allowed_types = ['flight', 'bus', 'hotel', 'package'];
    if (!empty($_GET['type']) && in_array($_GET['type'], $allowed_types, true)) {
        $where[]  = "b.booking_type = ?";
        $params[] = $_GET['type'];
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $query = "SELECT b.booking_id, b.booking_reference, b.booking_type,
                     b.booking_status, b.total_amount, b.currency,
                     b.payment_status, b.booking_date,
                     u.user_id, u.first_name, u.last_name, u.email
              FROM bookings b
              INNER JOIN users u ON b.user_id = u.user_id
              {$whereClause}
              ORDER BY b.booking_date DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "count"   => count($bookings),
        "data"    => $bookings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error retrieving bookings: " . $e->getMessage()]);
}

$database->closeConnection();
?>
