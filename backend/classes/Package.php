<?php
/**
 * Represents a tour package and provides methods for managing package data.
 * This class handles operations such as retrieving all packages with filters,
 * getting detailed information for a single package, and fetching featured packages.
 */
class Package {
    // --- Properties ---

    // Database connection and table name.
    private $conn;
    private $table = "tour_packages";

    // Public properties to hold package data.
    public $package_id;
    public $package_name;
    public $package_type; // e.g., 'trekking', 'cultural', 'adventure'
    public $description;
    public $detailed_itinerary;
    public $duration_days;
    public $duration_nights;
    public $difficulty_level; // e.g., 'easy', 'moderate', 'strenuous'
    public $group_size_min;
    public $group_size_max;
    public $base_price;
    public $currency;
    public $inclusions;
    public $exclusions;
    public $best_season;
    public $image_url;
    public $gallery_images; // JSON array of image URLs
    public $is_active;
    public $is_featured;

    /**
     * Constructor to initialize the Package object with a database connection.
     *
     * @param PDO $db An active PDO database connection.
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Retrieves all active tour packages, with options to apply various filters.
     *
     * @param array $filters An associative array of filters (package_type, difficulty, max_price, etc.).
     * @return array An array of package records matching the criteria.
     */
    public function getAll($filters = []) {
        // Base query to select all active packages.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE is_active = 1";

        // Append conditions based on the provided filters.
        if (isset($filters['package_type'])) {
            $query .= " AND package_type = :package_type";
        }
        if (isset($filters['difficulty'])) {
            $query .= " AND difficulty_level = :difficulty";
        }
        if (isset($filters['max_price'])) {
            $query .= " AND base_price <= :max_price";
        }
        if (isset($filters['max_duration'])) {
            $query .= " AND duration_days <= :max_duration";
        }
        if (isset($filters['featured']) && $filters['featured']) {
            $query .= " AND is_featured = 1";
        }

        // Order results to show featured packages first, then alphabetically.
        $query .= " ORDER BY is_featured DESC, package_name ASC";

        // Prepare the SQL statement.
        $stmt = $this->conn->prepare($query);

        // Bind the filter parameters to the prepared statement.
        if (isset($filters['package_type'])) $stmt->bindParam(":package_type", $filters['package_type']);
        if (isset($filters['difficulty'])) $stmt->bindParam(":difficulty", $filters['difficulty']);
        if (isset($filters['max_price'])) $stmt->bindParam(":max_price", $filters['max_price']);
        if (isset($filters['max_duration'])) $stmt->bindParam(":max_duration", $filters['max_duration']);

        // Execute the query and return all matching records.
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves the details of a single package by its ID, including its associated locations.
     *
     * @param int $package_id The unique identifier for the package.
     * @return array|false An associative array of the package's details, or false if not found.
     */
    public function getById($package_id) {
        // Query to select a single package by its ID.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE package_id = :package_id
                  LIMIT 1";

        // Prepare and execute the statement.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":package_id", $package_id);
        $stmt->execute();

        // Fetch the package record.
        $package = $stmt->fetch(PDO::FETCH_ASSOC);

        // If the package is found, fetch its associated locations (itinerary).
        if ($package) {
            $package['locations'] = $this->getPackageLocations($package_id);
        }

        return $package;
    }

    /**
     * Retrieves the itinerary (locations) for a specific package.
     *
     * @param int $package_id The ID of the package.
     * @return array An array of location records for the package itinerary.
     */
    public function getPackageLocations($package_id) {
        // Query to get the list of locations for a package from the junction table.
        // It joins with the locations table to get descriptive names.
        $query = "SELECT pl.*, l.location_name, l.location_type
                  FROM package_locations pl
                  INNER JOIN locations l ON pl.location_id = l.location_id
                  WHERE pl.package_id = :package_id
                  ORDER BY pl.day_number ASC, pl.sequence_order ASC";

        // Prepare, execute, and return the itinerary.
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":package_id", $package_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retrieves a limited number of featured packages.
     *
     * @param int $limit The maximum number of featured packages to return.
     * @return array An array of featured package records.
     */
    public function getFeatured($limit = 6) {
        // Query to select active and featured packages, with a limit.
        $query = "SELECT * FROM " . $this->table . "
                  WHERE is_active = 1 AND is_featured = 1
                  ORDER BY package_name ASC
                  LIMIT :limit";

        // Prepare the statement.
        $stmt = $this->conn->prepare($query);
        // Bind the limit as an integer parameter.
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
