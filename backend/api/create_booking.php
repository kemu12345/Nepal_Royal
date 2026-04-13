<?php
/**
 * API Endpoint for Creating a New Booking.
 *
 * This script handles the creation of new bookings for flights, buses, hotels, and packages.
 * It validates user authentication, processes the booking data, calculates the total amount,
 * and inserts the booking details into the database within a transaction.
 *
 * Endpoint: POST /backend/api/create_booking.php
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

// Only allow POST requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Check if the user is logged in by verifying session variables.
if(!isset($_SESSION['user_id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode([
        "success" => false,
        "message" => "Please login to create a booking"
    ]);
    exit();
}

// Get the raw JSON data from the POST request body.
$data = json_decode(file_get_contents("php://input"));

// Validate that the required fields (booking_type and item_id) are present.
if(empty($data->booking_type) || empty($data->item_id)) {
    http_response_code(400); // Bad Request
    echo json_encode([
        "success" => false,
        "message" => "Booking type and item ID are required"
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
    // Begin a database transaction to ensure all queries are executed successfully.
    $db->beginTransaction();

    // Generate a unique booking reference number.
    $booking_reference = 'RN' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));

    // Get user ID from the session and sanitize input data.
    $user_id = $_SESSION['user_id'];
    $booking_type = htmlspecialchars(strip_tags($data->booking_type));
    $item_id = intval($data->item_id);

    // Initialize variables for calculating the total amount.
    $total_amount = 0;
    $currency = 'NPR';

    // Determine the total amount based on the booking type (flight, bus, hotel, package).
    switch($booking_type) {
        case 'flight':
            $stmt = $db->prepare("SELECT base_price, currency FROM domestic_flights WHERE flight_id = ?");
            $stmt->execute([$item_id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            if($item) {
                $total_amount = $item['base_price'] * (isset($data->passengers) ? intval($data->passengers) : 1);
                $currency = $item['currency'];
            }
            break;

        case 'bus':
            $stmt = $db->prepare("SELECT base_price, currency FROM buses WHERE bus_id = ?");
            $stmt->execute([$item_id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            if($item) {
                $total_amount = $item['base_price'] * (isset($data->passengers) ? intval($data->passengers) : 1);
                $currency = $item['currency'];
            }
            break;

        case 'hotel':
            $stmt = $db->prepare("SELECT base_price_per_night, currency FROM hotel_rooms WHERE room_id = ?");
            $stmt->execute([$item_id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            if($item) {
                $nights = isset($data->nights) ? intval($data->nights) : 1;
                $rooms = isset($data->rooms) ? intval($data->rooms) : 1;
                $total_amount = $item['base_price_per_night'] * $nights * $rooms;
                $currency = $item['currency'];
            }
            break;

        case 'package':
            $stmt = $db->prepare("SELECT base_price, currency FROM tour_packages WHERE package_id = ?");
            $stmt->execute([$item_id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            if($item) {
                $total_amount = $item['base_price'] * (isset($data->travelers) ? intval($data->travelers) : 1);
                $currency = $item['currency'];
            }
            break;

        default:
            throw new Exception("Invalid booking type");
    }

    // If the item was not found or price is zero, throw an error.
    if($total_amount == 0) {
        throw new Exception("Invalid item or item not found");
    }

    // Insert the main booking record into the 'bookings' table.
    $query = "INSERT INTO bookings
              (user_id, booking_reference, booking_type, booking_status, total_amount, currency, payment_status)
              VALUES (?, ?, ?, 'pending', ?, ?, 'unpaid')";

    $stmt = $db->prepare($query);
    $stmt->execute([$user_id, $booking_reference, $booking_type, $total_amount, $currency]);

    // Get the ID of the newly created booking.
    $booking_id = $db->lastInsertId();

    // Insert booking details into the corresponding type-specific table (e.g., 'flight_bookings').
    switch($booking_type) {
        case 'flight':
            $query = "INSERT INTO flight_bookings
                      (booking_id, flight_id, travel_date, number_of_passengers, passenger_details)
                      VALUES (?, ?, ?, ?, ?)";
            $passengers = isset($data->passengers) ? intval($data->passengers) : 1;
            $passenger_details = isset($data->passenger_details) ? json_encode($data->passenger_details) : json_encode([]);
            $stmt = $db->prepare($query);
            $stmt->execute([$booking_id, $item_id, $data->travel_date, $passengers, $passenger_details]);

            // Decrement the number of available seats for the flight.
            $updateSeats = $db->prepare("UPDATE domestic_flights SET available_seats = available_seats - ? WHERE flight_id = ?");
            $updateSeats->execute([$passengers, $item_id]);
            break;

        case 'bus':
            $query = "INSERT INTO bus_bookings
                      (booking_id, bus_id, travel_date, number_of_passengers, passenger_details)
                      VALUES (?, ?, ?, ?, ?)";
            $passengers = isset($data->passengers) ? intval($data->passengers) : 1;
            $passenger_details = isset($data->passenger_details) ? json_encode($data->passenger_details) : json_encode([]);
            $stmt = $db->prepare($query);
            $stmt->execute([$booking_id, $item_id, $data->travel_date, $passengers, $passenger_details]);

            // Decrement the number of available seats for the bus.
            $updateSeats = $db->prepare("UPDATE buses SET available_seats = available_seats - ? WHERE bus_id = ?");
            $updateSeats->execute([$passengers, $item_id]);
            break;

        case 'hotel':
            $query = "INSERT INTO hotel_bookings
                      (booking_id, room_id, check_in_date, check_out_date, number_of_nights, number_of_rooms, number_of_guests, guest_details)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $nights = isset($data->nights) ? intval($data->nights) : 1;
            $rooms = isset($data->rooms) ? intval($data->rooms) : 1;
            $guests = isset($data->guests) ? intval($data->guests) : 1;
            $guest_details = isset($data->guest_details) ? json_encode($data->guest_details) : json_encode([]);
            $stmt = $db->prepare($query);
            $stmt->execute([$booking_id, $item_id, $data->check_in, $data->check_out, $nights, $rooms, $guests, $guest_details]);

            // Decrement the number of available rooms.
            $updateRooms = $db->prepare("UPDATE hotel_rooms SET available_rooms = available_rooms - ? WHERE room_id = ?");
            $updateRooms->execute([$rooms, $item_id]);
            break;

        case 'package':
            $query = "INSERT INTO package_bookings
                      (booking_id, package_id, start_date, end_date, number_of_travelers, traveler_details)
                      VALUES (?, ?, ?, ?, ?, ?)";
            $travelers = isset($data->travelers) ? intval($data->travelers) : 1;
            $traveler_details = isset($data->traveler_details) ? json_encode($data->traveler_details) : json_encode([]);
            $stmt = $db->prepare($query);
            $stmt->execute([$booking_id, $item_id, $data->start_date, $data->end_date, $travelers, $traveler_details]);
            break;
    }

    // If all queries were successful, commit the transaction.
    $db->commit();

    // Return a success response with the new booking details.
    http_response_code(201); // Created
    echo json_encode([
        "success" => true,
        "message" => "Booking created successfully",
        "data" => [
            "booking_id" => $booking_id,
            "booking_reference" => $booking_reference,
            "total_amount" => $total_amount,
            "currency" => $currency,
            "status" => "pending"
        ]
    ]);

} catch (Exception $e) {
    // If any error occurred, roll back the transaction.
    if($db->inTransaction()) {
        $db->rollBack();
    }

    // Return a 500 server error with the error message.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error creating booking: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
