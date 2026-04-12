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
- **HTML5** - Semantic markup
- **CSS3** - Nepalese-themed design (red, blue, gold color palette)
- **Vanilla JavaScript** - No frameworks, pure JS with `fetch()` API

### Backend
- **PHP** - Object-Oriented Programming with PDO
- **MySQL** - Highly normalized relational database

---

## 📁 Project Structure

```
Portfolios/
├── backend/
│   ├── api/                    # REST API endpoints
│   │   ├── login.php          # User login
│   │   ├── register.php       # User registration
│   │   └── logout.php         # User logout
│   ├── classes/               # PHP classes
│   │   └── User.php          # User authentication & management
│   ├── config/                # Configuration files
│   │   ├── database.php      # PDO database connection
│   │   └── config.php        # App settings & constants
│   └── database/              # Database schema & seed data
│       ├── schema.sql        # Complete DB structure (20 tables)
│       ├── seed_data.sql     # Nepal-specific sample data
│       └── README.md         # Database documentation
│
└── frontend/
    ├── pages/                 # HTML pages
    │   ├── login.html        # User login page
    │   ├── register.html     # User registration page
    │   ├── dashboard.html    # User dashboard
    │   └── admin-dashboard.html  # Admin panel
    ├── css/                   # Stylesheets
    │   ├── main.css          # Global styles & Nepalese theme
    │   ├── auth.css          # Authentication pages styles
    │   └── dashboard.css     # Dashboard layouts
    ├── js/                    # JavaScript files
    │   ├── main.js           # Common utilities & functions
    │   ├── auth.js           # Authentication logic
    │   └── admin.js          # Admin panel functionality
    └── assets/               # Static assets
        └── images/           # Images and media
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
- Web server (Apache/Nginx)
- Modern browser

### Step 1: Clone Repository
```bash
cd /path/to/webserver/root
git clone https://github.com/hazratansari004/Portfolios.git
cd Portfolios
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
- **Frontend**: `http://localhost/Portfolios/frontend/pages/`
- **Login Page**: `http://localhost/Portfolios/frontend/pages/login.html`
- **Admin Panel**: `http://localhost/Portfolios/frontend/pages/admin-dashboard.html`

---

## 👤 Demo Accounts

### Admin Account
- **Email**: `admin@royalnepal.com`
- **Password**: `admin123`
- **Role**: Admin

### Vendor Account
- **Email**: `vendor@example.com`
- **Password**: `admin123`
- **Role**: Vendor

### User Account
- **Email**: `user@example.com`
- **Password**: `admin123`
- **Role**: User

⚠️ **Important**: Change all default passwords before production deployment!

---

## 🔌 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backend/api/register.php` | POST | User registration |
| `/backend/api/login.php` | POST | User login |
| `/backend/api/logout.php` | POST | User logout |

### Request/Response Format

**Register Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+977-9800000000",
  "password": "password123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
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
- **CSRF Protection**: Session-based validation
- **Input Validation**: Server-side and client-side
- **Session Security**: HTTP-only cookies, secure flags

---

## 📝 Next Development Steps

### Phase 2: Search & Booking
- [ ] Flight search API endpoint
- [ ] Bus search API endpoint
- [ ] Hotel search API endpoint
- [ ] Package listing API
- [ ] Places directory API
- [ ] Frontend search pages

### Phase 3: Booking System
- [ ] Create booking API
- [ ] Payment integration (eSewa, Khalti for Nepal)
- [ ] Booking confirmation emails
- [ ] Booking management dashboard

### Phase 4: Admin Features
- [ ] CRUD operations for flights, buses, hotels
- [ ] Package management
- [ ] User management
- [ ] Booking management
- [ ] Analytics and reports

### Phase 5: Enhancement
- [ ] Reviews and ratings system
- [ ] Wishlist functionality
- [ ] Notifications system
- [ ] Image upload for users/vendors
- [ ] Email verification
- [ ] Password reset

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
- Contact: [Your Email/Contact]

---

**Royal Nepal** - *Experience the pride of Nepalese* 🏔️🇳🇵
