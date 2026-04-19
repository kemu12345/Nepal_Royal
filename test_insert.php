<?php
include_once 'backend/config/config.php';
include_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "INSERT INTO domestic_flights
          (airline_id, flight_number, origin_location_id, destination_location_id,
           departure_time, arrival_time, duration_minutes, aircraft_type,
           total_seats, available_seats, base_price, currency, operates_on_days, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $db->prepare($query);
try {
    $stmt->execute([
        1,
        'TEST-123',
        1,
        2,
        '09:00:00',
        '10:00:00',
        60,
        null,
        40,
        40,
        5000,
        'NPR',
        'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        1
    ]);
    echo "Success! Flight ID: " . $db->lastInsertId() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
