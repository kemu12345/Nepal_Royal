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
        const status = Number(u.is_active) === 1 ? 'Active' : 'Inactive';
        return `
            <tr>
                <td>${u.user_id}</td>
                <td>${escapeHtml(fullName)}</td>
                <td>${escapeHtml(u.email || '')}</td>
                <td>${escapeHtml(u.phone || '-')}</td>
                <td>${escapeHtml(capitalize(u.role || 'user'))}</td>
                <td>${status}</td>
                <td>-</td>
            </tr>
        `;
    }).join('');
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
            <td>-</td>
            <td>-</td>
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
            <td>-</td>
            <td>-</td>
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
            <td>-</td>
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
        return `
            <tr>
                <td>${escapeHtml(b.booking_reference || String(b.booking_id))}</td>
                <td>${escapeHtml(name || '-')}</td>
                <td>${escapeHtml(capitalize(b.booking_type || '-'))}</td>
                <td>${formatAmount(b.total_amount, b.currency)}</td>
                <td>${formatDateShort(b.booking_date)}</td>
                <td>-</td>
                <td>${escapeHtml(capitalize(b.booking_status || 'pending'))}</td>
                <td>-</td>
            </tr>
        `;
    }).join('');
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
    const actions = {
        'add-flight': createFlight,
        'add-bus': createBus,
        'add-hotel': createHotel,
        'add-package': createPackage,
        'add-place': createPlace
    };

    if (actions[action]) {
        actions[action]();
    }
}

async function createFlight() {
    try {
        const airlineId = promptId('Enter Airline ID', adminState.support.airlines, 'airline_id');
        if (airlineId === null) return;

        const originId = promptId('Enter Origin Location ID', adminState.support.locations, 'location_id');
        if (originId === null) return;

        const destinationId = promptId('Enter Destination Location ID', adminState.support.locations, 'location_id');
        if (destinationId === null) return;

        const flightNumber = promptRequired('Flight number (e.g. RN-101)');
        if (!flightNumber) return;

        const departureTime = promptRequired('Departure time (HH:MM:SS)', '09:00:00');
        if (!departureTime) return;

        const arrivalTime = promptRequired('Arrival time (HH:MM:SS)', '10:00:00');
        if (!arrivalTime) return;

        const durationMinutes = promptNumber('Duration minutes', 60);
        if (durationMinutes === null) return;

        const totalSeats = promptNumber('Total seats', 40);
        if (totalSeats === null) return;

        const basePrice = promptNumber('Base price (NPR)', 5000);
        if (basePrice === null) return;

        const operatesOnDays = promptRequired('Operating days (e.g. Mon,Tue,Wed,Thu,Fri,Sat,Sun)', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        if (!operatesOnDays) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'flight',
                airline_id: airlineId,
                flight_number: flightNumber,
                origin_location_id: originId,
                destination_location_id: destinationId,
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: durationMinutes,
                total_seats: totalSeats,
                available_seats: totalSeats,
                base_price: basePrice,
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: 1
            })
        });

        showMessage('Flight created successfully', 'success');
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

async function createBus() {
    try {
        const operatorId = promptId('Enter Bus Operator ID', adminState.support.operators, 'operator_id');
        if (operatorId === null) return;

        const originId = promptId('Enter Origin Location ID', adminState.support.locations, 'location_id');
        if (originId === null) return;

        const destinationId = promptId('Enter Destination Location ID', adminState.support.locations, 'location_id');
        if (destinationId === null) return;

        const busNumber = promptRequired('Bus number (e.g. RN-BUS-12)');
        if (!busNumber) return;

        const departureTime = promptRequired('Departure time (HH:MM:SS)', '07:00:00');
        if (!departureTime) return;

        const arrivalTime = promptRequired('Arrival time (HH:MM:SS)', '13:00:00');
        if (!arrivalTime) return;

        const durationMinutes = promptNumber('Duration minutes', 360);
        if (durationMinutes === null) return;

        const totalSeats = promptNumber('Total seats', 32);
        if (totalSeats === null) return;

        const basePrice = promptNumber('Base price (NPR)', 1500);
        if (basePrice === null) return;

        const operatesOnDays = promptRequired('Operating days (e.g. Mon,Tue,Wed,Thu,Fri,Sat,Sun)', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        if (!operatesOnDays) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'bus',
                operator_id: operatorId,
                bus_number: busNumber,
                origin_location_id: originId,
                destination_location_id: destinationId,
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: durationMinutes,
                bus_type: 'tourist',
                total_seats: totalSeats,
                available_seats: totalSeats,
                base_price: basePrice,
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: 1
            })
        });

        showMessage('Bus created successfully', 'success');
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

async function createHotel() {
    try {
        const locationId = promptId('Enter Hotel Location ID', adminState.support.locations, 'location_id');
        if (locationId === null) return;

        const hotelName = promptRequired('Hotel name');
        if (!hotelName) return;

        const address = promptRequired('Hotel address');
        if (!address) return;

        const starRating = promptNumber('Star rating (0-5)', 3);
        if (starRating === null) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'hotel',
                hotel_name: hotelName,
                location_id: locationId,
                address,
                description: '',
                star_rating: starRating,
                hotel_type: 'hotel',
                is_active: 1
            })
        });

        showMessage('Hotel created successfully', 'success');
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

async function createPackage() {
    try {
        const packageName = promptRequired('Package name');
        if (!packageName) return;

        const description = promptRequired('Package short description');
        if (!description) return;

        const durationDays = promptNumber('Duration days', 3);
        if (durationDays === null) return;

        const durationNights = promptNumber('Duration nights', 2);
        if (durationNights === null) return;

        const basePrice = promptNumber('Base price (NPR)', 20000);
        if (basePrice === null) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'package',
                package_name: packageName,
                package_type: 'combined',
                description,
                duration_days: durationDays,
                duration_nights: durationNights,
                base_price: basePrice,
                currency: 'NPR',
                is_active: 1
            })
        });

        showMessage('Package created successfully', 'success');
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

async function createPlace() {
    try {
        const locationId = promptId('Enter Place Location ID', adminState.support.locations, 'location_id');
        if (locationId === null) return;

        const placeName = promptRequired('Place name');
        if (!placeName) return;

        const description = promptRequired('Place description');
        if (!description) return;

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'POST',
            body: JSON.stringify({
                item_type: 'place',
                place_name: placeName,
                location_id: locationId,
                category: 'natural',
                description,
                is_active: 1
            })
        });

        showMessage('Place created successfully', 'success');
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

function promptId(label, sourceList, idField) {
    if (Array.isArray(sourceList) && sourceList.length) {
        const preview = sourceList
            .slice(0, 10)
            .map((item) => `${item[idField]}:${item.location_name || item.airline_name || item.operator_name || ''}`)
            .join(' | ');
        showMessage(`Available IDs: ${preview}`, 'info');
    }

    const value = promptNumber(label, 1);
    if (value === null) return null;
    return Math.trunc(value);
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
