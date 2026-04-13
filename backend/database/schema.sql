-- =====================================================
-- Royal Nepal - Travel and Tourism Platform Database
-- "Experience the pride of Nepalese"
-- =====================================================
-- MySQL Database Schema
-- Designed for comprehensive Nepal-centric travel services
-- =====================================================

-- Drop existing database if exists (use with caution in production)
DROP DATABASE IF EXISTS royal_nepal;

-- Create database with UTF-8 support for Nepali characters
CREATE DATABASE royal_nepal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE royal_nepal;

-- =====================================================
-- TABLE 1: USERS
-- Manages all user accounts (customers, vendors, admins)
-- =====================================================
CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'vendor', 'admin') NOT NULL DEFAULT 'user',
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 2: LOCATIONS
-- Nepal-specific locations (cities, districts, regions)
-- =====================================================
CREATE TABLE locations (
    location_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    location_type ENUM('city', 'district', 'region', 'trekking_area', 'national_park') NOT NULL,
    province VARCHAR(50),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    description TEXT,
    airport_code VARCHAR(10) NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_location (location_name, location_type),
    INDEX idx_location_type (location_type),
    INDEX idx_popular (is_popular),
    INDEX idx_airport (airport_code)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 3: DOMESTIC AIRLINES
-- Airlines operating within Nepal
-- =====================================================
CREATE TABLE airlines (
    airline_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    airline_name VARCHAR(100) NOT NULL UNIQUE,
    airline_code VARCHAR(10) NOT NULL UNIQUE,
    logo_url VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 4: DOMESTIC FLIGHTS
-- Flight schedules and availability
-- =====================================================
CREATE TABLE domestic_flights (
    flight_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    airline_id INT UNSIGNED NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    origin_location_id INT UNSIGNED NOT NULL,
    destination_location_id INT UNSIGNED NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT UNSIGNED NOT NULL,
    aircraft_type VARCHAR(50),
    total_seats INT UNSIGNED NOT NULL DEFAULT 20,
    available_seats INT UNSIGNED NOT NULL DEFAULT 20,
    base_price DECIMAL(10, 2) NOT NULL,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    operates_on_days SET('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id) ON DELETE CASCADE,
    FOREIGN KEY (origin_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    INDEX idx_origin (origin_location_id),
    INDEX idx_destination (destination_location_id),
    INDEX idx_airline (airline_id),
    INDEX idx_active (is_active),
    INDEX idx_price (base_price),
    CHECK (origin_location_id != destination_location_id),
    CHECK (available_seats <= total_seats)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 5: BUS OPERATORS
-- Companies operating intercity buses in Nepal
-- =====================================================
CREATE TABLE bus_operators (
    operator_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operator_name VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    rating DECIMAL(2, 1) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_rating (rating),
    CHECK (rating BETWEEN 0.0 AND 5.0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 6: BUSES
-- Bus schedules and routes within Nepal
-- =====================================================
CREATE TABLE buses (
    bus_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operator_id INT UNSIGNED NOT NULL,
    bus_number VARCHAR(20) NOT NULL,
    origin_location_id INT UNSIGNED NOT NULL,
    destination_location_id INT UNSIGNED NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT UNSIGNED NOT NULL,
    bus_type ENUM('regular', 'deluxe', 'tourist', 'sleeper') NOT NULL DEFAULT 'regular',
    total_seats INT UNSIGNED NOT NULL DEFAULT 40,
    available_seats INT UNSIGNED NOT NULL DEFAULT 40,
    base_price DECIMAL(10, 2) NOT NULL,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    amenities SET('AC', 'WiFi', 'RestRoom', 'Entertainment', 'Meals', 'Blanket') DEFAULT NULL,
    operates_on_days SET('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES bus_operators(operator_id) ON DELETE CASCADE,
    FOREIGN KEY (origin_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    INDEX idx_origin (origin_location_id),
    INDEX idx_destination (destination_location_id),
    INDEX idx_operator (operator_id),
    INDEX idx_bus_type (bus_type),
    INDEX idx_active (is_active),
    INDEX idx_price (base_price),
    CHECK (origin_location_id != destination_location_id),
    CHECK (available_seats <= total_seats)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 7: HOTELS
-- Accommodation facilities across Nepal
-- =====================================================
CREATE TABLE hotels (
    hotel_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT UNSIGNED NULL,
    hotel_name VARCHAR(200) NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    star_rating DECIMAL(2, 1) DEFAULT 0.0,
    hotel_type ENUM('hotel', 'resort', 'teahouse', 'guesthouse', 'lodge') NOT NULL DEFAULT 'hotel',
    amenities SET('WiFi', 'Restaurant', 'Bar', 'Pool', 'Spa', 'Gym', 'Parking', 'Airport_Transfer', 'Room_Service', 'Laundry') DEFAULT NULL,
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '12:00:00',
    contact_number VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    INDEX idx_location (location_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_hotel_type (hotel_type),
    INDEX idx_rating (star_rating),
    INDEX idx_active (is_active),
    CHECK (star_rating BETWEEN 0.0 AND 5.0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 8: HOTEL ROOMS
-- Different room types within each hotel
-- =====================================================
CREATE TABLE hotel_rooms (
    room_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT UNSIGNED NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INT UNSIGNED NOT NULL DEFAULT 2,
    total_rooms INT UNSIGNED NOT NULL DEFAULT 1,
    available_rooms INT UNSIGNED NOT NULL DEFAULT 1,
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    room_amenities SET('AC', 'Heater', 'TV', 'MiniBar', 'Balcony', 'Mountain_View', 'City_View', 'Safe', 'Bathtub') DEFAULT NULL,
    bed_type VARCHAR(50),
    room_size_sqm INT UNSIGNED,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id),
    INDEX idx_available (is_available),
    INDEX idx_price (base_price_per_night),
    CHECK (available_rooms <= total_rooms)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 9: TOUR PACKAGES
-- Curated travel packages showcasing Nepal
-- =====================================================
CREATE TABLE tour_packages (
    package_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(200) NOT NULL,
    package_type ENUM('trekking', 'cultural', 'wildlife', 'adventure', 'pilgrimage', 'heritage', 'combined') NOT NULL,
    description TEXT NOT NULL,
    detailed_itinerary TEXT,
    duration_days INT UNSIGNED NOT NULL,
    duration_nights INT UNSIGNED NOT NULL,
    difficulty_level ENUM('easy', 'moderate', 'challenging', 'extreme') DEFAULT 'moderate',
    group_size_min INT UNSIGNED DEFAULT 1,
    group_size_max INT UNSIGNED DEFAULT 15,
    base_price DECIMAL(10, 2) NOT NULL,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    inclusions TEXT,
    exclusions TEXT,
    best_season VARCHAR(100),
    image_url VARCHAR(255),
    gallery_images JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_package_type (package_type),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_price (base_price),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 10: PACKAGE LOCATIONS
-- Many-to-many relationship between packages and locations
-- =====================================================
CREATE TABLE package_locations (
    package_location_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    day_number INT UNSIGNED,
    sequence_order INT UNSIGNED,
    FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_location (package_id, location_id, day_number),
    INDEX idx_package (package_id),
    INDEX idx_location (location_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 11: PLACES (Exploration Directory)
-- Discover Nepalese attractions and heritage sites
-- =====================================================
CREATE TABLE places (
    place_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    place_name VARCHAR(200) NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    category ENUM('cultural', 'historical', 'religious', 'natural', 'adventure', 'wildlife', 'heritage_site', 'national_park', 'viewpoint') NOT NULL,
    description TEXT NOT NULL,
    history TEXT,
    best_time_to_visit VARCHAR(100),
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    opening_hours VARCHAR(100),
    unesco_site BOOLEAN DEFAULT FALSE,
    altitude_meters INT UNSIGNED,
    image_url VARCHAR(255),
    gallery_images JSON,
    tips_and_guidelines TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    INDEX idx_location (location_id),
    INDEX idx_category (category),
    INDEX idx_unesco (unesco_site),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 12: BOOKINGS
-- Unified booking system for all services
-- =====================================================
CREATE TABLE bookings (
    booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    booking_type ENUM('flight', 'bus', 'hotel', 'package', 'combined') NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'refunded') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    currency ENUM('NPR', 'USD') DEFAULT 'NPR',
    payment_status ENUM('unpaid', 'paid', 'partial', 'refunded') NOT NULL DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    special_requests TEXT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_reference (booking_reference),
    INDEX idx_status (booking_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_date (booking_date),
    INDEX idx_type (booking_type)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 13: FLIGHT BOOKINGS
-- Flight-specific booking details
-- =====================================================
CREATE TABLE flight_bookings (
    flight_booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    flight_id INT UNSIGNED NOT NULL,
    travel_date DATE NOT NULL,
    number_of_passengers INT UNSIGNED NOT NULL DEFAULT 1,
    passenger_details JSON NOT NULL,
    seat_numbers JSON,
    baggage_info JSON,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES domestic_flights(flight_id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_flight (flight_id),
    INDEX idx_travel_date (travel_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 14: BUS BOOKINGS
-- Bus-specific booking details
-- =====================================================
CREATE TABLE bus_bookings (
    bus_booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    bus_id INT UNSIGNED NOT NULL,
    travel_date DATE NOT NULL,
    number_of_passengers INT UNSIGNED NOT NULL DEFAULT 1,
    passenger_details JSON NOT NULL,
    seat_numbers JSON,
    pickup_point VARCHAR(255),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_bus (bus_id),
    INDEX idx_travel_date (travel_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 15: HOTEL BOOKINGS
-- Hotel-specific booking details
-- =====================================================
CREATE TABLE hotel_bookings (
    hotel_booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INT UNSIGNED NOT NULL,
    number_of_rooms INT UNSIGNED NOT NULL DEFAULT 1,
    number_of_guests INT UNSIGNED NOT NULL,
    guest_details JSON NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES hotel_rooms(room_id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_room (room_id),
    INDEX idx_check_in (check_in_date),
    INDEX idx_check_out (check_out_date),
    CHECK (check_out_date > check_in_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 16: PACKAGE BOOKINGS
-- Tour package booking details
-- =====================================================
CREATE TABLE package_bookings (
    package_booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    package_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_travelers INT UNSIGNED NOT NULL,
    traveler_details JSON NOT NULL,
    customizations TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES tour_packages(package_id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_package (package_id),
    INDEX idx_start_date (start_date),
    CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 17: WISHLISTS
-- User saved places and packages
-- =====================================================
CREATE TABLE wishlists (
    wishlist_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    item_type ENUM('place', 'package', 'hotel') NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, item_type, item_id),
    INDEX idx_user (user_id),
    INDEX idx_item_type (item_type)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 18: REVIEWS AND RATINGS
-- User reviews for hotels, packages, and services
-- =====================================================
CREATE TABLE reviews (
    review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    item_type ENUM('hotel', 'package', 'bus', 'flight', 'place') NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    booking_id INT UNSIGNED NULL,
    rating DECIMAL(2, 1) NOT NULL,
    title VARCHAR(200),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_item (item_type, item_id),
    INDEX idx_rating (rating),
    INDEX idx_verified (is_verified),
    INDEX idx_created (created_at),
    CHECK (rating BETWEEN 1.0 AND 5.0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 19: NOTIFICATIONS
-- User notifications system
-- =====================================================
CREATE TABLE notifications (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    notification_type ENUM('booking', 'payment', 'promotion', 'reminder', 'update') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_booking_id INT UNSIGNED NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE 20: ADMIN LOGS
-- Activity tracking for admin actions
-- =====================================================
CREATE TABLE admin_logs (
    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT UNSIGNED NOT NULL,
    action_type ENUM('create', 'update', 'delete', 'approve', 'reject') NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT UNSIGNED NOT NULL,
    action_details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_admin (admin_user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- END OF SCHEMA CREATION
-- =====================================================
