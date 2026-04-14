/*
    Admin Dashboard JavaScript
    Handles section switching, data loading from APIs, and form submissions.
*/

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is an admin
    RoyalNepal.requireAuth('admin');

    initializeEventListeners();
    loadDashboardStats();
    loadRecentBookings();
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
            const action = e.target.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

/**
 * Switch to a different section and load its data
 */
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(`section-${sectionName}`);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update sidebar active state
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
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

    // Load section-specific data
    switch (sectionName) {
        case 'users':    loadUsers();       break;
        case 'flights':  loadFlights();     break;
        case 'buses':    loadBuses();       break;
        case 'hotels':   loadHotels();      break;
        case 'packages': loadPackages();    break;
        case 'places':   loadPlaces();      break;
        case 'bookings': loadAllBookings(); break;
    }
}

/**
 * Update the page title based on current section
 */
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users':     'Users Management',
        'flights':   'Flights Management',
        'buses':     'Buses Management',
        'hotels':    'Hotels Management',
        'packages':  'Packages Management',
        'places':    'Places Management',
        'bookings':  'Bookings Management'
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

/**
 * Load and display dashboard statistics from the API
 */
async function loadDashboardStats() {
    try {
        const data = await RoyalNepal.apiRequest('get_admin_stats.php');
        if (data.success) {
            const s = data.data;
            setElementText('totalUsers',    s.total_users);
            setElementText('totalBookings', s.total_bookings);
            setElementText('totalFlights',  s.total_flights);
            setElementText('totalHotels',   s.total_hotels);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Load recent bookings for the dashboard overview section
 */
async function loadRecentBookings() {
    const tbody = document.getElementById('recentBookings');
    if (!tbody) return;

    try {
        const data = await RoyalNepal.apiRequest('get_all_bookings.php');
        if (!data.success) {
            renderTableMessage(tbody, 6, data.message || 'Failed to load bookings');
            return;
        }

        const bookings = data.data.slice(0, 5); // show last 5
        if (bookings.length === 0) {
            renderTableMessage(tbody, 6, 'No bookings yet');
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>#${b.booking_reference}</td>
                <td>${escapeHtml(b.first_name + ' ' + b.last_name)}</td>
                <td>${capitalize(b.booking_type)}</td>
                <td>${RoyalNepal.formatCurrency(b.total_amount, b.currency)}</td>
                <td><span class="badge-status ${b.booking_status}">${capitalize(b.booking_status)}</span></td>
                <td>${RoyalNepal.formatDate(b.booking_date)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent bookings:', error);
        renderTableMessage(tbody, 6, 'Error loading bookings');
    }
}

// ── Section data loaders ───────────────────────────────────────────────────

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 7, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_users.php');
        if (!data.success) {
            renderTableMessage(tbody, 7, data.message || 'Failed to load users');
            return;
        }

        if (data.data.length === 0) {
            renderTableMessage(tbody, 7, 'No users found');
            return;
        }

        tbody.innerHTML = data.data.map(u => `
            <tr>
                <td>#${u.user_id}</td>
                <td>${escapeHtml(u.first_name + ' ' + u.last_name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.phone || '—')}</td>
                <td><span class="badge-role ${u.role}">${capitalize(u.role)}</span></td>
                <td><span class="badge-status ${u.is_active ? 'confirmed' : 'cancelled'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary toggle-user-btn"
                            data-user-id="${u.user_id}"
                            data-new-status="${u.is_active ? 0 : 1}">
                        ${u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach click handlers after rendering to avoid inline event handlers
        tbody.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId    = parseInt(btn.getAttribute('data-user-id'), 10);
                const newStatus = parseInt(btn.getAttribute('data-new-status'), 10);
                toggleUserStatus(userId, newStatus);
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
        renderTableMessage(tbody, 7, 'Error loading users');
    }
}

async function loadFlights() {
    const tbody = document.getElementById('flightsTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 8, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_inventory.php?type=flight');
        if (!data.success) {
            renderTableMessage(tbody, 8, data.message || 'Failed to load flights');
            return;
        }

        const flights = data.items;
        if (!flights || flights.length === 0) {
            renderTableMessage(tbody, 8, 'No flights found');
            return;
        }

        tbody.innerHTML = flights.map(f => `
            <tr>
                <td>#${f.flight_id}</td>
                <td>${escapeHtml(f.airline_name || '—')}</td>
                <td>${escapeHtml(f.origin_name || '—')}</td>
                <td>${escapeHtml(f.destination_name || '—')}</td>
                <td>${f.departure_time}</td>
                <td>${RoyalNepal.formatCurrency(f.base_price, f.currency)}</td>
                <td>${f.available_seats} / ${f.total_seats}</td>
                <td><span class="badge-status ${f.is_active ? 'confirmed' : 'cancelled'}">${f.is_active ? 'Active' : 'Inactive'}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading flights:', error);
        renderTableMessage(tbody, 8, 'Error loading flights');
    }
}

async function loadBuses() {
    const tbody = document.getElementById('busesTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 8, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_inventory.php?type=bus');
        if (!data.success) {
            renderTableMessage(tbody, 8, data.message || 'Failed to load buses');
            return;
        }

        const buses = data.items;
        if (!buses || buses.length === 0) {
            renderTableMessage(tbody, 8, 'No buses found');
            return;
        }

        tbody.innerHTML = buses.map(b => `
            <tr>
                <td>#${b.bus_id}</td>
                <td>${escapeHtml(b.operator_name || '—')}</td>
                <td>${escapeHtml(b.origin_name || '—')}</td>
                <td>${escapeHtml(b.destination_name || '—')}</td>
                <td>${b.departure_time}</td>
                <td>${RoyalNepal.formatCurrency(b.base_price, b.currency)}</td>
                <td>${b.available_seats} / ${b.total_seats}</td>
                <td><span class="badge-status ${b.is_active ? 'confirmed' : 'cancelled'}">${b.is_active ? 'Active' : 'Inactive'}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading buses:', error);
        renderTableMessage(tbody, 8, 'Error loading buses');
    }
}

async function loadHotels() {
    const tbody = document.getElementById('hotelsTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 8, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_inventory.php?type=hotel');
        if (!data.success) {
            renderTableMessage(tbody, 8, data.message || 'Failed to load hotels');
            return;
        }

        const hotels = data.items;
        if (!hotels || hotels.length === 0) {
            renderTableMessage(tbody, 8, 'No hotels found');
            return;
        }

        tbody.innerHTML = hotels.map(h => `
            <tr>
                <td>#${h.hotel_id}</td>
                <td>${escapeHtml(h.hotel_name)}</td>
                <td>${escapeHtml(h.location_name || '—')}</td>
                <td>${h.star_rating} ⭐</td>
                <td>—</td><!-- Price/night is stored per room in hotel_rooms table -->
                <td>—</td><!-- Room availability is stored in hotel_rooms table -->
                <td><span class="badge-status ${h.is_active ? 'confirmed' : 'cancelled'}">${h.is_active ? 'Active' : 'Inactive'}</span></td>
                <td></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading hotels:', error);
        renderTableMessage(tbody, 8, 'Error loading hotels');
    }
}

async function loadPackages() {
    const tbody = document.getElementById('packagesTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 8, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_inventory.php?type=package');
        if (!data.success) {
            renderTableMessage(tbody, 8, data.message || 'Failed to load packages');
            return;
        }

        const packages = data.items;
        if (!packages || packages.length === 0) {
            renderTableMessage(tbody, 8, 'No packages found');
            return;
        }

        tbody.innerHTML = packages.map(p => `
            <tr>
                <td>#${p.package_id}</td>
                <td>${escapeHtml(p.package_name)}</td>
                <td>${p.duration_days}D / ${p.duration_nights}N</td>
                <td>${RoyalNepal.formatCurrency(p.base_price, p.currency)}</td>
                <td>${capitalize(p.package_type)}</td>
                <td>${p.group_size_max}</td>
                <td><span class="badge-status ${p.is_active ? 'confirmed' : 'cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading packages:', error);
        renderTableMessage(tbody, 8, 'Error loading packages');
    }
}

async function loadPlaces() {
    const tbody = document.getElementById('placesTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 7, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_inventory.php?type=place');
        if (!data.success) {
            renderTableMessage(tbody, 7, data.message || 'Failed to load places');
            return;
        }

        const places = data.items;
        if (!places || places.length === 0) {
            renderTableMessage(tbody, 7, 'No places found');
            return;
        }

        tbody.innerHTML = places.map(p => `
            <tr>
                <td>#${p.place_id}</td>
                <td>${escapeHtml(p.place_name)}</td>
                <td>${escapeHtml(p.location_name || '—')}</td>
                <td>${p.altitude_meters ? p.altitude_meters + ' m' : '—'}</td>
                <td>${p.latitude !== undefined ? p.latitude + ', ' + p.longitude : '—'}</td>
                <td>${escapeHtml((p.description || '').substring(0, 60))}${(p.description || '').length > 60 ? '…' : ''}</td>
                <td></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading places:', error);
        renderTableMessage(tbody, 7, 'Error loading places');
    }
}

async function loadAllBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    renderTableMessage(tbody, 8, 'Loading...');
    try {
        const data = await RoyalNepal.apiRequest('get_all_bookings.php');
        if (!data.success) {
            renderTableMessage(tbody, 8, data.message || 'Failed to load bookings');
            return;
        }

        if (data.data.length === 0) {
            renderTableMessage(tbody, 8, 'No bookings found');
            return;
        }

        tbody.innerHTML = data.data.map(b => `
            <tr>
                <td>#${b.booking_reference}</td>
                <td>${escapeHtml(b.first_name + ' ' + b.last_name)}</td>
                <td>${capitalize(b.booking_type)}</td>
                <td>${RoyalNepal.formatCurrency(b.total_amount, b.currency)}</td>
                <td>${RoyalNepal.formatDate(b.booking_date)}</td>
                <td>—</td>
                <td><span class="badge-status ${b.booking_status}">${capitalize(b.booking_status)}</span></td>
                <td></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading all bookings:', error);
        renderTableMessage(tbody, 8, 'Error loading bookings');
    }
}

// ── Utility functions ──────────────────────────────────────────────────────

/**
 * Handle quick action button clicks from the dashboard overview
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

/**
 * Toggle a user's active status
 */
async function toggleUserStatus(userId, newStatus) {
    try {
        const data = await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({ item_type: 'user', user_id: userId, is_active: newStatus })
        });
        if (data.success) {
            loadUsers();
        } else {
            showMessage(data.message || 'Failed to update user status', 'error');
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
    }
}

/**
 * Render a single-row message inside a table body
 */
function renderTableMessage(tbody, colspan, message) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">${escapeHtml(message)}</td></tr>`;
}

/**
 * Set the text content of an element by ID
 */
function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/**
 * Capitalise the first letter of a string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
 * Display a message to the user
 */
function showMessage(text, type = 'info') {
    let messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
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
