<?php
/**
 * API Endpoint for Fetching Tour Package Information.
 *
 * This script retrieves a list of available tour packages from the database.
 * It supports various optional filters such as package type, difficulty,
 * maximum price, maximum duration, and featured status.
 *
 * Endpoint: GET /backend/api/get_packages.php
 *
 * @package RoyalNepal
 * @author  Your Name
 */

// Set the content type of the response to JSON.
header("Content-Type: application/json; charset=UTF-8");

// Include necessary configuration, database, and class files.
include_once '../config/config.php';
include_once '../config/database.php';
include_once '../classes/Package.php';

// Only allow GET requests. If any other method is used, return a 405 error.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get and sanitize optional filter parameters from the URL.
$filters = [];
if (isset($_GET['type'])) {
    $filters['package_type'] = htmlspecialchars(strip_tags($_GET['type']));
}
if (isset($_GET['difficulty'])) {
    $filters['difficulty'] = htmlspecialchars(strip_tags($_GET['difficulty']));
}
if (isset($_GET['max_price'])) {
    $filters['max_price'] = floatval($_GET['max_price']);
}
if (isset($_GET['max_duration'])) {
    $filters['max_duration'] = intval($_GET['max_duration']);
}
if (isset($_GET['featured'])) {
    $filters['featured'] = $_GET['featured'] === 'true';
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

// Create a new Package object, passing the database connection.
$package = new Package($db);

try {
    // Call the getAll method of the Package class to find matching packages.
    $packages = $package->getAll($filters);

    // Return a success response with the list of packages.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "count" => count($packages),
        "data" => $packages
    ]);

} catch (Exception $e) {
    // If any error occurs during the fetch, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error retrieving packages: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();
?>
