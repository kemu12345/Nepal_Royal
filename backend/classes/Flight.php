<?php
/**
 * Represents a single flight entity and provides methods for managing flight data.
 * This class handles operations such as searching for flights, retrieving flight details,
 * updating seat availability, creating new flights, and fetching airline information.
 */
class Flight {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "domestic_flights";

    // Public properties to hold flight data.
    public $flight_id;
    public $airline_id;
    public $flight_number;
    public $origin_location_id;
    public $destination_location_id;
    public $departure_time;
    public $arrival_time;
    public $duration_minutes;
    public $aircraft_type;
    public $total_seats;
    public $available_seats;
    public $base_price;
    public $currency;
    public $operates_on_days; // e.g., 'Mon,Tue,Wed'
    public $is_active;

    /**
     * Constructor to initialize the Flight object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Searches for available flights based on origin, destination, and travel date.
     * It can also apply additional filters like maximum price and airline.
     *
     * @param int $origin_id The ID of the origin location.
     * @param int $destination_id The ID of the destination location.
     * @param string|null $travel_date The date of travel (e.g., '2024-12-31').
     * @param array $filters An associative array of additional filters.
     * @return array An array of flight records matching the criteria.
     */
    public function search($origin_id, $destination_id, $travel_date = null, $filters = []) {
        // Determine the day of the week from the travel date.
        $day_of_week = $travel_date ? date('D', strtotime($travel_date)) : null;

        // Base SQL query to select active flights with available seats.
        // It joins with airlines and locations tables to get descriptive names and codes.
        $query = "SELECT df.*,
                         a.airline_name, a.airline_code, a.logo_url,
                         ol.location_name as origin_name, ol.airport_code as origin_code,
                         dl.location_name as destination_name, dl.airport_code as destination_code
                  FROM " . $this->table . " df
                  INNER JOIN airlines a ON df.airline_id = a.airline_id
                  INNER JOIN locations ol ON df.origin_location_id = ol.location_id
                  INNER JOIN locations dl ON df.destination_location_id = dl.location_id
                  WHERE df.is_active = 1
                  AND df.available_seats > 0";

        // Append conditions based on provided search parameters.
        if ($origin_id) {
            $query .= " AND df.origin_location_id = :origin_id";
        }
        if ($destination_id) {
            $query .= " AND df.destination_location_id = :destination_id";
        }
        // Check if the flight operates on the specified day of the week.
        if ($day_of_week) {
            $query .= " AND FIND_IN_SET(:day_of_week, df.operates_on_days) > 0";
        }

        // Apply additional filters from the $filters array.
        if (isset($filters['max_price'])) {
            $query .= " AND df.base_price <= :max_price";
        }
        if (isset($filters['airline_id'])) {
            $query .= " AND df.airline_id = :airline_id";
        }

        // Order the results by departure time and then by price.
        $query .= " ORDER BY df.departure_time ASC, df.base_price ASC";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the parameters to the prepared statement.
        if ($origin_id) $stmt->bindParam(":origin_id", $origin_id);
        if ($destination_id) $stmt->bindParam(":destination_id", $destination_id);
        if ($day_of_week) $stmt->bindParam(":day_of_week", $day_of_week);
        if (isset($filters['max_price'])) $stmt->bindParam(":max_price", $filters['max_price']);
        if (isset($filters['airline_id'])) $stmt->bindParam(":airline_id", $filters['airline_id']);

        // Execute the query and return all matching records.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single flight by its unique ID.
     *
     * @param int $flight_id The unique identifier for the flight.
     * @return array|false An associative array of the flight's details, or false if not found.
     */
    public function getById($flight_id) {
        // SQL query to get a specific flight along with airline and location details.
        $query = "SELECT df.*,
                         a.airline_name, a.airline_code, a.logo_url, a.contact_number,
                         ol.location_name as origin_name, ol.airport_code as origin_code,
                         dl.location_name as destination_name, dl.airport_code as destination_code
                  FROM " . $this->table . " df
                  INNER JOIN airlines a ON df.airline_id = a.airline_id
                  INNER JOIN locations ol ON df.origin_location_id = ol.location_id
                  INNER JOIN locations dl ON df.destination_location_id = dl.location_id
                  WHERE df.flight_id = :flight_id
                  LIMIT 1";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":flight_id", $flight_id);
        $stmt->execute();

        // Fetch and return the single record.
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Updates the number of available seats for a flight after a booking.
     * This is a critical operation to prevent overbooking.
     *
     * @param int $flight_id The ID of the flight to update.
     * @param int $seats_to_book The number of seats being booked.
     * @return bool True if the update was successful, false otherwise.
     */
    public function updateSeats($flight_id, $seats_to_book) {
        // SQL query to decrement the available seats.
        // The WHERE clause ensures the update only happens if enough seats are available.
        $query = "UPDATE " . $this->table . "
                  SET available_seats = available_seats - :seats
                  WHERE flight_id = :flight_id
                  AND available_seats >= :seats";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":flight_id", $flight_id);
        $stmt->bindParam(":seats", $seats_to_book);

        // Return true if the query executed and affected at least one row.
        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    /**
     * Creates a new flight record in the database.
     * This method is intended for administrative use.
     *
     * @return bool True if the creation was successful, false otherwise.
     */
    public function create() {
        // SQL query to insert a new flight record.
        $query = "INSERT INTO " . $this->table . "
                  (airline_id, flight_number, origin_location_id, destination_location_id,
                   departure_time, arrival_time, duration_minutes, aircraft_type,
                   total_seats, available_seats, base_price, currency, operates_on_days)
                  VALUES (:airline_id, :flight_number, :origin_id, :dest_id,
                          :dep_time, :arr_time, :duration, :aircraft,
                          :total_seats, :available_seats, :price, :currency, :operates_on)";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the public properties of the object to the query parameters.
        $stmt->bindParam(":airline_id", $this->airline_id);
        $stmt->bindParam(":flight_number", $this->flight_number);
        $stmt->bindParam(":origin_id", $this->origin_location_id);
        $stmt->bindParam(":dest_id", $this->destination_location_id);
        $stmt->bindParam(":dep_time", $this->departure_time);
        $stmt->bindParam(":arr_time", $this->arrival_time);
        $stmt->bindParam(":duration", $this->duration_minutes);
        $stmt->bindParam(":aircraft", $this->aircraft_type);
        $stmt->bindParam(":total_seats", $this->total_seats);
        $stmt->bindParam(":available_seats", $this->available_seats);
        $stmt->bindParam(":price", $this->base_price);
        $stmt->bindParam(":currency", $this->currency);
        $stmt->bindParam(":operates_on", $this->operates_on_days);

        // Execute the statement and return the result.
        return $stmt->execute();
    }

    /**
     * Retrieves a list of all active airlines.
     *
     * @return array An array of all active airlines.
     */
    public function getAirlines() {
        // SQL query to select all active airlines, ordered by name.
        $query = "SELECT * FROM airlines WHERE is_active = 1 ORDER BY airline_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
