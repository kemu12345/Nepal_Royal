<?php
/**
 * API Endpoint for Fetching Bus Information.
 *
 * This script retrieves a list of available buses based on search criteria
 * such as origin, destination, and travel date. It can also handle
 * optional filters like maximum price and bus type.
 *
 * Endpoint: GET /backend/api/get_buses.php?from=<id>&to=<id>&date=<yyyy-mm-dd>
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration, database, and class files.
include_once '../config/config.php';
include_once '../config/database.php';
include_once '../classes/Bus.php';

// Only allow GET requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get and sanitize the required query parameters from the URL.
$origin_id = isset($_GET['from']) ? intval($_GET['from']) : null;
$destination_id = isset($_GET['to']) ? intval($_GET['to']) : null;
$travel_date = isset($_GET['date']) ? $_GET['date'] : null;

// Get and sanitize optional filter parameters.
$filters = [];
if (isset($_GET['max_price'])) {
    $filters['max_price'] = floatval($_GET['max_price']);
}
if (isset($_GET['bus_type'])) {
    $filters['bus_type'] = htmlspecialchars(strip_tags($_GET['bus_type']));
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

// Create a new Bus object, passing the database connection.
$bus = new Bus($db);

try {
    // Call the search method of the Bus class to find matching buses.
    $buses = $bus->search($origin_id, $destination_id, $travel_date, $filters);

    // Get a list of all bus operators, which can be used for filtering on the frontend.
    $operators = $bus->getOperators();

    // Return a success response with the list of buses and operators.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($buses),
        "data" => $buses,
        "operators" => $operators
    ]);

} catch (Exception $e) {
    // If any error occurs during the search, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error searching buses: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
