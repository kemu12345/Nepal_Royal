# Royal Nepal - Travel & Tourism Platform

**"Experience the pride of Nepalese"** 🇳🇵

A comprehensive travel and tourism platform exclusively focused on Nepal, offering domestic flights, intercity buses, hotels, tour packages, and a places directory.

---

## 🎯 Project Overview

Royal Nepal is a full-stack web application built for Nepal-centric tourism, featuring:
- **Domestic Transportation**: Flights and buses within Nepal
- **Accommodations**: Hotels, resorts, teahouses across Nepalese destinations
- **Tour Packages**: Curated experiences (trekking, cultural, wildlife, pilgrimage)
- **Places Directory**: Discover Nepalese attractions and heritage sites
- **Unified Booking System**: Book multiple services in a single trip

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript (Fetch API)

### Backend
- **PHP** - Object-Oriented Programming with PDO
- **MySQL** - Highly normalized relational database

---

## 📁 Project Structure

```text
Nepal_Royal/
├── backend/
│   ├── api/                            # REST API endpoints
│   │   ├── register.php               # User registration
│   │   ├── login.php                  # User login
│   │   ├── logout.php                 # User logout
│   │   ├── get-csrf-token.php         # CSRF token generator
│   │   ├── get_flights.php            # Flight search/listing
│   │   ├── get_buses.php              # Bus search/listing
│   │   ├── get_hotels.php             # Hotel search/listing
│   │   ├── get_packages.php           # Tour packages listing
│   │   ├── get_places.php             # Places directory
│   │   ├── get_locations.php          # Nepal locations
│   │   ├── create_booking.php         # Booking creation
│   │   ├── get_user_bookings.php      # User booking history
│   │   ├── get_inventory.php          # Admin inventory fetch
│   │   └── manage_inventory.php       # Admin inventory CRUD
│   ├── classes/                        # PHP domain classes
│   │   ├── User.php
│   │   ├── Flight.php
│   │   ├── Bus.php
│   │   ├── Hotel.php
│   │   ├── Package.php
│   │   ├── Place.php
│   │   └── Location.php
│   ├── config/                         # Configuration files
│   │   ├── database.php                # PDO database connection
│   │   └── config.php                  # App settings & constants
│   ├── database/                       # Database schema & seed data
│   │   ├── schema.sql                  # Complete DB structure (20 tables)
│   │   ├── seed_data.sql               # Nepal-specific sample data
│   │   └── README.md                   # Database documentation
│   └── middleware/
│       └── CSRFToken.php               # CSRF validation middleware
│
└── frontend/
		├── pages/                          # HTML pages
		│   ├── home.html
		│   ├── explore.html
		│   ├── flights.html
		│   ├── buses.html
		│   ├── hotels.html
		│   ├── packages.html
		│   ├── login.html
		│   ├── register.html
		│   ├── dashboard.html
		│   └── admin-dashboard.html
		├── css/                            # Stylesheets
		│   ├── main.css
		│   ├── auth.css
		│   ├── dashboard.css
		│   └── home.css
		├── js/                             # JavaScript files
		│   ├── main.js
		│   ├── auth.js
		│   ├── home.js
		│   ├── explore.js
		│   ├── flights.js
		│   ├── buses.js
		│   ├── hotels.js
		│   ├── packages.js
		│   └── admin.js
```

---

## 🗄️ Database Architecture

### Core Tables (20 tables)
1. **users** - User accounts (customers, vendors, admins)
2. **locations** - Nepal-specific cities, districts, trekking areas
3. **airlines** - Domestic airlines
4. **domestic_flights** - Flight schedules
5. **bus_operators** - Bus companies
6. **buses** - Bus routes
7. **hotels** - Accommodation facilities
8. **hotel_rooms** - Room types and pricing
9. **tour_packages** - Curated travel packages
10. **package_locations** - Package itinerary mapping
11. **places** - Tourist attractions directory
12. **bookings** - Master booking table
13. **flight_bookings** - Flight booking details
14. **bus_bookings** - Bus booking details
15. **hotel_bookings** - Hotel booking details
16. **package_bookings** - Package booking details
17. **wishlists** - User saved items
18. **reviews** - Ratings and reviews
19. **notifications** - User notifications
20. **admin_logs** - Admin activity tracking

---

## 🚀 Installation & Setup

### Prerequisites
- PHP 7.4+ with PDO extension
- MySQL 5.7+ or MariaDB
- Web server (Apache/Nginx) or PHP built-in server
- Modern browser

### Step 1: Clone Repository
```bash
git clone https://github.com/kemu12345/Nepal_Royal.git
cd Nepal_Royal
```

### Step 2: Database Setup
```bash
# Create database and import schema
mysql -u root -p < backend/database/schema.sql

# Load sample data (optional)
mysql -u root -p royal_nepal < backend/database/seed_data.sql
```

### Step 3: Configure Database Connection
Edit `backend/config/database.php`:
```php
private $host = "localhost";
private $db_name = "royal_nepal";
private $username = "your_db_username";
private $password = "your_db_password";
```

### Step 4: Update Configuration
Edit `backend/config/config.php`:
- Set production error reporting
- Update `BASE_URL` and `API_BASE_URL`
- Change `JWT_SECRET_KEY` for production
- Enable HTTPS for production (`session.cookie_secure`)

### Step 5: Set Permissions
```bash
# Make logs directory writable
mkdir -p backend/logs
chmod 777 backend/logs
```

### Step 6: Access Application

If using PHP built-in server from project root:
```bash
php -S localhost:8000
```

- **Frontend**: `http://localhost:8000/frontend/pages/home.html`
- **Login Page**: `http://localhost:8000/frontend/pages/login.html`
- **Admin Panel**: `http://localhost:8000/frontend/pages/admin-dashboard.html`

---

## 👤 Demo Accounts

- Admin: admin@royalnepal.com / admin123
- User: user@example.com / admin123


---

## 🔌 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/register.php` | POST | User registration |
| `/backend/api/login.php` | POST | User login |
| `/backend/api/logout.php` | POST | User logout |
| `/backend/api/get-csrf-token.php` | GET | Generate CSRF token |

### Listings & Discovery
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/get_flights.php` | GET | Flight search/listing |
| `/backend/api/get_buses.php` | GET | Bus search/listing |
| `/backend/api/get_hotels.php` | GET | Hotel search/listing |
| `/backend/api/get_packages.php` | GET | Packages listing |
| `/backend/api/get_places.php` | GET | Places directory |
| `/backend/api/get_locations.php` | GET | Nepal locations |

### Bookings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/create_booking.php` | POST | Create new booking |
| `/backend/api/get_user_bookings.php` | GET | Get user booking history |

### Admin Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/get_inventory.php` | GET | Get inventory data |
| `/backend/api/manage_inventory.php` | POST | Create inventory item |
| `/backend/api/manage_inventory.php` | PUT | Update inventory item |
| `/backend/api/manage_inventory.php` | DELETE | Delete inventory item |

### Request/Response Format

**Register Request:**
```json
{
	"first_name": "John",
	"last_name": "Doe",
	"email": "john@example.com",
	"phone": "+977-9800000000",
	"password": "password123",
	"csrf_token": "..."
}
```

**Login Request:**
```json
{
	"email": "john@example.com",
	"password": "password123",
	"csrf_token": "..."
}
```

**Success Response:**
```json
{
	"success": true,
	"message": "Login successful",
	"data": {
		"user_id": 1,
		"email": "john@example.com",
		"first_name": "John",
		"last_name": "Doe",
		"role": "user"
	}
}
```

---

## 🎨 Design System

### Color Palette (Nepal-inspired)
- **Primary Red**: `#DC143C` (Nepal flag crimson)
- **Secondary Blue**: `#003893` (Nepal flag blue)
- **Accent Gold**: `#FFD700` (Royal/heritage)
- **Success Green**: `#28a745`
- **Error Red**: `#dc3545`

### Typography
- **Font Family**: System fonts (Apple, Segoe UI, Roboto)
- **Base Size**: 16px
- **Line Height**: 1.6

---

## 🌍 Nepal-Specific Features

### Sample Locations Included
- **Cultural Capitals**: Kathmandu, Bhaktapur, Lalitpur
- **Adventure Hubs**: Pokhara, Everest Region, Annapurna
- **Wildlife Retreats**: Chitwan, Bardiya
- **Pilgrimage Sites**: Lumbini, Muktinath, Janakpur
- **Hill Stations**: Nagarkot, Bandipur, Dhulikhel

### Currency Support
- **NPR** (Nepalese Rupee) - Primary
- **USD** (US Dollar) - Alternative

---

## 🔒 Security Features

- **Password Hashing**: PHP `password_hash()` with `PASSWORD_BCRYPT`
- **SQL Injection Prevention**: PDO prepared statements
- **XSS Protection**: Input sanitization with `htmlspecialchars()`
- **CSRF Protection**: Signed + expiring CSRF tokens (with session compatibility)
- **Input Validation**: Server-side and client-side
- **Session Security**: HTTP-only cookies, secure flags

---

## 📝 Next Development Steps

### Upcoming Priorities
- [ ] Payment integration (for Nepal)
- [ ] Booking cancellation/refund workflow
- [ ] Booking confirmation emails/SMS
- [ ] Admin analytics and reports improvements
- [ ] Automated test coverage (API + frontend smoke tests)

---

## 🤝 Contributing

This is a portfolio project. For suggestions or improvements:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

This project is for educational and portfolio purposes.

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Contact: saileshkumar2061@gmail.com
- Contact: kemukafle@gmail.com

---

**Royal Nepal** - *Experience the pride of Nepalese* 🏔️🇳🇵