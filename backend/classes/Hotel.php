<?php
/**
 * Represents a single hotel entity and provides methods for managing hotel data.
 * This class handles operations such as searching for hotels, retrieving hotel details
 * and available rooms, and managing room availability.
 */
class Hotel {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "hotels";

    // Public properties to hold hotel data.
    public $hotel_id;
    public $vendor_id;
    public $hotel_name;
    public $location_id;
    public $address;
    public $description;
    public $star_rating;
    public $hotel_type; // e.g., 'hotel', 'resort', 'guesthouse'
    public $amenities; // e.g., 'wifi,pool,gym'
    public $contact_number;
    public $email;
    public $image_url;
    public $is_active;

    /**
     * Constructor to initialize the Hotel object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Searches for available hotels based on location and other filters.
     *
     * @param int|null $location_id The ID of the location to search in.
     * @param string|null $check_in The check-in date (currently not used in query).
     * @param string|null $check_out The check-out date (currently not used in query).
     * @param array $filters An associative array of additional filters (min_rating, hotel_type, max_price).
     * @return array An array of hotel records matching the criteria.
     */
    public function search($location_id = null, $check_in = null, $check_out = null, $filters = []) {
        // Base SQL query to select active hotels.
        // It joins with the locations table to get location name and province.
        $query = "SELECT h.*,
                         l.location_name, l.province
                  FROM " . $this->table . " h
                  INNER JOIN locations l ON h.location_id = l.location_id
                  WHERE h.is_active = 1";

        // Append location filter if provided.
        if ($location_id) {
            $query .= " AND h.location_id = :location_id";
        }

        // Apply additional filters from the $filters array.
        if (isset($filters['min_rating'])) {
            $query .= " AND h.star_rating >= :min_rating";
        }
        if (isset($filters['hotel_type'])) {
            $query .= " AND h.hotel_type = :hotel_type";
        }
        // This subquery filters hotels based on the price of their available rooms.
        if (isset($filters['max_price'])) {
            $query .= " AND h.hotel_id IN (
                SELECT DISTINCT hotel_id FROM hotel_rooms
                WHERE base_price_per_night <= :max_price AND is_available = 1
            )";
        }

        // Order the results by star rating (descending) and then by hotel name (ascending).
        $query .= " ORDER BY h.star_rating DESC, h.hotel_name ASC";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the parameters to the prepared statement.
        if ($location_id) $stmt->bindParam(":location_id", $location_id);
        if (isset($filters['min_rating'])) $stmt->bindParam(":min_rating", $filters['min_rating']);
        if (isset($filters['hotel_type'])) $stmt->bindParam(":hotel_type", $filters['hotel_type']);
        if (isset($filters['max_price'])) $stmt->bindParam(":max_price", $filters['max_price']);

        // Execute the query and return all matching records.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single hotel by its ID, including its available rooms.
     *
     * @param int $hotel_id The unique identifier for the hotel.
     * @return array|false An associative array of the hotel's details, or false if not found.
     */
    public function getById($hotel_id) {
        // SQL query to get a specific hotel along with its location details.
        $query = "SELECT h.*,
                         l.location_name, l.province
                  FROM " . $this->table . " h
                  INNER JOIN locations l ON h.location_id = l.location_id
                  WHERE h.hotel_id = :hotel_id
                  LIMIT 1";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":hotel_id", $hotel_id);
        $stmt->execute();

        // Fetch the hotel record.
        $hotel = $stmt->fetch(PDO::FETCH_ASSOC);

        // If the hotel is found, fetch its associated rooms.
        if ($hotel) {
            $hotel['rooms'] = $this->getRooms($hotel_id);
        }

        return $hotel;
    }

    /**
     * Retrieves all available rooms for a specific hotel.
     *
     * @param int $hotel_id The ID of the hotel.
     * @return array An array of available rooms for the given hotel.
     */
    public function getRooms($hotel_id) {
        // SQL query to select all available rooms for a hotel, ordered by price.
        $query = "SELECT * FROM hotel_rooms
                  WHERE hotel_id = :hotel_id
                  AND is_available = 1
                  ORDER BY base_price_per_night ASC";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":hotel_id", $hotel_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single room by its unique ID.
     *
     * @param int $room_id The unique identifier for the room.
     * @return array|false An associative array of the room's details, or false if not found.
     */
    public function getRoomById($room_id) {
        // SQL query to get a specific room and include the parent hotel's name and location.
        $query = "SELECT hr.*, h.hotel_name, h.location_id
                  FROM hotel_rooms hr
                  INNER JOIN hotels h ON hr.hotel_id = h.hotel_id
                  WHERE hr.room_id = :room_id
                  LIMIT 1";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":room_id", $room_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Updates the number of available units for a specific room type after a booking.
     *
     * @param int $room_id The ID of the room to update.
     * @param int $rooms_to_book The number of rooms being booked.
     * @return bool True if the update was successful, false otherwise.
     */
    public function updateRoomAvailability($room_id, $rooms_to_book) {
        // SQL query to decrement the number of available rooms.
        // The WHERE clause ensures the update only happens if enough rooms are available.
        $query = "UPDATE hotel_rooms
                  SET available_rooms = available_rooms - :rooms
                  WHERE room_id = :room_id
                  AND available_rooms >= :rooms";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":room_id", $room_id);
        $stmt->bindParam(":rooms", $rooms_to_book);

        // Return true if the query executed and affected at least one row.
        return $stmt->execute() && $stmt->rowCount() > 0;
    }
}
?>
