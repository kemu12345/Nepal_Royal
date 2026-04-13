<?php
/**
 * Royal Nepal - User Class
 * Handles user authentication and management
 */

class User {
    private $conn;
    private $table = "users";

    // User properties
    public $user_id;
    public $email;
    public $password;
    public $password_hash;
    public $first_name;
    public $last_name;
    public $phone;
    public $role;
    public $profile_image;
    public $is_active;
    public $email_verified;
    public $created_at;
    public $last_login;

    /**
     * Constructor
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Register new user
     * @return bool
     */
    public function register() {
        $query = "INSERT INTO " . $this->table . "
                  (email, password_hash, first_name, last_name, phone, role)
                  VALUES (:email, :password_hash, :first_name, :last_name, :phone, :role)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->role = $this->role ?? 'user';

        // Hash password
        $this->password_hash = password_hash($this->password, PASSWORD_BCRYPT);

        // Bind parameters
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            $this->user_id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Login user
     * @return array|false
     */
    public function login() {
        $query = "SELECT user_id, email, password_hash, first_name, last_name, phone, role,
                         profile_image, is_active, email_verified
                  FROM " . $this->table . "
                  WHERE email = :email AND is_active = 1
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $this->email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verify password
            if(password_verify($this->password, $row['password_hash'])) {
                // Update last login
                $this->updateLastLogin($row['user_id']);

                // Remove password hash from response
                unset($row['password_hash']);

                return $row;
            }
        }

        return false;
    }

    /**
     * Check if email already exists
     * @return bool
     */
    public function emailExists() {
        $query = "SELECT user_id FROM " . $this->table . " WHERE email = :email LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $this->email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Get user by ID
     * @param int $user_id
     * @return array|false
     */
    public function getUserById($user_id) {
        $query = "SELECT user_id, email, first_name, last_name, phone, role,
                         profile_image, is_active, email_verified, created_at, last_login
                  FROM " . $this->table . "
                  WHERE user_id = :user_id
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * Update last login timestamp
     * @param int $user_id
     * @return bool
     */
    private function updateLastLogin($user_id) {
        $query = "UPDATE " . $this->table . "
                  SET last_login = CURRENT_TIMESTAMP
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);

        return $stmt->execute();
    }

    /**
     * Update user profile
     * @return bool
     */
    public function updateProfile() {
        $query = "UPDATE " . $this->table . "
                  SET first_name = :first_name,
                      last_name = :last_name,
                      phone = :phone
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));

        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":user_id", $this->user_id);

        return $stmt->execute();
    }

    /**
     * Change password
     * @param string $old_password
     * @param string $new_password
     * @return bool
     */
    public function changePassword($old_password, $new_password) {
        // First verify old password
        $query = "SELECT password_hash FROM " . $this->table . " WHERE user_id = :user_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if(password_verify($old_password, $row['password_hash'])) {
                // Update password
                $query = "UPDATE " . $this->table . "
                          SET password_hash = :password_hash
                          WHERE user_id = :user_id";

                $stmt = $this->conn->prepare($query);
                $new_hash = password_hash($new_password, PASSWORD_BCRYPT);
                $stmt->bindParam(":password_hash", $new_hash);
                $stmt->bindParam(":user_id", $this->user_id);

                return $stmt->execute();
            }
        }

        return false;
    }
}
?>
