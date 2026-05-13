<?php
/**
 * API Endpoint for Updating Booking Status (Admin Only).
 *
 * This script allows an admin to approve (confirm) or cancel a booking.
 * It updates the booking_status field in the bookings table.
 *
 * Endpoint: PUT /backend/api/update_booking_status.php
 *
 * @package RoyalNepal
 */
use RoyalNepal\config\Database;

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration and database files.
include_once '../config/config.php';

// Start a new session or resume the existing one.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Only allow PUT requests.
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Security check: Ensure the user is logged in and has an 'admin' role.
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Access denied. Admin role required."
    ]);
    exit();
}

// Get the raw JSON data from the request body.
$data = json_decode(file_get_contents("php://input"));

// Validate required fields.
if (empty($data->booking_id) || empty($data->booking_status)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Booking ID and status are required"
    ]);
    exit();
}

// Validate the new status value.
$allowedStatuses = ['confirmed', 'cancelled'];
$newStatus = strtolower(trim($data->booking_status));

if (!in_array($newStatus, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid status. Allowed values: confirmed, cancelled"
    ]);
    exit();
}

// Establish a database connection.
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

try {
    $bookingId = intval($data->booking_id);

    // Verify the booking exists and is currently pending.
    $checkStmt = $db->prepare("SELECT booking_id, booking_status FROM bookings WHERE booking_id = ?");
    $checkStmt->execute([$bookingId]);
    $booking = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Booking not found"
        ]);
        exit();
    }

    if ($booking['booking_status'] !== 'pending') {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Booking is already " . $booking['booking_status'] . " and cannot be changed"
        ]);
        exit();
    }

    // Update the booking status.
    $updateStmt = $db->prepare("UPDATE bookings SET booking_status = ? WHERE booking_id = ?");
    $updateStmt->execute([$newStatus, $bookingId]);

    // Send notification to the user
    try {
        include_once '../classes/Notification.php';
        $notification = new \RoyalNepal\classes\Notification($db);

        // Get the user_id and reference for the booking
        $userQuery = $db->prepare("SELECT user_id, booking_reference FROM bookings WHERE booking_id = ?");
        $userQuery->execute([$bookingId]);
        $bookingData = $userQuery->fetch(PDO::FETCH_ASSOC);

        if ($bookingData) {
            $title = $newStatus === 'confirmed' ? 'Booking Confirmed!' : 'Booking Cancelled';
            $message = $newStatus === 'confirmed' 
                ? "Good news! Your booking {$bookingData['booking_reference']} has been approved. Safe travels!"
                : "We regret to inform you that your booking {$bookingData['booking_reference']} has been cancelled.";
            
            $notification->create(
                $bookingData['user_id'],
                'booking_update',
                $title,
                $message,
                $bookingId
            );
        }
    } catch (Exception $ne) {
        error_log("Notification Error in update_booking_status: " . $ne->getMessage());
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Booking status updated to " . $newStatus,
        "data" => [
            "booking_id" => $bookingId,
            "booking_status" => $newStatus
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error updating booking: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
