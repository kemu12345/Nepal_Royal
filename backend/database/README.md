# Royal Nepal Database Schema

## Overview
This directory contains the complete MySQL database schema for the **Royal Nepal** travel and tourism platform.

## Files

### 1. schema.sql
The complete database schema including:
- **20 normalized tables** with proper relationships
- Foreign key constraints
- Indexes for optimal query performance
- Data validation using CHECK constraints
- Support for UTF-8 (including Nepali characters)

### 2. seed_data.sql
Sample data for development and testing:
- Popular Nepalese destinations (cities, districts, trekking areas)
- Domestic airlines and flight schedules
- Bus operators and routes
- Sample hotels and accommodations
- Curated tour packages
- Tourist attractions and heritage sites
- Demo user accounts (admin, vendor, user)

## Database Tables Structure

### Core Tables
1. **users** - User accounts (customers, vendors, admins)
2. **locations** - Nepal-specific geographic locations
3. **airlines** - Domestic airlines operating in Nepal
4. **domestic_flights** - Flight schedules and availability
5. **bus_operators** - Intercity bus companies
6. **buses** - Bus routes and schedules
7. **hotels** - Accommodation facilities
8. **hotel_rooms** - Room types and pricing
9. **tour_packages** - Curated travel packages
10. **package_locations** - Package itinerary mapping
11. **places** - Tourist attractions directory

### Booking Tables
12. **bookings** - Unified booking system
13. **flight_bookings** - Flight booking details
14. **bus_bookings** - Bus booking details
15. **hotel_bookings** - Hotel booking details
16. **package_bookings** - Package booking details

### Supporting Tables
17. **wishlists** - User saved items
18. **reviews** - User ratings and reviews
19. **notifications** - User notification system
20. **admin_logs** - Admin activity tracking

## Installation Instructions

### Step 1: Create the Database
```bash
mysql -u root -p < schema.sql
```

### Step 2: Load Sample Data (Optional)
```bash
mysql -u root -p royal_nepal < seed_data.sql
```

### Step 3: Verify Installation
```sql
USE royal_nepal;
SHOW TABLES;
SELECT COUNT(*) FROM locations;
SELECT COUNT(*) FROM domestic_flights;
```

## Default Credentials (Seed Data)

**Admin Account:**
- Email: admin@royalnepal.com
- Password: admin123
- Role: admin

**Vendor Account:**
- Email: vendor@example.com
- Password: admin123
- Role: vendor

**User Account:**
- Email: user@example.com
- Password: admin123
- Role: user

⚠️ **IMPORTANT:** Change all default passwords before deploying to production!

## Key Features

### Geographic Scope
All locations are **strictly within Nepal**:
- Major cities: Kathmandu, Pokhara, Chitwan
- Trekking regions: Everest, Annapurna, Mustang
- Pilgrimage sites: Lumbini, Muktinath, Janakpur
- Hill stations: Nagarkot, Bandipur, Dhulikhel

### Currency Support
- NPR (Nepalese Rupee) - Primary
- USD (US Dollar) - Alternative

### Booking System
Unified booking architecture supporting:
- Single item bookings (flight, bus, hotel, package)
- Combined bookings (multiple services in one trip)
- Status tracking (pending, confirmed, cancelled, completed)
- Payment tracking (unpaid, paid, partial, refunded)

## Database Design Principles

1. **Normalization**: Highly normalized structure (3NF) to minimize redundancy
2. **Referential Integrity**: All foreign keys with appropriate CASCADE/RESTRICT rules
3. **Performance**: Strategic indexes on frequently queried columns
4. **Data Validation**: CHECK constraints for business rules
5. **Scalability**: JSON columns for flexible data (passenger details, galleries)
6. **Audit Trail**: Timestamps and admin logs for tracking changes

## Schema Highlights

### Advanced Features
- **SET types** for multi-value columns (amenities, operating days)
- **ENUM types** for controlled vocabularies (roles, status)
- **JSON columns** for flexible structured data (itineraries, galleries)
- **Composite indexes** for complex queries
- **Unique constraints** preventing duplicate data

### Data Integrity
- Prevents booking flights/buses from same origin-destination
- Ensures checkout date after check-in date
- Validates seat availability against total capacity
- Enforces rating ranges (0.0 to 5.0)

## Sample Queries

### Search flights from Kathmandu to Pokhara
```sql
SELECT df.*, a.airline_name, l1.location_name as origin, l2.location_name as destination
FROM domestic_flights df
JOIN airlines a ON df.airline_id = a.airline_id
JOIN locations l1 ON df.origin_location_id = l1.location_id
JOIN locations l2 ON df.destination_location_id = l2.location_id
WHERE l1.location_name = 'Kathmandu'
AND l2.location_name = 'Pokhara'
AND df.is_active = TRUE
ORDER BY df.base_price ASC;
```

### Get all trekking packages
```sql
SELECT * FROM tour_packages
WHERE package_type = 'trekking'
AND is_active = TRUE
ORDER BY duration_days ASC;
```

### Find hotels in Pokhara with ratings above 4.0
```sql
SELECT h.*, l.location_name
FROM hotels h
JOIN locations l ON h.location_id = l.location_id
WHERE l.location_name = 'Pokhara'
AND h.star_rating >= 4.0
AND h.is_active = TRUE;
```

## Maintenance

### Regular Tasks
- Monitor and optimize slow queries
- Archive old bookings periodically
- Update available seats/rooms after bookings
- Clean up expired notifications
- Backup database regularly

### Performance Optimization
- Analyze query execution plans
- Add indexes based on actual usage patterns
- Partition large tables if needed
- Implement caching at application layer

## Support

For database-related issues or questions:
- Review the schema comments in schema.sql
- Check foreign key relationships
- Verify indexes are being used in queries
- Ensure proper character encoding (UTF-8)

---

**Royal Nepal** - Experience the pride of Nepalese 🇳🇵
