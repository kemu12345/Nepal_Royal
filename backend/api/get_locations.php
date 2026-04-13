<?php
/**
 * API Endpoint for Fetching Location Information.
 *
 * This script retrieves a list of all locations (cities, airports, etc.)
 * from the database. It is primarily used by the frontend to populate
 * search dropdowns and suggestion lists.
 *
 * Endpoint: GET /backend/api/get_locations.php
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration and database files.
include_once '../config/config.php';
include_once '../config/database.php';
include_once '../classes/Location.php';

// Only allow GET requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
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

// Create a new Location object, passing the database connection.
$location = new Location($db);

try {
    // Call the getAll method of the Location class to fetch all locations.
    $locations = $location->getAll();

    // Return a success response with the list of locations.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($locations),
        "data" => $locations
    ]);

} catch (Exception $e) {
    // If any error occurs during the fetch, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error fetching locations: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
