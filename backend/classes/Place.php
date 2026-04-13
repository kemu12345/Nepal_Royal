<?php
/**
 * Represents a place of interest or attraction and provides methods for managing its data.
 * This class handles operations like retrieving all places with filters, getting details
 * for a single place, and fetching places by category or UNESCO status.
 */
class Place {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "places";

    // Public properties to hold place data.
    public $place_id;
    public $place_name;
    public $location_id;
    public $category; // e.g., 'historical', 'natural', 'religious'
    public $description;
    public $history;
    public $best_time_to_visit;
    public $entry_fee;
    public $currency;
    public $opening_hours;
    public $unesco_site; // Boolean (0 or 1)
    public $altitude_meters;
    public $image_url;
    public $gallery_images; // JSON array of image URLs
    public $tips_and_guidelines;
    public $is_active;

    /**
     * Constructor to initialize the Place object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Retrieves all active places, with options to apply various filters.
     *
     * @param array $filters An associative array of filters (category, location_id, unesco).
     * @return array An array of place records matching the criteria.
     */
    public function getAll($filters = []) {
        // Base query to select all active places and join with locations for more context.
        $query = "SELECT p.*, l.location_name, l.province
                  FROM " . $this->table . " p
                  INNER JOIN locations l ON p.location_id = l.location_id
                  WHERE p.is_active = 1";

        // Append conditions based on the provided filters.
        if (isset($filters['category'])) {
            $query .= " AND p.category = :category";
        }
        if (isset($filters['location_id'])) {
            $query .= " AND p.location_id = :location_id";
        }
        if (isset($filters['unesco']) && $filters['unesco']) {
            $query .= " AND p.unesco_site = 1";
        }

        // Order results to show UNESCO sites first, then alphabetically by name.
        $query .= " ORDER BY p.unesco_site DESC, p.place_name ASC";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the filter parameters to the prepared statement.
        if (isset($filters['category'])) $stmt->bindParam(":category", $filters['category']);
        if (isset($filters['location_id'])) $stmt->bindParam(":location_id", $filters['location_id']);

        // Execute the query and return all matching records.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single place by its unique ID.
     *
     * @param int $place_id The unique identifier for the place.
     * @return array|false An associative array of the place's details, or false if not found.
     */
    public function getById($place_id) {
        // Query to select a single place and include details from its parent location.
        $query = "SELECT p.*, l.location_name, l.province, l.latitude, l.longitude
                  FROM " . $this->table . " p
                  INNER JOIN locations l ON p.location_id = l.location_id
                  WHERE p.place_id = :place_id
                  LIMIT 1";

        // Prepare, bind, execute, and fetch the single record.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":place_id", $place_id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves all active places belonging to a specific category.
     *
     * @param string $category The category to filter by.
     * @return array An array of place records in the specified category.
     */
    public function getByCategory($category) {
        // Query to select active places of a certain category.
        $query = "SELECT p.*, l.location_name
                  FROM " . $this->table . " p
                  INNER JOIN locations l ON p.location_id = l.location_id
                  WHERE p.category = :category
                  AND p.is_active = 1
                  ORDER BY p.place_name ASC";

        // Prepare, bind, execute, and return the results.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":category", $category);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves all active places that are designated as UNESCO World Heritage Sites.
     *
     * @return array An array of UNESCO site records.
     */
    public function getUnescoSites() {
        // Query to select all active places that are UNESCO sites.
        $query = "SELECT p.*, l.location_name, l.province
                  FROM " . $this->table . " p
                  INNER JOIN locations l ON p.location_id = l.location_id
                  WHERE p.unesco_site = 1
                  AND p.is_active = 1
                  ORDER BY p.place_name ASC";

        // Prepare, execute, and return the results.
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
