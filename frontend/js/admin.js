/*
    Admin Dashboard JavaScript
    Handles section switching, button clicks, data loading from the API, and form submissions.
*/

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is an admin
    RoyalNepal.requireAuth('admin');

    initializeEventListeners();
    loadDashboardStats();
});

/**
 * Initialize all event listeners for buttons and navigation
 */
function initializeEventListeners() {
    // Sidebar navigation - section switching
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Quick action buttons
    const actionButtons = document.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

/**
 * Switch to a different section and load its data
 */
function switchSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(`section-${sectionName}`);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update sidebar active state
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Update page title
    updatePageTitle(sectionName);

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }

    // Load data for the section that was just activated
    switch (sectionName) {
        case 'users':
            loadUsersTable();
            break;
        case 'flights':
            loadInventoryTable('flight', 'flightsTableBody', renderFlightRow);
            break;
        case 'buses':
            loadInventoryTable('bus', 'busesTableBody', renderBusRow);
            break;
        case 'hotels':
            loadInventoryTable('hotel', 'hotelsTableBody', renderHotelRow);
            break;
        case 'packages':
            loadInventoryTable('package', 'packagesTableBody', renderPackageRow);
            break;
        case 'places':
            loadInventoryTable('place', 'placesTableBody', renderPlaceRow);
            break;
        case 'bookings':
            loadBookingsTable();
            break;
    }
}

/**
 * Update the page title based on current section
 */
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users': 'Users Management',
        'flights': 'Flights Management',
        'buses': 'Buses Management',
        'hotels': 'Hotels Management',
        'packages': 'Packages Management',
        'places': 'Places Management',
        'bookings': 'Bookings Management'
    };

    if (pageTitle && titles[section]) {
        pageTitle.textContent = titles[section];
    }
}

/**
 * Toggle sidebar visibility on mobile
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Load and display dashboard statistics from the API
 */
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_admin_stats.php`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to load stats:', data.message);
            return;
        }

        const { stats, recent_bookings } = data;

        const totalUsers    = document.getElementById('totalUsers');
        const totalBookings = document.getElementById('totalBookings');
        const totalFlights  = document.getElementById('totalFlights');
        const totalHotels   = document.getElementById('totalHotels');

        if (totalUsers)    totalUsers.textContent    = stats.total_users;
        if (totalBookings) totalBookings.textContent = stats.total_bookings;
        if (totalFlights)  totalFlights.textContent  = stats.total_flights;
        if (totalHotels)   totalHotels.textContent   = stats.total_hotels;

        // Populate the recent bookings table on the dashboard section
        renderRecentBookings(recent_bookings);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Render recent bookings into the dashboard overview table
 */
function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookings');
    if (!tbody) return;

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings yet</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td>${escapeHtml(b.booking_reference)}</td>
            <td>${escapeHtml(b.first_name)} ${escapeHtml(b.last_name)}</td>
            <td>${capitalize(b.booking_type)}</td>
            <td>${formatAdminCurrency(b.total_amount, b.currency)}</td>
            <td><span class="badge-status status-${b.booking_status}">${capitalize(b.booking_status)}</span></td>
            <td>${formatAdminDate(b.booking_date)}</td>
        </tr>
    `).join('');
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Load and display all users in the users management table
 */
async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/get_all_users.php`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${escapeHtml(data.message)}</td></tr>`;
            return;
        }

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map(u => `
            <tr>
                <td>${u.user_id}</td>
                <td>${escapeHtml(u.first_name)} ${escapeHtml(u.last_name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.phone || '—')}</td>
                <td>${capitalize(u.role)}</td>
                <td><span class="badge-status ${u.is_active ? 'status-confirmed' : 'status-cancelled'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><small>${formatAdminDate(u.created_at)}</small></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load users</td></tr>';
    }
}

// ─── Inventory ────────────────────────────────────────────────────────────────

/**
 * Generic inventory loader – fetches data from get_inventory.php and renders rows.
 * @param {string}   type    - Inventory type: 'flight'|'bus'|'hotel'|'package'|'place'
 * @param {string}   tbodyId - ID of the <tbody> element to populate
 * @param {Function} rowFn   - Function that receives one item and returns an HTML string
 */
async function loadInventoryTable(type, tbodyId, rowFn) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const colCount = tbody.closest('table').querySelectorAll('thead th').length;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">Loading...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/get_inventory.php?type=${type}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center text-danger">${escapeHtml(data.message)}</td></tr>`;
            return;
        }

        const items = Array.isArray(data.items) ? data.items : [];

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">No ${type}s found</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(rowFn).join('');

    } catch (error) {
        console.error(`Error loading ${type}s:`, error);
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center text-danger">Failed to load ${type}s</td></tr>`;
    }
}

/** Render a single flight row */
function renderFlightRow(f) {
    return `<tr>
        <td>${f.flight_id}</td>
        <td>${escapeHtml(f.airline_name || '—')}</td>
        <td>${escapeHtml(f.origin_name || '—')}</td>
        <td>${escapeHtml(f.destination_name || '—')}</td>
        <td>${escapeHtml(f.departure_time || '—')}</td>
        <td>${formatAdminCurrency(f.base_price, f.currency)}</td>
        <td>${f.available_seats}</td>
        <td><span class="badge-status ${f.is_active ? 'status-confirmed' : 'status-cancelled'}">${f.is_active ? 'Active' : 'Inactive'}</span></td>
    </tr>`;
}

/** Render a single bus row */
function renderBusRow(b) {
    return `<tr>
        <td>${b.bus_id}</td>
        <td>${escapeHtml(b.operator_name || '—')}</td>
        <td>${escapeHtml(b.origin_name || '—')}</td>
        <td>${escapeHtml(b.destination_name || '—')}</td>
        <td>${escapeHtml(b.departure_time || '—')}</td>
        <td>${formatAdminCurrency(b.base_price, b.currency)}</td>
        <td>${b.available_seats}</td>
        <td><span class="badge-status ${b.is_active ? 'status-confirmed' : 'status-cancelled'}">${b.is_active ? 'Active' : 'Inactive'}</span></td>
    </tr>`;
}

/** Render a single hotel row */
function renderHotelRow(h) {
    return `<tr>
        <td>${h.hotel_id}</td>
        <td>${escapeHtml(h.hotel_name)}</td>
        <td>${escapeHtml(h.location_name || '—')}</td>
        <td>${h.star_rating ? '⭐'.repeat(h.star_rating) : '—'}</td>
        <td>—</td>
        <td>—</td>
        <td><span class="badge-status ${h.is_active ? 'status-confirmed' : 'status-cancelled'}">${h.is_active ? 'Active' : 'Inactive'}</span></td>
        <td></td>
    </tr>`;
}

/** Render a single package row */
function renderPackageRow(p) {
    return `<tr>
        <td>${p.package_id}</td>
        <td>${escapeHtml(p.package_name)}</td>
        <td>${p.duration_days} days</td>
        <td>${formatAdminCurrency(p.base_price, p.currency)}</td>
        <td>${escapeHtml(p.destinations || '—')}</td>
        <td>${p.available_slots !== undefined ? p.available_slots : '—'}</td>
        <td><span class="badge-status ${p.is_active ? 'status-confirmed' : 'status-cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
        <td></td>
    </tr>`;
}

/** Render a single place row */
function renderPlaceRow(pl) {
    return `<tr>
        <td>${pl.place_id}</td>
        <td>${escapeHtml(pl.place_name)}</td>
        <td>${escapeHtml(pl.province || pl.location_name || '—')}</td>
        <td>${pl.altitude_meters ? Number(pl.altitude_meters).toLocaleString() : '—'}</td>
        <td>${pl.latitude && pl.longitude ? `${pl.latitude}, ${pl.longitude}` : '—'}</td>
        <td>${pl.description ? escapeHtml(pl.description.substring(0, 60)) + '…' : '—'}</td>
        <td></td>
    </tr>`;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

/**
 * Load and display all bookings in the bookings management table
 */
async function loadBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/get_all_bookings.php`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${escapeHtml(data.message)}</td></tr>`;
            return;
        }

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No bookings found</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map(b => `
            <tr>
                <td>${escapeHtml(b.booking_reference)}</td>
                <td>${escapeHtml(b.first_name)} ${escapeHtml(b.last_name)}</td>
                <td>${capitalize(b.booking_type)}</td>
                <td>${formatAdminCurrency(b.total_amount, b.currency)}</td>
                <td>${formatAdminDate(b.booking_date)}</td>
                <td>—</td>
                <td><span class="badge-status status-${b.booking_status}">${capitalize(b.booking_status)}</span></td>
                <td></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading bookings:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to load bookings</td></tr>';
    }
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

/**
 * Handle quick action button clicks
 */
function handleQuickAction(action) {
    const actions = {
        'add-flight':  () => switchSection('flights'),
        'add-bus':     () => switchSection('buses'),
        'add-hotel':   () => switchSection('hotels'),
        'add-package': () => switchSection('packages'),
        'add-place':   () => switchSection('places')
    };

    if (actions[action]) {
        actions[action]();
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Display a message to the user
 */
function showMessage(text, type = 'info') {
    let messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.className = `message-box ${type}`;
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertBefore(messageBox, contentArea.firstChild);
        }
    }

    messageBox.textContent = text;
    messageBox.className = `message-box ${type}`;

    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Capitalise the first letter of a string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a number as a currency string (local helper to avoid conflicts with main.js)
 */
function formatAdminCurrency(amount, currency) {
    currency = currency || 'NPR';
    const num = parseFloat(amount) || 0;
    const formatted = num.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency === 'NPR' ? `रू ${formatted}` : `$${formatted}`;
}

/**
 * Format a date/datetime string into a readable date (local helper)
 */
function formatAdminDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return String(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
