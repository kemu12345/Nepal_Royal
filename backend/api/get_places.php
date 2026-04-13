<?php
/**
 * API Endpoint for Fetching Information about Places of Interest.
 *
 * This script retrieves a list of places (e.g., temples, mountains, parks)
 * from the database. It supports optional filters for category, location,
 * and whether the place is a UNESCO World Heritage site.
 *
 * Endpoint: GET /backend/api/get_places.php
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration, database, and class files.
include_once '../config/config.php';
include_once '../config/database.php';
include_once '../classes/Place.php';

// Only allow GET requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get and sanitize optional filter parameters from the URL.
$filters = [];
if (isset($_GET['category'])) {
    $filters['category'] = htmlspecialchars(strip_tags($_GET['category']));
}
if (isset($_GET['location_id'])) {
    $filters['location_id'] = intval($_GET['location_id']);
}
if (isset($_GET['unesco'])) {
    $filters['unesco'] = $_GET['unesco'] === 'true';
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

// Create a new Place object, passing the database connection.
$place = new Place($db);

try {
    // Call the getAll method of the Place class to find matching places.
    $places = $place->getAll($filters);

    // Return a success response with the list of places.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($places),
        "data" => $places
    ]);

} catch (Exception $e) {
    // If any error occurs during the fetch, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error retrieving places: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
