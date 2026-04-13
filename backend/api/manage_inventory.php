<?php
/**
 * Royal Nepal - Admin Inventory Management API
 * Endpoint: POST/PUT/DELETE /backend/api/manage_inventory.php
 * Handles CRUD operations for Flights, Hotels, Buses, and Packages
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
// If not, send a 403 Forbidden response and terminate the script.
if(!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode([
        "success" => false,
        "message" => "Access denied. Admin role required."
    ]);
    exit();
}

// Establish a connection to the database.
$database = new Database();
$db = $database->getConnection();

// If the database connection fails, send a 500 Internal Server Error response.
if($db === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

// Get the HTTP method (POST, PUT, DELETE) used for the request.
$method = $_SERVER['REQUEST_METHOD'];
// Get the raw JSON data from the request body and decode it into a PHP object.
$data = json_decode(file_get_contents("php://input"));

// Use a try-catch block to handle any potential errors during the process.
try {
    // Route the request to the appropriate handler based on the HTTP method.
    switch($method) {
        case 'POST':
            // Handle the creation of a new inventory item.
            handleCreate($db, $data);
            break;

        case 'PUT':
            // Handle the update of an existing inventory item.
            handleUpdate($db, $data);
            break;

        case 'DELETE':
            // Handle the deletion of an inventory item.
            handleDelete($db, $data);
            break;

        default:
            // If the method is not supported, send a 405 Method Not Allowed response.
            http_response_code(405); // Method Not Allowed
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            break;
    }
} catch (Exception $e) {
    // If any exception occurs, send a 500 Internal Server Error response with the error message.
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

// Close the database connection after the operation is complete.
$database->closeConnection();

/**
 * Handles the creation of new inventory items (Flights, Buses, Hotels, etc.).
 *
 * @param PDO $db The database connection object.
 * @param object $data The decoded JSON data from the request.
 * @throws Exception If the item type is missing or invalid.
 */
function handleCreate($db, $data) {
    // Check if the item type is provided in the request data.
    if(empty($data->item_type)) {
        throw new Exception("Item type is required");
    }

    $item_type = $data->item_type;

    // Use a switch statement to handle different types of inventory items.
    switch($item_type) {
        case 'flight':
            // Define required fields for creating a flight.
            requireFields($data, ['airline_id', 'flight_number', 'origin_location_id', 'destination_location_id', 'departure_time', 'arrival_time', 'duration_minutes', 'total_seats', 'base_price', 'operates_on_days']);

            // SQL query to insert a new flight into the database.
            $query = "INSERT INTO domestic_flights
                      (airline_id, flight_number, origin_location_id, destination_location_id,
                       departure_time, arrival_time, duration_minutes, aircraft_type,
                       total_seats, available_seats, base_price, currency, operates_on_days, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the SQL statement with data from the request.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->airline_id,
                $data->flight_number,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $data->duration_minutes,
                $data->aircraft_type ?? null, // Use null if not provided.
                $data->total_seats,
                $data->available_seats ?? $data->total_seats, // Default to total seats.
                $data->base_price,
                $data->currency ?? 'NPR', // Default currency to NPR.
                $data->operates_on_days,
                $data->is_active ?? 1 // Default to active.
            ]);
            break;

        case 'bus':
            // Define required fields for creating a bus.
            requireFields($data, ['operator_id', 'bus_number', 'origin_location_id', 'destination_location_id', 'departure_time', 'arrival_time', 'duration_minutes', 'total_seats', 'base_price', 'operates_on_days']);

            // SQL query to insert a new bus.
            $query = "INSERT INTO buses
                      (operator_id, bus_number, origin_location_id, destination_location_id,
                       departure_time, arrival_time, duration_minutes, bus_type,
                       total_seats, available_seats, base_price, currency, amenities, operates_on_days, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->operator_id,
                $data->bus_number,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $data->duration_minutes,
                $data->bus_type ?? 'regular',
                $data->total_seats,
                $data->available_seats ?? $data->total_seats,
                $data->base_price,
                $data->currency ?? 'NPR',
                $data->amenities ?? null,
                $data->operates_on_days,
                $data->is_active ?? 1
            ]);
            break;

        case 'hotel':
            // Define required fields for creating a hotel.
            requireFields($data, ['hotel_name', 'location_id', 'address']);

            // SQL query to insert a new hotel.
            $query = "INSERT INTO hotels
                      (vendor_id, hotel_name, location_id, address, description, star_rating, hotel_type,
                       contact_number, email, image_url, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->vendor_id ?? null,
                $data->hotel_name,
                $data->location_id,
                $data->address,
                $data->description ?? '',
                $data->star_rating ?? 3.0,
                $data->hotel_type ?? 'hotel',
                $data->contact_number ?? '',
                $data->email ?? null,
                $data->image_url ?? null,
                $data->is_active ?? 1
            ]);
            break;

        case 'package':
            // Define required fields for creating a tour package.
            requireFields($data, ['package_name', 'package_type', 'description', 'duration_days', 'duration_nights', 'base_price']);

            // SQL query to insert a new tour package.
            $query = "INSERT INTO tour_packages
                      (package_name, package_type, description, detailed_itinerary, duration_days, duration_nights,
                       difficulty_level, group_size_min, group_size_max, base_price, currency, inclusions,
                       exclusions, best_season, image_url, is_active, is_featured)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->package_name,
                $data->package_type,
                $data->description,
                $data->detailed_itinerary ?? null,
                $data->duration_days,
                $data->duration_nights,
                $data->difficulty_level ?? 'moderate',
                $data->group_size_min ?? 1,
                $data->group_size_max ?? 15,
                $data->base_price,
                $data->currency ?? 'NPR',
                $data->inclusions ?? null,
                $data->exclusions ?? null,
                $data->best_season ?? null,
                $data->image_url ?? null,
                $data->is_active ?? 1,
                $data->is_featured ?? 0
            ]);
            break;

        case 'place':
            // Define required fields for creating a place of interest.
            requireFields($data, ['place_name', 'location_id', 'category', 'description']);

            // SQL query to insert a new place.
            $query = "INSERT INTO places
                      (place_name, location_id, category, description, history, best_time_to_visit,
                       entry_fee, currency, opening_hours, unesco_site, altitude_meters, image_url,
                       tips_and_guidelines, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->place_name,
                $data->location_id,
                $data->category,
                $data->description,
                $data->history ?? null,
                $data->best_time_to_visit ?? null,
                $data->entry_fee ?? 0,
                $data->currency ?? 'NPR',
                $data->opening_hours ?? null,
                $data->unesco_site ?? 0,
                $data->altitude_meters ?? null,
                $data->image_url ?? null,
                $data->tips_and_guidelines ?? null,
                $data->is_active ?? 1
            ]);
            break;

        default:
            // If the item type is not recognized, throw an error.
            throw new Exception("Invalid item type");
    }

    // Send a 201 Created response with a success message and the ID of the new item.
    http_response_code(201); // Created
    echo json_encode([
        "success" => true,
        "message" => ucfirst($item_type) . " created successfully",
        "item_id" => $db->lastInsertId() // Get the ID of the last inserted row.
    ]);
}

/**
 * Handles the update of existing inventory items.
 *
 * @param PDO $db The database connection object.
 * @param object $data The decoded JSON data from the request.
 * @throws Exception If item type or ID are missing or invalid.
 */
function handleUpdate($db, $data) {
    // Ensure both item type and ID are provided.
    if(empty($data->item_type) || empty($data->item_id)) {
        throw new Exception("Item type and item ID are required");
    }

    $item_type = $data->item_type;
    $item_id = $data->item_id;

    // Use a switch statement to handle updates for different item types.
    switch($item_type) {
        case 'flight':
            // SQL query to update an existing flight record.
            $query = "UPDATE domestic_flights SET
                      airline_id = ?, flight_number = ?, origin_location_id = ?, destination_location_id = ?,
                      departure_time = ?, arrival_time = ?, duration_minutes = ?, aircraft_type = ?,
                      total_seats = ?, available_seats = ?, base_price = ?, currency = ?, operates_on_days = ?,
                      is_active = ?
                      WHERE flight_id = ?";

            // Prepare and execute the update statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->airline_id,
                $data->flight_number,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $data->duration_minutes,
                $data->aircraft_type ?? null,
                $data->total_seats,
                $data->available_seats ?? $data->total_seats,
                $data->base_price,
                $data->currency ?? 'NPR',
                $data->operates_on_days,
                $data->is_active ?? 1,
                $item_id // The ID of the flight to update.
            ]);
            break;

        case 'bus':
            // SQL query to update an existing bus record.
            $query = "UPDATE buses SET
                      operator_id = ?, bus_number = ?, origin_location_id = ?, destination_location_id = ?,
                      departure_time = ?, arrival_time = ?, duration_minutes = ?, bus_type = ?,
                      total_seats = ?, available_seats = ?, base_price = ?, currency = ?, amenities = ?,
                      operates_on_days = ?, is_active = ?
                      WHERE bus_id = ?";

            // Prepare and execute the update statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->operator_id,
                $data->bus_number,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $data->duration_minutes,
                $data->bus_type ?? 'regular',
                $data->total_seats,
                $data->available_seats ?? $data->total_seats,
                $data->base_price,
                $data->currency ?? 'NPR',
                $data->amenities ?? null,
                $data->operates_on_days,
                $data->is_active ?? 1,
                $item_id // The ID of the bus to update.
            ]);
            break;

        case 'hotel':
            // SQL query to update an existing hotel record.
            $query = "UPDATE hotels SET
                      vendor_id = ?, hotel_name = ?, location_id = ?, address = ?, description = ?,
                      star_rating = ?, hotel_type = ?, contact_number = ?, email = ?, image_url = ?,
                      is_active = ?
                      WHERE hotel_id = ?";

            // Prepare and execute the update statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->vendor_id ?? null,
                $data->hotel_name,
                $data->location_id,
                $data->address,
                $data->description ?? '',
                $data->star_rating ?? 3.0,
                $data->hotel_type ?? 'hotel',
                $data->contact_number ?? '',
                $data->email ?? null,
                $data->image_url ?? null,
                $data->is_active ?? 1,
                $item_id // The ID of the hotel to update.
            ]);
            break;

        case 'package':
            // SQL query to update an existing tour package record.
            $query = "UPDATE tour_packages SET
                      package_name = ?, package_type = ?, description = ?, detailed_itinerary = ?,
                      duration_days = ?, duration_nights = ?, difficulty_level = ?, group_size_min = ?,
                      group_size_max = ?, base_price = ?, currency = ?, inclusions = ?, exclusions = ?,
                      best_season = ?, image_url = ?, is_active = ?, is_featured = ?
                      WHERE package_id = ?";

            // Prepare and execute the update statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->package_name,
                $data->package_type,
                $data->description,
                $data->detailed_itinerary ?? null,
                $data->duration_days,
                $data->duration_nights,
                $data->difficulty_level ?? 'moderate',
                $data->group_size_min ?? 1,
                $data->group_size_max ?? 15,
                $data->base_price,
                $data->currency ?? 'NPR',
                $data->inclusions ?? null,
                $data->exclusions ?? null,
                $data->best_season ?? null,
                $data->image_url ?? null,
                $data->is_active ?? 1,
                $data->is_featured ?? 0,
                $item_id // The ID of the package to update.
            ]);
            break;

        case 'place':
            // SQL query to update an existing place record.
            $query = "UPDATE places SET
                      place_name = ?, location_id = ?, category = ?, description = ?, history = ?,
                      best_time_to_visit = ?, entry_fee = ?, currency = ?, opening_hours = ?,
                      unesco_site = ?, altitude_meters = ?, image_url = ?, tips_and_guidelines = ?,
                      is_active = ?
                      WHERE place_id = ?";

            // Prepare and execute the update statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                $data->place_name,
                $data->location_id,
                $data->category,
                $data->description,
                $data->history ?? null,
                $data->best_time_to_visit ?? null,
                $data->entry_fee ?? 0,
                $data->currency ?? 'NPR',
                $data->opening_hours ?? null,
                $data->unesco_site ?? 0,
                $data->altitude_meters ?? null,
                $data->image_url ?? null,
                $data->tips_and_guidelines ?? null,
                $data->is_active ?? 1,
                $item_id // The ID of the place to update.
            ]);
            break;

        default:
            // If the item type is not recognized, throw an error.
            throw new Exception("Invalid item type");
    }

    // Send a 200 OK response with a success message.
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => ucfirst($item_type) . " updated successfully"
    ]);
}

/**
 * Handles the "soft deletion" of inventory items by marking them as inactive.
 *
 * @param PDO $db The database connection object.
 * @param object $data The decoded JSON data from the request.
 * @throws Exception If item type or ID are missing or invalid.
 */
function handleDelete($db, $data) {
    // Ensure both item type and ID are provided.
    if(empty($data->item_type) || empty($data->item_id)) {
        throw new Exception("Item type and item ID are required");
    }

    $item_type = $data->item_type;
    $item_id = $data->item_id;

    // This is a "soft delete" which marks the item as inactive instead of removing it from the database.
    // This preserves data integrity and allows for potential recovery.
    switch($item_type) {
        case 'flight':
            $query = "UPDATE domestic_flights SET is_active = 0 WHERE flight_id = ?";
            break;

        case 'bus':
            $query = "UPDATE buses SET is_active = 0 WHERE bus_id = ?";
            break;

        case 'hotel':
            $query = "UPDATE hotels SET is_active = 0 WHERE hotel_id = ?";
            break;

        case 'package':
            $query = "UPDATE tour_packages SET is_active = 0 WHERE package_id = ?";
            break;

        case 'place':
            $query = "UPDATE places SET is_active = 0 WHERE place_id = ?";
            break;

        default:
            // If the item type is not recognized, throw an error.
            throw new Exception("Invalid item type");
    }

    // Prepare and execute the soft delete query.
    $stmt = $db->prepare($query);
    $stmt->execute([$item_id]);

    // Send a 200 OK response with a success message.
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => ucfirst($item_type) . " deleted successfully"
    ]);
}

/**
 * A utility function to check if all required fields are present in the request data.
 *
 * @param object $data The decoded JSON data from the request.
 * @param array $fields An array of strings representing the required field names.
 * @throws Exception If a required field is missing or empty.
 */
function requireFields($data, $fields) {
    foreach ($fields as $field) {
        // Check if the field is not set or is an empty string.
        if (!isset($data->$field) || $data->$field === '') {
            // Throw an exception with a user-friendly error message.
            throw new Exception(ucfirst(str_replace('_', ' ', $field)) . " is required");
        }
    }
}
?>
