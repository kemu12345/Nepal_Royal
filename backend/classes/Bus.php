<?php
/**
 * Represents a single bus entity and provides methods for interacting with bus data.
 * This class handles operations like searching for buses, retrieving bus details,
 * updating seat availability, and fetching bus operator information.
 */
class Bus {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "buses";

    // Public properties to hold bus data.
    public $bus_id;
    public $operator_id;
    public $bus_number;
    public $origin_location_id;
    public $destination_location_id;
    public $departure_time;
    public $arrival_time;
    public $duration_minutes;
    public $bus_type; // e.g., 'deluxe', 'ac', 'sofa'
    public $total_seats;
    public $available_seats;
    public $base_price;
    public $currency;
    public $amenities; // e.g., 'wifi,water_bottle'
    public $operates_on_days; // e.g., 'Mon,Tue,Wed'
    public $is_active;

    /**
     * Constructor to initialize the Bus object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Searches for available buses based on origin, destination, and date.
     * It can also apply additional filters like maximum price and bus type.
     *
     * @param int $origin_id The ID of the origin location.
     * @param int $destination_id The ID of the destination location.
     * @param string|null $travel_date The date of travel (e.g., '2024-12-31').
     * @param array $filters An associative array of additional filters.
     * @return array An array of bus records matching the criteria.
     */
    public function search($origin_id, $destination_id, $travel_date = null, $filters = []) {
        // Determine the day of the week from the travel date (e.g., 'Mon', 'Tue').
        $day_of_week = $travel_date ? date('D', strtotime($travel_date)) : null;

        // Base SQL query to select active buses with available seats.
        // It joins with operators and locations tables to get descriptive names.
        $query = "SELECT b.*,
                         bo.operator_name, bo.rating, bo.logo_url,
                         ol.location_name as origin_name,
                         dl.location_name as destination_name
                  FROM " . $this->table . " b
                  INNER JOIN bus_operators bo ON b.operator_id = bo.operator_id
                  INNER JOIN locations ol ON b.origin_location_id = ol.location_id
                  INNER JOIN locations dl ON b.destination_location_id = dl.location_id
                  WHERE b.is_active = 1
                  AND b.available_seats > 0";

        // Append conditions based on provided search parameters.
        if ($origin_id) {
            $query .= " AND b.origin_location_id = :origin_id";
        }
        if ($destination_id) {
            $query .= " AND b.destination_location_id = :destination_id";
        }
        // Check if the bus operates on the specified day of the week.
        if ($day_of_week) {
            $query .= " AND FIND_IN_SET(:day_of_week, b.operates_on_days) > 0";
        }

        // Apply additional filters from the $filters array.
        if (isset($filters['max_price'])) {
            $query .= " AND b.base_price <= :max_price";
        }
        if (isset($filters['bus_type'])) {
            $query .= " AND b.bus_type = :bus_type";
        }

        // Order the results by departure time and then by price.
        $query .= " ORDER BY b.departure_time ASC, b.base_price ASC";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the parameters to the prepared statement.
        if ($origin_id) $stmt->bindParam(":origin_id", $origin_id);
        if ($destination_id) $stmt->bindParam(":destination_id", $destination_id);
        if ($day_of_week) $stmt->bindParam(":day_of_week", $day_of_week);
        if (isset($filters['max_price'])) $stmt->bindParam(":max_price", $filters['max_price']);
        if (isset($filters['bus_type'])) $stmt->bindParam(":bus_type", $filters['bus_type']);

        // Execute the query and return all matching records.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single bus by its unique ID.
     *
     * @param int $bus_id The unique identifier for the bus.
     * @return array|false An associative array of the bus's details, or false if not found.
     */
    public function getById($bus_id) {
        // SQL query to get a specific bus along with operator and location names.
        $query = "SELECT b.*,
                         bo.operator_name, bo.rating, bo.contact_number,
                         ol.location_name as origin_name,
                         dl.location_name as destination_name
                  FROM " . $this->table . " b
                  INNER JOIN bus_operators bo ON b.operator_id = bo.operator_id
                  INNER JOIN locations ol ON b.origin_location_id = ol.location_id
                  INNER JOIN locations dl ON b.destination_location_id = dl.location_id
                  WHERE b.bus_id = :bus_id
                  LIMIT 1";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":bus_id", $bus_id);
        $stmt->execute();

        // Fetch and return the single record.
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Updates the number of available seats for a bus after a booking.
     * This is a critical step in the booking process to prevent overbooking.
     *
     * @param int $bus_id The ID of the bus to update.
     * @param int $seats_to_book The number of seats being booked.
     * @return bool True if the update was successful, false otherwise.
     */
    public function updateSeats($bus_id, $seats_to_book) {
        // SQL query to decrement the available seats.
        // The WHERE clause ensures that the update only happens if enough seats are available.
        $query = "UPDATE " . $this->table . "
                  SET available_seats = available_seats - :seats
                  WHERE bus_id = :bus_id
                  AND available_seats >= :seats";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":bus_id", $bus_id);
        $stmt->bindParam(":seats", $seats_to_book);

        // Return true if the query executed and affected at least one row.
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    /**
     * Retrieves a list of all active bus operators.
     *
     * @return array An array of all active bus operators.
     */
    public function getOperators() {
        // SQL query to select all active operators, ordered by name.
        $query = "SELECT * FROM bus_operators WHERE is_active = 1 ORDER BY operator_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
