<?php
/**
 * Represents a geographical location and provides methods for retrieving location data.
 * This class handles operations such as fetching all locations, popular locations,
 * locations with airports, and searching for specific locations.
 */
class Location {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "locations";

    // Public properties to hold location data.
    public $location_id;
    public $location_name;
    public $location_type; // e.g., 'city', 'district', 'region'
    public $province;
    public $latitude;
    public $longitude;
    public $description;
    public $airport_code; // IATA code, e.g., 'KTM'
    public $is_popular;

    /**
     * Constructor to initialize the Location object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Retrieves all locations, with an option to filter by location type.
     *
     * @param string|null $type The type of location to filter by (e.g., 'city').
     * @return array An array of location records.
     */
    public function getAll($type = null) {
        // Base query to select all from the locations table.
        $query = "SELECT * FROM " . $this->table;

        // If a type is specified, add a WHERE clause to filter by it.
        if ($type) {
            $query .= " WHERE location_type = :type";
        }

        // Order results to show popular locations first, then alphabetically.
        $query .= " ORDER BY is_popular DESC, location_name ASC";

        // Prepare the statement.
        $stmt = $this->conn->prepare($query);

        // Bind the type parameter if it was provided.
        if ($type) {
            $stmt->bindParam(":type", $type);
        }

        // Execute and return all results.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves only the locations that are marked as popular.
     *
     * @return array An array of popular location records.
     */
    public function getPopular() {
        // Query to select locations where 'is_popular' is true.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE is_popular = 1
                  ORDER BY location_name ASC";

        // Prepare, execute, and return the results.
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves all locations that have an associated airport code.
     *
     * @return array An array of location records with airports.
     */
    public function getWithAirports() {
        // Query to select locations that have a non-empty airport code.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE airport_code IS NOT NULL
                  AND airport_code != ''
                  ORDER BY location_name ASC";

        // Prepare, execute, and return the results.
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Searches for locations by name or province.
     *
     * @param string $search_term The term to search for.
     * @return array An array of matching location records, limited to 20.
     */
    public function search($search_term) {
        // Query to find locations where the name or province matches the search term.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE location_name LIKE :search
                  OR province LIKE :search
                  ORDER BY is_popular DESC, location_name ASC
                  LIMIT 20";

        // Prepare the statement.
        $stmt = $this->conn->prepare($query);
        // Add wildcards to the search term for a broad match.
        $search = "%$search_term%";
        $stmt->bindParam(":search", $search);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves a single location by its unique ID.
     *
     * @param int $location_id The unique identifier for the location.
     * @return array|false An associative array of the location's details, or false if not found.
     */
    public function getById($location_id) {
        // Query to select a single location by its ID.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE location_id = :location_id
                  LIMIT 1";

        // Prepare, bind, execute, and fetch the single record.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":location_id", $location_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
