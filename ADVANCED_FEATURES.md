# Royal Nepal - Advanced Features Status (Updated: 2026-04-13)

## Overview

This document reflects the current implemented state of the Royal Nepal platform based on the code in this repository.

## Current Build Snapshot

| Area | Implemented |
|------|-------------|
| Backend API endpoints | 14 |
| Backend domain classes | 7 |
| Frontend pages | 10 |
| Frontend JavaScript modules | 9 |
| Frontend CSS stylesheets | 4 |
| Database tables | 20 |

## Implemented Backend Features

### Domain Modules (OOP PHP)

- User management: `User.php`
- Flights: `Flight.php`
- Buses: `Bus.php`
- Hotels: `Hotel.php`
- Tour packages: `Package.php`
- Places directory: `Place.php`
- Nepal location catalog: `Location.php`

### API Surface (14 Endpoints)

- Authentication and session
- `POST /api/register.php`
- `POST /api/login.php`
- `POST /api/logout.php`
- `GET /api/get-csrf-token.php`
- Discovery and listing
- `GET /api/get_flights.php`
- `GET /api/get_buses.php`
- `GET /api/get_hotels.php`
- `GET /api/get_packages.php`
- `GET /api/get_places.php`
- `GET /api/get_locations.php`
- Booking and account
- `POST /api/create_booking.php`
- `GET /api/get_user_bookings.php`
- Admin inventory
- `GET /api/get_inventory.php`
- `POST|PUT|DELETE /api/manage_inventory.php`

### Booking Engine

- Transactional booking creation for 4 booking types: flight, bus, hotel, package.
- Auto-calculates totals per item type and quantity.
- Generates booking references (`RN` prefix).
- Writes to master `bookings` plus type-specific booking detail tables.
- Automatically decrements available seats/rooms where applicable.

### Admin Inventory Management

- Central inventory query endpoint with type scoping (`all`, `flight`, `bus`, `hotel`, `package`, `place`).
- CRUD management endpoint for flights, buses, hotels, packages, and places.
- Support payloads for admin forms (airlines, operators, locations).

## Implemented Frontend Features

### Pages (10)

- Public: `home.html`, `explore.html`, `flights.html`, `buses.html`, `hotels.html`, `packages.html`
- Auth and user: `login.html`, `register.html`, `dashboard.html`
- Admin: `admin-dashboard.html`

### JavaScript Modules (9)

- Core and auth: `main.js`, `auth.js`
- Feature pages: `home.js`, `explore.js`, `flights.js`, `buses.js`, `hotels.js`, `packages.js`
- Admin: `admin.js`

### UX Behaviors

- Form-level validation for auth workflows.
- Loading and error/success messaging patterns.
- Role-based redirects after login.
- Dynamic API base URL handling for local development (`localhost`/`127.0.0.1` consistency).

## Security Features in Place

- Password hashing using bcrypt.
- Prepared statements with PDO for SQL injection resistance.
- Input sanitization for request data.
- Session-based authentication checks on protected endpoints.
- CSRF token flow with signed, expiring token format and session-token compatibility fallback.
- Admin-only authorization guard for inventory management endpoints.

## Database and Data Model

- 20-table schema with normalized relationships.
- Dedicated booking detail tables per booking type.
- Foreign-key constraints and indexed query paths.
- Nepal-centric seeded data for locations, routes, and tourism inventory.
- Currency columns support NPR and USD where applicable.

## Advanced Capability Highlights

- Unified multi-service booking backend (flight/bus/hotel/package).
- Inventory operations exposed through role-protected API.
- Search/listing APIs split by domain for modular frontend pages.
- Nepal-focused data model including domestic routes, attractions, and package categories.

## Current Gaps / Next Priority Enhancements

- Payment integration (eSewa/Khalti) and payment status callbacks.
- Booking cancellation/refund workflow and seat/room restoration logic.
- Email/SMS confirmations and notification delivery.
- Automated tests (API and frontend smoke tests).
- Production hardening: rate limiting, audit expansion, and observability.

## Status Summary

Royal Nepal is beyond a basic prototype and now includes an integrated booking flow, admin inventory controls, modular discovery APIs, and a security foundation suitable for further production hardening.
