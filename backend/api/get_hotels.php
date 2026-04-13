<?php
/**
 * API Endpoint for Fetching Hotel Information.
 *
 * This script retrieves a list of available hotels based on search criteria
 * such as location, check-in date, and check-out date. It can also handle
 * optional filters like minimum star rating, hotel type, and maximum price.
 *
 * Endpoint: GET /backend/api/get_hotels.php?city=<id>&checkin=<yyyy-mm-dd>&checkout=<yyyy-mm-dd>
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration, database, and class files.
include_once '../config/config.php';
include_once '../config/database.php';
include_once '../classes/Hotel.php';

// Only allow GET requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get and sanitize the required query parameters from the URL.
$location_id = isset($_GET['city']) ? intval($_GET['city']) : null;
$check_in = isset($_GET['checkin']) ? $_GET['checkin'] : null;
$check_out = isset($_GET['checkout']) ? $_GET['checkout'] : null;

// Get and sanitize optional filter parameters.
$filters = [];
if (isset($_GET['min_rating'])) {
    $filters['min_rating'] = floatval($_GET['min_rating']);
}
if (isset($_GET['hotel_type'])) {
    $filters['hotel_type'] = htmlspecialchars(strip_tags($_GET['hotel_type']));
}
if (isset($_GET['max_price'])) {
    $filters['max_price'] = floatval($_GET['max_price']);
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

// Create a new Hotel object, passing the database connection.
$hotel = new Hotel($db);

try {
    // Call the search method of the Hotel class to find matching hotels.
    $hotels = $hotel->search($location_id, $check_in, $check_out, $filters);

    // Return a success response with the list of hotels.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($hotels),
        "data" => $hotels
    ]);

} catch (Exception $e) {
    // If any error occurs during the search, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error searching hotels: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
