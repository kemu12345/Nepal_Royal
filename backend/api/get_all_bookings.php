<?php
/**
 * API Endpoint for Listing All Bookings (Admin Only).
 *
 * Returns all bookings with customer name, booking type, amount, and status.
 *
 * Endpoint: GET /backend/api/get_all_bookings.php
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
    $stmt = $db->query(
        "SELECT b.booking_id, b.booking_reference, b.booking_type, b.booking_status,
                b.total_amount, b.currency, b.payment_status, b.booking_date,
                u.first_name, u.last_name, u.email
         FROM bookings b
         INNER JOIN users u ON b.user_id = u.user_id
         ORDER BY b.booking_date DESC"
    );
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
