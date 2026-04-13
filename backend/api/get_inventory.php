<?php
/**
 * API Endpoint for Fetching All Inventory Data (Admin Only).
 *
 * This script provides a comprehensive view of all inventory items, including
 * flights, buses, hotels, packages, and places. It is intended for use in
 * an admin dashboard to manage the site's content.
 *
 * Endpoint: GET /backend/api/get_inventory.php?type=<type>
 * where <type> can be 'flight', 'bus', 'hotel', 'package', 'place', or 'all'.
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

// Security check: Ensure the user is logged in and has an 'admin' role.
if(!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode([
        "success" => false,
        "message" => "Access denied. Admin role required."
    ]);
    exit();
}

// Only allow GET requests.
if($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Determine the type of inventory to fetch from the query parameter. Defaults to 'all'.
$type = isset($_GET['type']) ? strtolower(trim($_GET['type'])) : 'all';

// Establish a database connection.
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
    // Fetch supporting data (like airlines, operators, locations) needed for dropdowns in the admin UI.
    $support = [
        'airlines' => getAirlines($db),
        'operators' => getOperators($db),
        'locations' => getLocations($db)
    ];

    $items = [];
    $summary = [];

    // Fetch data for each inventory type based on the 'type' parameter.
    if ($type === 'all' || $type === 'flight') {
        $items['flights'] = getFlights($db);
        $summary['flights'] = count($items['flights']);
    }

    if ($type === 'all' || $type === 'bus') {
        $items['buses'] = getBuses($db);
        $summary['buses'] = count($items['buses']);
    }

    if ($type === 'all' || $type === 'hotel') {
        $items['hotels'] = getHotels($db);
        $summary['hotels'] = count($items['hotels']);
    }

    if ($type === 'all' || $type === 'package') {
        $items['packages'] = getPackages($db);
        $summary['packages'] = count($items['packages']);
    }

    if ($type === 'all' || $type === 'place') {
        $items['places'] = getPlaces($db);
        $summary['places'] = count($items['places']);
    }

    // If a specific type was requested but is not valid, throw an error.
    if ($type !== 'all' && !isset($items[pluralizeType($type)])) {
        throw new Exception('Invalid inventory type specified.');
    }

    // Return a success response with the fetched inventory data.
    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "type" => $type,
        "items" => $type === 'all' ? $items : $items[pluralizeType($type)],
        "summary" => $summary,
        "support" => $support
    ]);
} catch (Exception $e) {
    // If any error occurs, return a 500 server error.
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Error retrieving inventory: " . $e->getMessage()
    ]);
}

// Close the database connection.
$database->closeConnection();

/**
 * Helper function to pluralize an inventory type string.
 * e.g., 'flight' becomes 'flights'.
 * @param string $type The singular type name.
 * @return string The pluralized type name.
 */
function pluralizeType($type) {
    switch($type) {
        case 'flight': return 'flights';
        case 'bus': return 'buses';
        case 'hotel': return 'hotels';
        case 'package': return 'packages';
        case 'place': return 'places';
        default: return $type;
    }
}

/**
 * Fetches all flight records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of flight records.
 */
function getFlights($db) {
    $query = "SELECT df.flight_id, df.airline_id, df.flight_number, df.origin_location_id,
                     df.destination_location_id, df.departure_time, df.arrival_time, df.duration_minutes,
                     df.aircraft_type, df.total_seats, df.available_seats, df.base_price, df.currency,
                     df.operates_on_days, df.is_active, a.airline_name,
                     ol.location_name AS origin_name, dl.location_name AS destination_name
              FROM domestic_flights df
              LEFT JOIN airlines a ON df.airline_id = a.airline_id
              LEFT JOIN locations ol ON df.origin_location_id = ol.location_id
              LEFT JOIN locations dl ON df.destination_location_id = dl.location_id
              ORDER BY df.flight_id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all bus records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of bus records.
 */
function getBuses($db) {
    $query = "SELECT b.bus_id, b.operator_id, b.bus_number, b.origin_location_id,
                     b.destination_location_id, b.departure_time, b.arrival_time, b.duration_minutes,
                     b.bus_type, b.total_seats, b.available_seats, b.base_price, b.currency,
                     b.amenities, b.operates_on_days, b.is_active, bo.operator_name,
                     ol.location_name AS origin_name, dl.location_name AS destination_name
              FROM buses b
              LEFT JOIN bus_operators bo ON b.operator_id = bo.operator_id
              LEFT JOIN locations ol ON b.origin_location_id = ol.location_id
              LEFT JOIN locations dl ON b.destination_location_id = dl.location_id
              ORDER BY b.bus_id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all hotel records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of hotel records.
 */
function getHotels($db) {
    $query = "SELECT h.hotel_id, h.vendor_id, h.hotel_name, h.location_id, h.address, h.description,
                     h.star_rating, h.hotel_type, h.contact_number, h.email, h.image_url, h.is_active,
                     l.location_name, l.province
              FROM hotels h
              LEFT JOIN locations l ON h.location_id = l.location_id
              ORDER BY h.hotel_id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all tour package records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of package records.
 */
function getPackages($db) {
    $query = "SELECT * FROM tour_packages ORDER BY package_id DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all place records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of place records.
 */
function getPlaces($db) {
    $query = "SELECT p.place_id, p.place_name, p.location_id, p.category, p.description, p.history,
                     p.best_time_to_visit, p.entry_fee, p.currency, p.opening_hours, p.unesco_site,
                     p.altitude_meters, p.image_url, p.tips_and_guidelines, p.is_active,
                     l.location_name, l.province
              FROM places p
              LEFT JOIN locations l ON p.location_id = l.location_id
              ORDER BY p.place_id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all active airline records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of airline records.
 */
function getAirlines($db) {
    $query = "SELECT airline_id, airline_name, airline_code FROM airlines WHERE is_active = 1 ORDER BY airline_name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all active bus operator records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of operator records.
 */
function getOperators($db) {
    $query = "SELECT operator_id, operator_name FROM bus_operators WHERE is_active = 1 ORDER BY operator_name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Fetches all location records from the database.
 * @param PDO $db The database connection object.
 * @return array An array of location records.
 */
function getLocations($db) {
    $query = "SELECT location_id, location_name, location_type, province FROM locations ORDER BY location_name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>