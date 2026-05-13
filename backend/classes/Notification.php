<?php
namespace RoyalNepal\classes;

/**
 * Handles user notifications within the Royal Nepal system.
 * Allows creating, fetching, and managing notifications for users and admins.
 */
class Notification {
    private $conn;
    private $table = "notifications";

    /**
     * @param \PDO $db Database connection
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create a new notification for a user.
     *
     * @param int $user_id Recipient of the notification
     * @param string $type Type of notification (e.g., 'booking_update', 'system')
     * @param string $title Short title
     * @param string $message Detailed content
     * @param int|null $booking_id Associated booking ID
     * @return bool
     */
    public function create($user_id, $type, $title, $message, $booking_id = null) {
        $query = "INSERT INTO " . $this->table . " 
                  (user_id, notification_type, title, message, related_booking_id, is_read) 
                  VALUES (?, ?, ?, ?, ?, 0)";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$user_id, $type, $title, $message, $booking_id]);
    }

    /**
     * Fetch all notifications for a specific user.
     *
     * @param int $user_id
     * @param bool $unreadOnly If true, only fetch unread notifications
     * @return array
     */
    public function getForUser($user_id, $unreadOnly = false) {
        $query = "SELECT * FROM " . $this->table . " WHERE user_id = ?";
        if ($unreadOnly) {
            $query .= " AND is_read = 0";
        }
        $query .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Mark a notification as read.
     *
     * @param int $notification_id
     * @return bool
     */
    public function markAsRead($notification_id) {
        $query = "UPDATE " . $this->table . " SET is_read = 1 WHERE notification_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$notification_id]);
    }

    /**
     * Notify all admins about an event.
     *
     * @param string $type
     * @param string $title
     * @param string $message
     * @param int|null $booking_id
     * @return void
     */
    public function notifyAdmins($type, $title, $message, $booking_id = null) {
        // Find all admin IDs
        $query = "SELECT user_id FROM users WHERE role = 'admin'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $admins = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($admins as $admin) {
            $this->create($admin['user_id'], $type, $title, $message, $booking_id);
        }
    }
}
