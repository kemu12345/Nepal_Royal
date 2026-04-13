<?php
/**
 * API Endpoint for Fetching a User's Bookings.
 *
 * This script retrieves all bookings associated with the currently logged-in user.
 * It first fetches the main booking records and then retrieves the specific details
 * for each booking (e.g., flight details, hotel details) by joining with the
 * relevant tables.
 *
 * Endpoint: GET /backend/api/get_user_bookings.php
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration and database files.
include_once '../config/config.php';
include_once '../config/database.php';

// Start a new session or resume the existing one.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Only allow GET requests.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Check if the user is logged in by verifying session variables.
if(!isset($_SESSION['user_id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode([
        "success" => false,
        "message" => "Please login to view bookings"
    ]);
    exit();
}

// Create a new Database object and establish a connection.
$database = new Database();
$db = $database->getConnection();

// If the database connection fails, return a 500 server error.
if($db === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

try {
    // Get the user ID from the session.
    $user_id = $_SESSION['user_id'];

    // Check for an optional status filter in the query string.
    $status = isset($_GET['status']) ? htmlspecialchars(strip_tags($_GET['status'])) : null;

    // Base query to get all bookings for the current user.
    $query = "SELECT * FROM bookings WHERE user_id = ?";

    // If a status filter is provided, add it to the query.
    if($status) {
        $query .= " AND booking_status = ?";
    }

    $query .= " ORDER BY booking_date DESC";

    $stmt = $db->prepare($query);

    // Execute the query with the appropriate parameters.
    if($status) {
        $stmt->execute([$user_id, $status]);
    } else {
        $stmt->execute([$user_id]);
    }

    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Loop through each booking to fetch its specific details.
    foreach($bookings as &$booking) {
        $booking_id = $booking['booking_id'];
        $booking_type = $booking['booking_type'];

        // Build a specific query based on the booking type.
        switch($booking_type) {
            case 'flight':
                $query = "SELECT fb.*, df.flight_number, df.departure_time, df.arrival_time,
                                 a.airline_name,
                                 ol.location_name as origin, dl.location_name as destination
                          FROM flight_bookings fb
                          INNER JOIN domestic_flights df ON fb.flight_id = df.flight_id
                          INNER JOIN airlines a ON df.airline_id = a.airline_id
                          INNER JOIN locations ol ON df.origin_location_id = ol.location_id
                          INNER JOIN locations dl ON df.destination_location_id = dl.location_id
                          WHERE fb.booking_id = ?";
                break;

            case 'bus':
                $query = "SELECT bb.*, b.bus_number, b.departure_time, b.arrival_time, b.bus_type,
                                 bo.operator_name,
                                 ol.location_name as origin, dl.location_name as destination
                          FROM bus_bookings bb
                          INNER JOIN buses b ON bb.bus_id = b.bus_id
                          INNER JOIN bus_operators bo ON b.operator_id = bo.operator_id
                          INNER JOIN locations ol ON b.origin_location_id = ol.location_id
                          INNER JOIN locations dl ON b.destination_location_id = dl.location_id
                          WHERE bb.booking_id = ?";
                break;

            case 'hotel':
                $query = "SELECT hb.*, hr.room_type, h.hotel_name,
                                 l.location_name as city
                          FROM hotel_bookings hb
                          INNER JOIN hotel_rooms hr ON hb.room_id = hr.room_id
                          INNER JOIN hotels h ON hr.hotel_id = h.hotel_id
                          INNER JOIN locations l ON h.location_id = l.location_id
                          WHERE hb.booking_id = ?";
                break;

            case 'package':
                $query = "SELECT pb.*, tp.package_name, tp.duration_days, tp.package_type
                          FROM package_bookings pb
                          INNER JOIN tour_packages tp ON pb.package_id = tp.package_id
                          WHERE pb.booking_id = ?";
                break;

            default:
                continue 2; // Skip to the next iteration of the outer loop.
        }

        // Execute the details query and fetch the results.
        $stmt = $db->prepare($query);
        $stmt->execute([$booking_id]);
        $details = $stmt->fetch(PDO::FETCH_ASSOC);

        // Add the details to the booking array.
        if($details) {
            $booking['details'] = $details;
        }
    }

    // Return a success response with the user's bookings.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($bookings),
        "data" => $bookings
    ]);

} catch (Exception $e) {
    // If any error occurs, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error retrieving bookings: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
