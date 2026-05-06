/*
    Admin Dashboard JavaScript
    Handles section switching, button clicks, and form submissions
*/

const adminState = {
    support: {
        airlines: [],
        operators: [],
        locations: []
    }
};

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is an admin
    RoyalNepal.requireAuth('admin');

    initializeEventListeners();
    loadDashboardData();
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

    const addFlightForm = document.getElementById('addFlightForm');
    if (addFlightForm) {
        addFlightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewFlight();
        });
    }

    const addBusForm = document.getElementById('addBusForm');
    if (addBusForm) {
        addBusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewBus();
        });
    }

    const addHotelForm = document.getElementById('addHotelForm');
    if (addHotelForm) {
        addHotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewHotel();
        });
    }

    const addPackageForm = document.getElementById('addPackageForm');
    if (addPackageForm) {
        addPackageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewPackage();
        });
    }

    const addPlaceForm = document.getElementById('addPlaceForm');
    if (addPlaceForm) {
        addPlaceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewPlace();
        });
    }
}

/**
 * Switch to a different section
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
        'bookings': 'Bookings Management',
        'add-flight': 'Add New Flight',
        'add-bus': 'Add New Bus',
        'add-hotel': 'Add New Hotel',
        'add-package': 'Add New Package',
        'add-place': 'Add New Place'
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
 * Load and display dashboard statistics
 */
async function loadDashboardData() {
    try {
        const payload = await RoyalNepal.apiRequest('get_inventory.php?type=all');
        const summary = payload.summary || {};
        const items = payload.items || {};
        const users = payload.users || [];
        const bookings = payload.bookings || [];
        const recentBookings = payload.recent_bookings || bookings.slice(0, 5);
        adminState.support = payload.support || adminState.support;

        populateSupportDropdowns();

        // Update the UI with stats
        const totalUsers = document.getElementById('totalUsers');
        const totalBookings = document.getElementById('totalBookings');
        const totalFlights = document.getElementById('totalFlights');
        const totalHotels = document.getElementById('totalHotels');

        if (totalUsers) totalUsers.textContent = String(summary.users ?? users.length ?? 0);
        if (totalBookings) totalBookings.textContent = String(summary.bookings ?? bookings.length ?? 0);
        if (totalFlights) totalFlights.textContent = String(summary.flights ?? items.flights?.length ?? 0);
        if (totalHotels) totalHotels.textContent = String(summary.hotels ?? items.hotels?.length ?? 0);

        renderUsersTable(users);
        renderFlightsTable(items.flights || []);
        renderBusesTable(items.buses || []);
        renderHotelsTable(items.hotels || []);
        renderPackagesTable(items.packages || []);
        renderPlacesTable(items.places || []);
        renderBookingsTable(bookings);
        renderRecentBookingsTable(recentBookings);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage(error.message || 'Failed to load admin data', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((u) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        const isActive = Number(u.is_active) === 1;
        const status = isActive ? 'Active' : 'Inactive';
        const toggleLabel = isActive ? 'Deactivate' : 'Activate';
        const toggleClass = isActive ? 'btn-warning' : 'btn-success';
        return `
            <tr>
                <td>${u.user_id}</td>
                <td>${escapeHtml(fullName)}</td>
                <td>${escapeHtml(u.email || '')}</td>
                <td>${escapeHtml(u.phone || '-')}</td>
                <td>${escapeHtml(capitalize(u.role || 'user'))}</td>
                <td>${status}</td>
                <td>
                    <button class="btn ${toggleClass} btn-sm me-1" data-user-toggle="${u.user_id}" data-user-active="${u.is_active}">${toggleLabel}</button>
                    <button class="btn btn-danger btn-sm" data-user-delete="${u.user_id}" data-user-name="${escapeHtml(fullName)}">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-user-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number(button.getAttribute('data-user-toggle'));
            const currentActive = Number(button.getAttribute('data-user-active'));
            toggleUserStatus(id, currentActive === 1);
        });
    });

    tbody.querySelectorAll('[data-user-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number(button.getAttribute('data-user-delete'));
            const name = button.getAttribute('data-user-name');
            deleteUser(id, name);
        });
    });
}

async function toggleUserStatus(userId, isCurrentlyActive) {
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        await RoyalNepal.apiRequest('manage_users.php', {
            method: 'PUT',
            body: JSON.stringify({ user_id: userId, is_active: !isCurrentlyActive })
        });
        showMessage(`User ${action}d successfully`, 'success');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || `Failed to ${action} user`, 'error');
    }
}

async function deleteUser(userId, name) {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return;

    try {
        await RoyalNepal.apiRequest('manage_users.php', {
            method: 'DELETE',
            body: JSON.stringify({ user_id: userId })
        });
        showMessage('User deleted successfully', 'success');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Failed to delete user', 'error');
    }
}

function renderFlightsTable(flights) {
    const tbody = document.getElementById('flightsTableBody');
    if (!tbody) return;

    if (!flights.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No flights found</td></tr>';
        return;
    }

    tbody.innerHTML = flights.map((f) => `
        <tr>
            <td>${f.flight_id}</td>
            <td>${escapeHtml(f.airline_name || '-')}</td>
            <td>${escapeHtml(f.origin_name || '-')}</td>
            <td>${escapeHtml(f.destination_name || '-')}</td>
            <td>${escapeHtml(f.departure_time || '-')}</td>
            <td>${formatAmount(f.base_price, f.currency)}</td>
            <td>${f.available_seats ?? 0}</td>
            <td>
                <button class="btn btn-secondary btn-sm" type="button" data-flight-edit="${f.flight_id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-flight-delete="${f.flight_id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-flight-edit]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-flight-edit') || '', 10);
            const flight = flights.find((f) => Number(f.flight_id) === id);
            if (flight) {
                editFlight(flight);
            }
        });
    });

    tbody.querySelectorAll('[data-flight-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-flight-delete') || '', 10);
            const flight = flights.find((f) => Number(f.flight_id) === id);
            if (flight) {
                deleteFlight(flight);
            }
        });
    });
}

function renderBusesTable(buses) {
    const tbody = document.getElementById('busesTableBody');
    if (!tbody) return;

    if (!buses.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No buses found</td></tr>';
        return;
    }

    tbody.innerHTML = buses.map((b) => `
        <tr>
            <td>${b.bus_id}</td>
            <td>${escapeHtml(b.operator_name || '-')}</td>
            <td>${escapeHtml(b.origin_name || '-')}</td>
            <td>${escapeHtml(b.destination_name || '-')}</td>
            <td>${escapeHtml(b.departure_time || '-')}</td>
            <td>${formatAmount(b.base_price, b.currency)}</td>
            <td>${b.available_seats ?? 0}</td>
            <td>
                <button class="btn btn-secondary btn-sm" type="button" data-bus-edit="${b.bus_id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-bus-delete="${b.bus_id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-bus-edit]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-bus-edit') || '', 10);
            const bus = buses.find((b) => Number(b.bus_id) === id);
            if (bus) {
                editBus(bus);
            }
        });
    });

    tbody.querySelectorAll('[data-bus-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-bus-delete') || '', 10);
            const bus = buses.find((b) => Number(b.bus_id) === id);
            if (bus) {
                deleteBus(bus);
            }
        });
    });
}

function renderHotelsTable(hotels) {
    const tbody = document.getElementById('hotelsTableBody');
    if (!tbody) return;

    if (!hotels.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hotels found</td></tr>';
        return;
    }

    tbody.innerHTML = hotels.map((h) => `
        <tr>
            <td>${h.hotel_id}</td>
            <td>${escapeHtml(h.hotel_name || '-')}</td>
            <td>${escapeHtml(h.location_name || '-')}</td>
            <td>${h.star_rating ?? '-'}</td>
            <td>${h.min_price_per_night != null ? formatAmount(h.min_price_per_night, 'NPR') : '-'}</td>
            <td>${h.total_available_rooms != null ? h.total_available_rooms : '-'}</td>
            <td>${Number(h.is_active) === 1 ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" type="button" data-hotel-edit="${h.hotel_id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-hotel-delete="${h.hotel_id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-hotel-edit]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-hotel-edit') || '', 10);
            const hotel = hotels.find((h) => Number(h.hotel_id) === id);
            if (hotel) {
                editHotel(hotel);
            }
        });
    });

    tbody.querySelectorAll('[data-hotel-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-hotel-delete') || '', 10);
            const hotel = hotels.find((h) => Number(h.hotel_id) === id);
            if (hotel) {
                deleteHotel(hotel);
            }
        });
    });
}

function renderPackagesTable(packages) {
    const tbody = document.getElementById('packagesTableBody');
    if (!tbody) return;

    if (!packages.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No packages found</td></tr>';
        return;
    }

    tbody.innerHTML = packages.map((p) => `
        <tr>
            <td>${p.package_id}</td>
            <td>${escapeHtml(p.package_name || '-')}</td>
            <td>${p.duration_days || 0}D/${p.duration_nights || 0}N</td>
            <td>${formatAmount(p.base_price, p.currency)}</td>
            <td>${escapeHtml(p.destinations || '-')}</td>
            <td>${p.group_size_max ?? '-'}</td>
            <td>${Number(p.is_active) === 1 ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" type="button" data-package-edit="${p.package_id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-package-delete="${p.package_id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-package-edit]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-package-edit') || '', 10);
            const pkg = packages.find((p) => Number(p.package_id) === id);
            if (pkg) {
                editPackage(pkg);
            }
        });
    });

    tbody.querySelectorAll('[data-package-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-package-delete') || '', 10);
            const pkg = packages.find((p) => Number(p.package_id) === id);
            if (pkg) {
                deletePackage(pkg);
            }
        });
    });
}

function renderPlacesTable(places) {
    const tbody = document.getElementById('placesTableBody');
    if (!tbody) return;

    if (!places.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No places found</td></tr>';
        return;
    }

    tbody.innerHTML = places.map((p) => `
        <tr>
            <td>${p.place_id}</td>
            <td>${escapeHtml(p.place_name || '-')}</td>
            <td>${escapeHtml(p.location_name || '-')}</td>
            <td>${p.altitude_meters ?? '-'}</td>
            <td>${p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : '-'}</td>
            <td>${escapeHtml((p.description || '').slice(0, 60))}${(p.description || '').length > 60 ? '...' : ''}</td>
            <td>
                <button class="btn btn-secondary btn-sm" type="button" data-place-edit="${p.place_id}">Edit</button>
                <button class="btn btn-danger btn-sm" type="button" data-place-delete="${p.place_id}">Delete</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('[data-place-edit]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-place-edit') || '', 10);
            const place = places.find((p) => Number(p.place_id) === id);
            if (place) {
                editPlace(place);
            }
        });
    });

    tbody.querySelectorAll('[data-place-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number.parseInt(button.getAttribute('data-place-delete') || '', 10);
            const place = places.find((p) => Number(p.place_id) === id);
            if (place) {
                deletePlace(place);
            }
        });
    });
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map((b) => {
        const name = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        const status = capitalize(b.booking_status || 'pending');
        const statusBadge = status === 'Pending'
            ? '<span class="badge bg-warning text-dark">Pending</span>'
            : status === 'Confirmed'
                ? '<span class="badge bg-success">Confirmed</span>'
                : '<span class="badge bg-danger">Cancelled</span>';

        const actions = (b.booking_status || 'pending') === 'pending'
            ? `<button class="btn btn-success btn-sm me-1" data-booking-approve="${b.booking_id}">Approve</button>
               <button class="btn btn-danger btn-sm" data-booking-cancel="${b.booking_id}">Cancel</button>`
            : '-';

        return `
            <tr>
                <td>${escapeHtml(b.booking_reference || String(b.booking_id))}</td>
                <td>${escapeHtml(name || '-')}</td>
                <td>${escapeHtml(capitalize(b.booking_type || '-'))}</td>
                <td>${formatAmount(b.total_amount, b.currency)}</td>
                <td>${formatDateShort(b.booking_date)}</td>
                <td>${formatDateShort(b.travel_date)}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');

    // Attach event listeners for approve/cancel buttons
    tbody.querySelectorAll('[data-booking-approve]').forEach((button) => {
        button.addEventListener('click', () => {
            updateBookingStatus(Number(button.getAttribute('data-booking-approve')), 'confirmed');
        });
    });

    tbody.querySelectorAll('[data-booking-cancel]').forEach((button) => {
        button.addEventListener('click', () => {
            updateBookingStatus(Number(button.getAttribute('data-booking-cancel')), 'cancelled');
        });
    });
}

function renderRecentBookingsTable(bookings) {
    const tbody = document.getElementById('recentBookings');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings yet</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map((b) => {
        const name = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        return `
            <tr>
                <td>${escapeHtml(b.booking_reference || String(b.booking_id))}</td>
                <td>${escapeHtml(name || '-')}</td>
                <td>${escapeHtml(capitalize(b.booking_type || '-'))}</td>
                <td>${formatAmount(b.total_amount, b.currency)}</td>
                <td>${escapeHtml(capitalize(b.booking_status || 'pending'))}</td>
                <td>${formatDateShort(b.booking_date)}</td>
            </tr>
        `;
    }).join('');
}

function formatAmount(amount, currency = 'NPR') {
    const value = Number.parseFloat(amount || 0);
    const normalized = Number.isFinite(value) ? value : 0;
    return RoyalNepal.formatCurrency(normalized, currency || 'NPR');
}

function formatDateShort(dateValue) {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function capitalize(value) {
    if (!value) return '';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(action) {
    if (action === 'add-flight') {
        switchSection('add-flight');
        return;
    }
    if (action === 'add-bus') {
        switchSection('add-bus');
        return;
    }
    if (action === 'add-hotel') {
        switchSection('add-hotel');
        return;
    }
    if (action === 'add-package') {
        switchSection('add-package');
        return;
    }
    if (action === 'add-place') {
        switchSection('add-place');
        return;
    }
    const actions = {
    };

    if (actions[action]) {
        actions[action]();
    }
}

function populateSupportDropdowns() {
    // Flight Dropdowns
    const airlinesSelect = document.getElementById('flightAirlineId');
    const flightOriginSelect = document.getElementById('flightOriginId');
    const flightDestSelect = document.getElementById('flightDestinationId');
    
    if (airlinesSelect && adminState.support.airlines) {
        airlinesSelect.innerHTML = '<option value="">Select Airline...</option>' + 
            adminState.support.airlines.map(a => `<option value="${a.airline_id}">${a.airline_name}</option>`).join('');
    }
    
    // Bus Dropdowns
    const busOperatorSelect = document.getElementById('busOperatorId');
    const busOriginSelect = document.getElementById('busOriginId');
    const busDestSelect = document.getElementById('busDestinationId');
    
    if (busOperatorSelect && adminState.support.operators) {
        busOperatorSelect.innerHTML = '<option value="">Select Operator...</option>' + 
            adminState.support.operators.map(o => `<option value="${o.operator_id}">${o.operator_name}</option>`).join('');
    }

    // Locations (shared)
    if (adminState.support.locations) {
        const locs = adminState.support.locations.map(l => `<option value="${l.location_id}">${l.location_name}</option>`).join('');
        
        if (flightOriginSelect) flightOriginSelect.innerHTML = '<option value="">Select Origin...</option>' + locs;
        if (flightDestSelect) flightDestSelect.innerHTML = '<option value="">Select Destination...</option>' + locs;
        
        if (busOriginSelect) busOriginSelect.innerHTML = '<option value="">Select Origin...</option>' + locs;
        if (busDestSelect) busDestSelect.innerHTML = '<option value="">Select Destination...</option>' + locs;
        
        const hotelLocationSelect = document.getElementById('hotelLocationId');
        if (hotelLocationSelect) hotelLocationSelect.innerHTML = '<option value="">Select Location...</option>' + locs;

        const placeLocationSelect = document.getElementById('placeLocationId');
        if (placeLocationSelect) placeLocationSelect.innerHTML = '<option value="">Select Location...</option>' + locs;
    }
}

async function submitNewFlight() {
    try {
        const airlineId = document.getElementById('flightAirlineId').value;
        const originId = document.getElementById('flightOriginId').value;
        const destinationId = document.getElementById('flightDestinationId').value;
        
        if (originId === destinationId) {
            window.alert('Error: Origin and destination cannot be the same');
            return;
        }

        const flightNumber = document.getElementById('flightNumber').value;
        const departureTime = document.getElementById('flightDeparture').value;
        const arrivalTime = document.getElementById('flightArrival').value;
        const durationMinutes = document.getElementById('flightDuration').value;
        const totalSeats = document.getElementById('flightSeats').value;
        const basePrice = document.getElementById('flightPrice').value;
        const operatesOnDays = document.getElementById('flightDays').value;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'flight',
                airline_id: Number(airlineId),
                flight_number: flightNumber,
                origin_location_id: Number(originId),
                destination_location_id: Number(destinationId),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: Number(durationMinutes),
                total_seats: Number(totalSeats),
                available_seats: Number(totalSeats),
                base_price: Number(basePrice),
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: 1
            })
        });

        showMessage('Flight created successfully', 'success');
        document.getElementById('addFlightForm').reset();
        switchSection('flights');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to create flight', 'error');
    }
}

async function editFlight(flight) {
    try {
        const flightNumber = promptRequired('Flight number', flight.flight_number || '');
        if (!flightNumber) return;

        const departureTime = promptRequired('Departure time (HH:MM:SS)', flight.departure_time || '09:00:00');
        if (!departureTime) return;

        const arrivalTime = promptRequired('Arrival time (HH:MM:SS)', flight.arrival_time || '10:00:00');
        if (!arrivalTime) return;

        const durationMinutes = promptNumber('Duration minutes', flight.duration_minutes || 60);
        if (durationMinutes === null) return;

        const totalSeats = promptNumber('Total seats', flight.total_seats || flight.available_seats || 20);
        if (totalSeats === null) return;

        const availableSeats = promptNumber('Available seats', flight.available_seats || totalSeats);
        if (availableSeats === null) return;

        const basePrice = promptNumber('Base price (NPR)', flight.base_price || 0);
        if (basePrice === null) return;

        const operatesOnDays = promptRequired('Operating days (comma separated)', flight.operates_on_days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        if (!operatesOnDays) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({
                item_type: 'flight',
                item_id: Number(flight.flight_id),
                airline_id: Number(flight.airline_id),
                flight_number: flightNumber,
                origin_location_id: Number(flight.origin_location_id),
                destination_location_id: Number(flight.destination_location_id),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: durationMinutes,
                aircraft_type: flight.aircraft_type || null,
                total_seats: totalSeats,
                available_seats: availableSeats,
                base_price: basePrice,
                currency: flight.currency || 'NPR',
                operates_on_days: operatesOnDays,
                is_active: Number(flight.is_active ?? 1)
            })
        });

        showMessage('Flight updated successfully', 'success');
        await loadDashboardData();
        switchSection('flights');
    } catch (error) {
        showMessage(error.message || 'Unable to update flight', 'error');
    }
}

async function deleteFlight(flight) {
    try {
        const approved = window.confirm(`Delete flight ${flight.flight_number || flight.flight_id}?`);
        if (!approved) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({
                item_type: 'flight',
                item_id: Number(flight.flight_id)
            })
        });

        showMessage('Flight deleted successfully', 'success');
        await loadDashboardData();
        switchSection('flights');
    } catch (error) {
        showMessage(error.message || 'Unable to delete flight', 'error');
    }
}

async function submitNewBus() {
    try {
        const operatorId = document.getElementById('busOperatorId').value;
        const originId = document.getElementById('busOriginId').value;
        const destinationId = document.getElementById('busDestinationId').value;
        
        if (originId === destinationId) {
            window.alert('Error: Origin and destination cannot be the same');
            return;
        }

        const busNumber = document.getElementById('busNumber').value;
        const departureTime = document.getElementById('busDeparture').value;
        const arrivalTime = document.getElementById('busArrival').value;
        const durationMinutes = document.getElementById('busDuration').value;
        const totalSeats = document.getElementById('busSeats').value;
        const basePrice = document.getElementById('busPrice').value;
        const operatesOnDays = document.getElementById('busDays').value;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'bus',
                operator_id: Number(operatorId),
                bus_number: busNumber,
                origin_location_id: Number(originId),
                destination_location_id: Number(destinationId),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: Number(durationMinutes),
                bus_type: 'tourist',
                total_seats: Number(totalSeats),
                available_seats: Number(totalSeats),
                base_price: Number(basePrice),
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: 1
            })
        });

        showMessage('Bus created successfully', 'success');
        document.getElementById('addBusForm').reset();
        switchSection('buses');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to create bus', 'error');
    }
}

async function editBus(bus) {
    try {
        const busNumber = promptRequired('Bus number', bus.bus_number || '');
        if (!busNumber) return;

        const departureTime = promptRequired('Departure time (HH:MM:SS)', bus.departure_time || '07:00:00');
        if (!departureTime) return;

        const arrivalTime = promptRequired('Arrival time (HH:MM:SS)', bus.arrival_time || '13:00:00');
        if (!arrivalTime) return;

        const durationMinutes = promptNumber('Duration minutes', bus.duration_minutes || 300);
        if (durationMinutes === null) return;

        const totalSeats = promptNumber('Total seats', bus.total_seats || bus.available_seats || 40);
        if (totalSeats === null) return;

        const availableSeats = promptNumber('Available seats', bus.available_seats || totalSeats);
        if (availableSeats === null) return;

        const basePrice = promptNumber('Base price (NPR)', bus.base_price || 0);
        if (basePrice === null) return;

        const operatesOnDays = promptRequired('Operating days (comma separated)', bus.operates_on_days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        if (!operatesOnDays) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({
                item_type: 'bus',
                item_id: Number(bus.bus_id),
                operator_id: Number(bus.operator_id),
                bus_number: busNumber,
                origin_location_id: Number(bus.origin_location_id),
                destination_location_id: Number(bus.destination_location_id),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: durationMinutes,
                bus_type: bus.bus_type || 'regular',
                total_seats: totalSeats,
                available_seats: availableSeats,
                base_price: basePrice,
                currency: bus.currency || 'NPR',
                amenities: bus.amenities || null,
                operates_on_days: operatesOnDays,
                is_active: Number(bus.is_active ?? 1)
            })
        });

        showMessage('Bus updated successfully', 'success');
        await loadDashboardData();
        switchSection('buses');
    } catch (error) {
        showMessage(error.message || 'Unable to update bus', 'error');
    }
}

async function deleteBus(bus) {
    try {
        const approved = window.confirm(`Delete bus ${bus.bus_number || bus.bus_id}?`);
        if (!approved) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({
                item_type: 'bus',
                item_id: Number(bus.bus_id)
            })
        });

        showMessage('Bus deleted successfully', 'success');
        await loadDashboardData();
        switchSection('buses');
    } catch (error) {
        showMessage(error.message || 'Unable to delete bus', 'error');
    }
}

async function submitNewHotel() {
    try {
        const locationId = document.getElementById('hotelLocationId').value;
        const hotelName = document.getElementById('hotelName').value;
        const hotelType = document.getElementById('hotelType').value;
        const starRating = document.getElementById('hotelRating').value;
        const address = document.getElementById('hotelAddress').value;
        const contactNumber = document.getElementById('hotelContact').value;
        const email = document.getElementById('hotelEmail').value;
        const description = document.getElementById('hotelDescription').value;
        const imageUrl = document.getElementById('hotelImageUrl').value;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'hotel',
                hotel_name: hotelName,
                location_id: Number(locationId),
                address: address,
                description: description,
                star_rating: Number(starRating),
                hotel_type: hotelType,
                contact_number: contactNumber || null,
                email: email || null,
                image_url: imageUrl || null,
                is_active: 1
            })
        });

        showMessage('Hotel created successfully', 'success');
        document.getElementById('addHotelForm').reset();
        switchSection('hotels');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to create hotel', 'error');
    }
}

async function editHotel(hotel) {
    try {
        const hotelName = promptRequired('Hotel name', hotel.hotel_name || '');
        if (!hotelName) return;

        const address = promptRequired('Hotel address', hotel.address || '');
        if (!address) return;

        const description = promptRequired('Hotel description', hotel.description || '');
        if (description === null) return;

        const starRating = promptNumber('Star rating (0-5)', hotel.star_rating || 3);
        if (starRating === null) return;

        const contactNumber = window.prompt('Contact number', hotel.contact_number || '') ?? '';
        const email = window.prompt('Email', hotel.email || '') ?? '';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({
                item_type: 'hotel',
                item_id: Number(hotel.hotel_id),
                vendor_id: hotel.vendor_id ? Number(hotel.vendor_id) : null,
                hotel_name: hotelName,
                location_id: Number(hotel.location_id),
                address,
                description,
                star_rating: starRating,
                hotel_type: hotel.hotel_type || 'hotel',
                contact_number: contactNumber,
                email: email || null,
                image_url: hotel.image_url || null,
                is_active: Number(hotel.is_active ?? 1)
            })
        });

        showMessage('Hotel updated successfully', 'success');
        await loadDashboardData();
        switchSection('hotels');
    } catch (error) {
        showMessage(error.message || 'Unable to update hotel', 'error');
    }
}

async function deleteHotel(hotel) {
    try {
        const approved = window.confirm(`Delete hotel ${hotel.hotel_name || hotel.hotel_id}?`);
        if (!approved) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({
                item_type: 'hotel',
                item_id: Number(hotel.hotel_id)
            })
        });

        showMessage('Hotel deleted successfully', 'success');
        await loadDashboardData();
        switchSection('hotels');
    } catch (error) {
        showMessage(error.message || 'Unable to delete hotel', 'error');
    }
}

async function submitNewPackage() {
    try {
        const packageName = document.getElementById('packageName').value;
        const packageType = document.getElementById('packageType').value;
        const durationDays = document.getElementById('packageDays').value;
        const durationNights = document.getElementById('packageNights').value;
        const basePrice = document.getElementById('packagePrice').value;
        const description = document.getElementById('packageDescription').value;
        const imageUrl = document.getElementById('packageImageUrl').value;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'package',
                package_name: packageName,
                package_type: packageType,
                description: description,
                duration_days: Number(durationDays),
                duration_nights: Number(durationNights),
                base_price: Number(basePrice),
                currency: 'NPR',
                image_url: imageUrl || null,
                is_active: 1
            })
        });

        showMessage('Package created successfully', 'success');
        document.getElementById('addPackageForm').reset();
        switchSection('packages');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to create package', 'error');
    }
}

async function editPackage(pkg) {
    try {
        const packageName = promptRequired('Package name', pkg.package_name || '');
        if (!packageName) return;

        const description = promptRequired('Package description', pkg.description || '');
        if (!description) return;

        const durationDays = promptNumber('Duration days', pkg.duration_days || 1);
        if (durationDays === null) return;

        const durationNights = promptNumber('Duration nights', pkg.duration_nights || 1);
        if (durationNights === null) return;

        const basePrice = promptNumber('Base price (NPR)', pkg.base_price || 0);
        if (basePrice === null) return;

        const packageType = promptRequired('Package type (trekking/cultural/wildlife/adventure/pilgrimage/heritage/combined)', pkg.package_type || 'combined');
        if (!packageType) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({
                item_type: 'package',
                item_id: Number(pkg.package_id),
                package_name: packageName,
                package_type: packageType,
                description,
                detailed_itinerary: pkg.detailed_itinerary || null,
                duration_days: durationDays,
                duration_nights: durationNights,
                difficulty_level: pkg.difficulty_level || 'moderate',
                group_size_min: Number(pkg.group_size_min || 1),
                group_size_max: Number(pkg.group_size_max || 15),
                base_price: basePrice,
                currency: pkg.currency || 'NPR',
                inclusions: pkg.inclusions || null,
                exclusions: pkg.exclusions || null,
                best_season: pkg.best_season || null,
                image_url: pkg.image_url || null,
                is_active: Number(pkg.is_active ?? 1),
                is_featured: Number(pkg.is_featured ?? 0)
            })
        });

        showMessage('Package updated successfully', 'success');
        await loadDashboardData();
        switchSection('packages');
    } catch (error) {
        showMessage(error.message || 'Unable to update package', 'error');
    }
}

async function deletePackage(pkg) {
    try {
        const approved = window.confirm(`Delete package ${pkg.package_name || pkg.package_id}?`);
        if (!approved) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({
                item_type: 'package',
                item_id: Number(pkg.package_id)
            })
        });

        showMessage('Package deleted successfully', 'success');
        await loadDashboardData();
        switchSection('packages');
    } catch (error) {
        showMessage(error.message || 'Unable to delete package', 'error');
    }
}

async function submitNewPlace() {
    try {
        const placeName = document.getElementById('placeName').value;
        const locationId = document.getElementById('placeLocationId').value;
        const category = document.getElementById('placeCategory').value;
        const description = document.getElementById('placeDescription').value;
        const imageUrl = document.getElementById('placeImageUrl').value;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'place',
                place_name: placeName,
                location_id: Number(locationId),
                category: category,
                description: description,
                image_url: imageUrl || null,
                is_active: 1
            })
        });

        showMessage('Place created successfully', 'success');
        document.getElementById('addPlaceForm').reset();
        switchSection('places');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to create place', 'error');
    }
}

async function editPlace(place) {
    try {
        const placeName = promptRequired('Place name', place.place_name || '');
        if (!placeName) return;

        const description = promptRequired('Place description', place.description || '');
        if (!description) return;

        const category = promptRequired('Category (cultural/historical/religious/natural/adventure/wildlife/heritage_site/national_park/viewpoint)', place.category || 'natural');
        if (!category) return;

        const altitude = window.prompt('Altitude meters', String(place.altitude_meters ?? ''));
        if (altitude === null) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'PUT',
            body: JSON.stringify({
                item_type: 'place',
                item_id: Number(place.place_id),
                place_name: placeName,
                location_id: Number(place.location_id),
                category,
                description,
                history: place.history || null,
                best_time_to_visit: place.best_time_to_visit || null,
                entry_fee: Number(place.entry_fee || 0),
                currency: place.currency || 'NPR',
                opening_hours: place.opening_hours || null,
                unesco_site: Number(place.unesco_site ?? 0),
                altitude_meters: altitude === '' ? null : Number(altitude),
                image_url: place.image_url || null,
                tips_and_guidelines: place.tips_and_guidelines || null,
                is_active: Number(place.is_active ?? 1)
            })
        });

        showMessage('Place updated successfully', 'success');
        await loadDashboardData();
        switchSection('places');
    } catch (error) {
        showMessage(error.message || 'Unable to update place', 'error');
    }
}

async function deletePlace(place) {
    try {
        const approved = window.confirm(`Delete place ${place.place_name || place.place_id}?`);
        if (!approved) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({
                item_type: 'place',
                item_id: Number(place.place_id)
            })
        });

        showMessage('Place deleted successfully', 'success');
        await loadDashboardData();
        switchSection('places');
    } catch (error) {
        showMessage(error.message || 'Unable to delete place', 'error');
    }
}

function promptRequired(label, defaultValue = '') {
    const value = window.prompt(label, defaultValue);
    if (value === null) return null;

    const trimmed = value.trim();
    if (!trimmed) {
        showMessage(`${label} is required`, 'error');
        return null;
    }

    return trimmed;
}

function promptNumber(label, defaultValue = 0) {
    const value = window.prompt(label, String(defaultValue));
    if (value === null) return null;

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        showMessage(`${label} must be a number`, 'error');
        return null;
    }

    return parsed;
}

function promptId(label, sourceList, idField, defaultValue = 1) {
    if (Array.isArray(sourceList) && sourceList.length) {
        const preview = sourceList
            .slice(0, 10)
            .map((item) => `${item[idField]}:${item.location_name || item.airline_name || item.operator_name || ''}`)
            .join(' | ');
        showMessage(`Available IDs: ${preview}`, 'info');
    }

    const value = promptNumber(label, defaultValue);
    if (value === null) return null;
    
    const parsedId = Math.trunc(value);
    
    if (Array.isArray(sourceList) && sourceList.length > 0) {
        const exists = sourceList.some(item => Number(item[idField]) === parsedId);
        if (!exists) {
            window.alert(`Invalid ID. Please enter a valid ID from the available list.`);
            return null;
        }
    }
    
    return parsedId;
}

/**
 * Display a message to the user
 */
function showMessage(text, type = 'info') {
    // Create a message element if it doesn't exist
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

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}

/**
 * Update the status of a booking (approve or cancel).
 * @param {number} bookingId - The booking ID to update.
 * @param {string} newStatus - The new status ('confirmed' or 'cancelled').
 */
async function updateBookingStatus(bookingId, newStatus) {
    const actionLabel = newStatus === 'confirmed' ? 'approve' : 'cancel';
    const approved = window.confirm(`Are you sure you want to ${actionLabel} booking #${bookingId}?`);
    if (!approved) return;

    try {
        await RoyalNepal.apiRequest('update_booking_status.php', {
            method: 'PUT',
            body: JSON.stringify({
                booking_id: bookingId,
                booking_status: newStatus
            })
        });

        showMessage(`Booking ${actionLabel}d successfully`, 'success');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || `Failed to ${actionLabel} booking`, 'error');
    }
}
