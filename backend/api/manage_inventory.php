<?php
/**
 * Royal Nepal - Admin Inventory Management API
 * Endpoint: POST/PUT/DELETE /backend/api/manage_inventory.php
 * Handles CRUD operations for Flights, Hotels, Buses, and Packages
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
    $errorMessage = $e->getMessage();
    if (strpos($errorMessage, '1452 Cannot add or update a child row: a foreign key constraint fails') !== false) {
        $errorMessage = "Invalid ID provided for a related entity. Please ensure that all selected locations, airlines, operators, etc. exist.";
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $errorMessage
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

            $flightNumber = normalizeInventoryNumber($data->flight_number, '/^[A-Za-z]{2}-[0-9]{3}$/', 'Flight number', 'yt-909');

            if ($data->origin_location_id == $data->destination_location_id) {
                throw new Exception("Origin and destination cannot be the same");
            }

            $flightDurationMinutes = calculateDurationMinutes($data->departure_time, $data->arrival_time);

            // SQL query to insert a new flight into the database.
            $query = "INSERT INTO domestic_flights
                      (airline_id, flight_number, origin_location_id, destination_location_id,
                       departure_time, arrival_time, duration_minutes, aircraft_type,
                       total_seats, available_seats, base_price, currency, operates_on_days, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the SQL statement with data from the request.
            $stmt = $db->prepare($query);
            $stmt->execute([
                (int)$data->airline_id,
                $flightNumber,
                (int)$data->origin_location_id,
                (int)$data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $flightDurationMinutes,
                $data->aircraft_type ?? null,
                (int)$data->total_seats,
                (int)($data->available_seats ?? $data->total_seats),
                (float)$data->base_price,
                $data->currency ?? 'NPR',
                $data->operates_on_days,
                (int)($data->is_active ?? 1)
            ]);
            break;

        case 'bus':
            // Define required fields for creating a bus.
            requireFields($data, ['operator_id', 'bus_number', 'origin_location_id', 'destination_location_id', 'departure_time', 'arrival_time', 'duration_minutes', 'total_seats', 'base_price', 'operates_on_days']);

            $busNumber = normalizeInventoryNumber($data->bus_number, '/^[A-Za-z]{2}-[0-9]{3}$/', 'Bus number', 'yt-909');

            if ($data->origin_location_id == $data->destination_location_id) {
                throw new Exception("Origin and destination cannot be the same");
            }

            $busDurationMinutes = calculateDurationMinutes($data->departure_time, $data->arrival_time);

            // SQL query to insert a new bus.
            $query = "INSERT INTO buses
                      (operator_id, bus_number, origin_location_id, destination_location_id,
                       departure_time, arrival_time, duration_minutes, bus_type,
                       total_seats, available_seats, base_price, currency, amenities, operates_on_days, is_active)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            // Prepare and execute the statement.
            $stmt = $db->prepare($query);
            $stmt->execute([
                (int)$data->operator_id,
                $busNumber,
                (int)$data->origin_location_id,
                (int)$data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $busDurationMinutes,
                $data->bus_type ?? 'regular',
                (int)$data->total_seats,
                (int)($data->available_seats ?? $data->total_seats),
                (float)$data->base_price,
                $data->currency ?? 'NPR',
                $data->amenities ?? null,
                $data->operates_on_days,
                (int)($data->is_active ?? 1)
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

        case 'location':
            requireFields($data, ['location_name', 'location_type', 'province']);
            $query = "INSERT INTO locations (location_name, location_type, province, airport_code, is_popular) VALUES (?, ?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->location_name, $data->location_type, $data->province, $data->airport_code ?? null, $data->is_popular ?? 0]);
            break;

        case 'airline':
            requireFields($data, ['airline_name', 'airline_code']);
            $query = "INSERT INTO airlines (airline_name, airline_code, contact_number, is_active) VALUES (?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->airline_name, $data->airline_code, $data->contact_number ?? null, $data->is_active ?? 1]);
            break;

        case 'operator':
            requireFields($data, ['operator_name']);
            $query = "INSERT INTO bus_operators (operator_name, contact_number, rating, is_active) VALUES (?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->operator_name, $data->contact_number ?? null, $data->rating ?? 4.0, $data->is_active ?? 1]);
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
            requireFields($data, ['airline_id', 'flight_number', 'origin_location_id', 'destination_location_id', 'departure_time', 'arrival_time', 'duration_minutes', 'total_seats', 'base_price', 'operates_on_days']);
            $flightNumber = normalizeInventoryNumber($data->flight_number, '/^[A-Za-z]{2}-[0-9]{3}$/', 'Flight number', 'yt-909');
            if ($data->origin_location_id == $data->destination_location_id) {
                throw new Exception("Origin and destination cannot be the same");
            }
            $flightDurationMinutes = calculateDurationMinutes($data->departure_time, $data->arrival_time);

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
                $flightNumber,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $flightDurationMinutes,
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
            requireFields($data, ['operator_id', 'bus_number', 'origin_location_id', 'destination_location_id', 'departure_time', 'arrival_time', 'duration_minutes', 'total_seats', 'base_price', 'operates_on_days']);
            $busNumber = normalizeInventoryNumber($data->bus_number, '/^[A-Za-z]{2}-[0-9]{3}$/', 'Bus number', 'yt-909');
            if ($data->origin_location_id == $data->destination_location_id) {
                throw new Exception("Origin and destination cannot be the same");
            }
            $busDurationMinutes = calculateDurationMinutes($data->departure_time, $data->arrival_time);

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
                $busNumber,
                $data->origin_location_id,
                $data->destination_location_id,
                $data->departure_time,
                $data->arrival_time,
                $busDurationMinutes,
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
            requireFields($data, ['hotel_name', 'location_id', 'address']);
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
            requireFields($data, ['package_name', 'package_type', 'description', 'duration_days', 'duration_nights', 'base_price']);
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
            requireFields($data, ['place_name', 'location_id', 'category', 'description']);
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

        case 'location':
            requireFields($data, ['location_name', 'location_type', 'province']);
            $query = "UPDATE locations SET location_name = ?, location_type = ?, province = ?, airport_code = ?, is_popular = ? WHERE location_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->location_name, $data->location_type, $data->province, $data->airport_code ?? null, $data->is_popular ?? 0, $item_id]);
            break;

        case 'airline':
            requireFields($data, ['airline_name', 'airline_code']);
            $query = "UPDATE airlines SET airline_name = ?, airline_code = ?, contact_number = ?, is_active = ? WHERE airline_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->airline_name, $data->airline_code, $data->contact_number ?? null, $data->is_active ?? 1, $item_id]);
            break;

        case 'operator':
            requireFields($data, ['operator_name']);
            $query = "UPDATE bus_operators SET operator_name = ?, contact_number = ?, rating = ?, is_active = ? WHERE operator_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->operator_name, $data->contact_number ?? null, $data->rating ?? 4.0, $data->is_active ?? 1, $item_id]);
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

    // Perform a Hard Delete to completely remove the record from the database.
    // Note: This will fail if there are foreign key constraints (e.g., existing bookings).
    switch($item_type) {
        case 'flight':
            $query = "DELETE FROM domestic_flights WHERE flight_id = ?";
            break;

        case 'bus':
            $query = "DELETE FROM buses WHERE bus_id = ?";
            break;

        case 'hotel':
            // The schema defines ON DELETE CASCADE for hotel_rooms, so deleting a hotel will also remove its rooms.
            $query = "DELETE FROM hotels WHERE hotel_id = ?";
            break;

        case 'package':
            $query = "DELETE FROM tour_packages WHERE package_id = ?";
            break;

        case 'place':
            $query = "DELETE FROM places WHERE place_id = ?";
            break;

        case 'location':
            $query = "DELETE FROM locations WHERE location_id = ?";
            break;

        case 'airline':
            $query = "DELETE FROM airlines WHERE airline_id = ?";
            break;

        case 'operator':
            $query = "DELETE FROM bus_operators WHERE operator_id = ?";
            break;

        default:
            throw new Exception("Invalid item type");
    }

    try {
        $stmt = $db->prepare($query);
        $stmt->execute([$item_id]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Item not found or already deleted");
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => ucfirst($item_type) . " permanently deleted from database"
        ]);
    } catch (PDOException $e) {
        // Handle foreign key constraint errors (Code 23000)
        if ($e->getCode() == '23000') {
            throw new Exception("Cannot delete this " . $item_type . " because it has existing bookings or related records. Try deactivating it instead.");
        }
        throw $e;
    }
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

        // Specific validation for numeric fields
        $numericFields = ['airline_id', 'origin_location_id', 'destination_location_id', 'duration_minutes', 'total_seats', 'base_price', 'operator_id', 'location_id', 'star_rating', 'duration_days', 'duration_nights', 'rating'];
        if (in_array($field, $numericFields)) {
            if (!is_numeric($data->$field)) {
                throw new Exception(ucfirst(str_replace('_', ' ', $field)) . " must be a number");
            }
            if ($data->$field < 0) {
                throw new Exception(ucfirst(str_replace('_', ' ', $field)) . " cannot be negative");
            }
        }
    }
}

function normalizeInventoryNumber($value, $pattern, $label, $example) {
    if (!is_string($value)) {
        throw new Exception($label . " is required");
    }

    $normalized = trim($value);
    if ($normalized === '') {
        throw new Exception($label . " is required");
    }

    if (!preg_match($pattern, $normalized)) {
        throw new Exception($label . " must use the format " . $example);
    }

    return $normalized;
}

function calculateDurationMinutes($departureTime, $arrivalTime) {
    $departureMinutes = parseTimeToMinutes($departureTime);
    $arrivalMinutes = parseTimeToMinutes($arrivalTime);

    $duration = $arrivalMinutes - $departureMinutes;
    if ($duration <= 0) {
        $duration += 24 * 60;
    }

    return $duration;
}

function parseTimeToMinutes($timeValue) {
    if (!is_string($timeValue) || !preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $timeValue, $matches)) {
        throw new Exception("Invalid time format");
    }

    $hours = (int)$matches[1];
    $minutes = (int)$matches[2];

    if ($hours < 0 || $hours > 23 || $minutes < 0 || $minutes > 59) {
        throw new Exception("Invalid time value");
    }

    return ($hours * 60) + $minutes;
}
