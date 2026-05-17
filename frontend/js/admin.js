/*
    Admin Dashboard JavaScript
    Handles section switching, button clicks, and form submissions
*/

const adminState = {
    support: {
        airlines: [],
        operators: [],
        locations: []
    },
    editingItem: null,
    charts: {}
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

    // Table Search filtering
    setupTableFilters();

    // Table Sorting
    setupTableSorting();

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
        setupFlightDurationSync();
        addFlightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateFlightForm()) {
                await submitNewFlight();
            }
        });
    }

    const addBusForm = document.getElementById('addBusForm');
    if (addBusForm) {
        setupBusDurationSync();
        addBusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateBusForm()) {
                await submitNewBus();
            }
        });
    }

    const addHotelForm = document.getElementById('addHotelForm');
    if (addHotelForm) {
        addHotelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateHotelForm()) {
                await submitNewHotel();
            }
        });
    }

    const addPackageForm = document.getElementById('addPackageForm');
    if (addPackageForm) {
        addPackageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validatePackageForm()) {
                await submitNewPackage();
            }
        });
    }

    const addPlaceForm = document.getElementById('addPlaceForm');
    if (addPlaceForm) {
        addPlaceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validatePlaceForm()) {
                await submitNewPlace();
            }
        });
    }

    const addLocationForm = document.getElementById('addLocationForm');
    if (addLocationForm) {
        addLocationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateLocationForm()) {
                await submitNewLocation();
            }
        });
    }

    const addAirlineForm = document.getElementById('addAirlineForm');
    if (addAirlineForm) {
        addAirlineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateAirlineForm()) {
                await submitNewAirline();
            }
        });
    }

    const addOperatorForm = document.getElementById('addOperatorForm');
    if (addOperatorForm) {
        addOperatorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (validateOperatorForm()) {
                await submitNewOperator();
            }
        });
    }
}

function parseTimeToMinutes(timeValue) {
    if (!timeValue) return null;

    const [hours, minutes] = timeValue.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    return (hours * 60) + minutes;
}

function calculateDurationMinutes(departureTime, arrivalTime) {
    const departureMinutes = parseTimeToMinutes(departureTime);
    const arrivalMinutes = parseTimeToMinutes(arrivalTime);

    if (departureMinutes === null || arrivalMinutes === null) return null;

    let duration = arrivalMinutes - departureMinutes;
    if (duration <= 0) {
        duration += 24 * 60;
    }

    return duration;
}

function syncFlightDurationFromTimes() {
    const departureEl = document.getElementById('flightDeparture');
    const arrivalEl = document.getElementById('flightArrival');
    const durationEl = document.getElementById('flightDuration');

    if (!departureEl || !arrivalEl || !durationEl) return null;

    const duration = calculateDurationMinutes(departureEl.value, arrivalEl.value);
    if (duration !== null) {
        durationEl.value = String(duration);
    }

    return duration;
}

function setupFlightDurationSync() {
    const departureEl = document.getElementById('flightDeparture');
    const arrivalEl = document.getElementById('flightArrival');
    const durationEl = document.getElementById('flightDuration');

    if (!departureEl || !arrivalEl || !durationEl) return;

    durationEl.readOnly = true;
    durationEl.title = 'Calculated automatically from departure and arrival time';

    departureEl.addEventListener('input', syncFlightDurationFromTimes);
    departureEl.addEventListener('change', syncFlightDurationFromTimes);
    arrivalEl.addEventListener('input', syncFlightDurationFromTimes);
    arrivalEl.addEventListener('change', syncFlightDurationFromTimes);

    syncFlightDurationFromTimes();
}

function syncBusDurationFromTimes() {
    const departureEl = document.getElementById('busDeparture');
    const arrivalEl = document.getElementById('busArrival');
    const durationEl = document.getElementById('busDuration');

    if (!departureEl || !arrivalEl || !durationEl) return null;

    const duration = calculateDurationMinutes(departureEl.value, arrivalEl.value);
    if (duration !== null) {
        durationEl.value = String(duration);
    }

    return duration;
}

function setupBusDurationSync() {
    const departureEl = document.getElementById('busDeparture');
    const arrivalEl = document.getElementById('busArrival');
    const durationEl = document.getElementById('busDuration');

    if (!departureEl || !arrivalEl || !durationEl) return;

    durationEl.readOnly = true;
    durationEl.title = 'Calculated automatically from departure and arrival time';

    departureEl.addEventListener('input', syncBusDurationFromTimes);
    departureEl.addEventListener('change', syncBusDurationFromTimes);
    arrivalEl.addEventListener('input', syncBusDurationFromTimes);
    arrivalEl.addEventListener('change', syncBusDurationFromTimes);

    syncBusDurationFromTimes();
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
        'locations': 'Locations Management',
        'airlines': 'Airlines Management',
        'operators': 'Bus Operators Management',
        'add-flight': 'Add New Flight',
        'add-bus': 'Add New Bus',
        'add-hotel': 'Add New Hotel',
        'add-package': 'Add New Package',
        'add-place': 'Add New Place',
        'add-location': 'Add New Location',
        'add-airline': 'Add New Airline',
        'add-operator': 'Add New Operator'
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
        const totalRevenue = document.getElementById('totalRevenue');
        const totalFlights = document.getElementById('totalFlights');
        const totalHotels = document.getElementById('totalHotels');

        if (totalUsers) totalUsers.textContent = String(summary.users ?? users.length ?? 0);
        if (totalBookings) totalBookings.textContent = String(summary.bookings ?? bookings.length ?? 0);

        if (totalRevenue) {
            const revenue = bookings
                .filter(b => b.booking_status === 'confirmed')
                .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
            totalRevenue.textContent = `NPR ${revenue.toLocaleString()}`;
        }

        if (totalFlights) totalFlights.textContent = String(summary.flights ?? items.flights?.length ?? 0);
        if (totalHotels) totalHotels.textContent = String(summary.hotels ?? items.hotels?.length ?? 0);

        renderUsersTable(users);
        renderFlightsTable(items.flights || []);
        renderBusesTable(items.buses || []);
        renderHotelsTable(items.hotels || []);
        renderPackagesTable(items.packages || []);
        renderPlacesTable(items.places || []);
        renderLocationsTable(adminState.support.locations || []);
        renderAirlinesTable(adminState.support.airlines || []);
        renderOperatorsTable(adminState.support.operators || []);
        renderBookingsTable(bookings);
        renderRecentBookingsTable(recentBookings);
        renderCharts(bookings);
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
    if (!window.confirm(`Are you sure you want to permanently delete user ${name}? This action cannot be undone and will also remove all their bookings.`)) return;

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
            <td>${formatTime(f.departure_time)}</td>
            <td>${formatAmount(f.base_price, f.currency)}</td>
            <td>${f.available_seats ?? 0}</td>
            <td>${Number(f.is_active) === 1 ? 'Active' : 'Inactive'}</td>
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
            <td>${formatTime(b.departure_time)}</td>
            <td>${formatAmount(b.base_price, b.currency)}</td>
            <td>${b.available_seats ?? 0}</td>
            <td>${Number(b.is_active) === 1 ? 'Active' : 'Inactive'}</td>
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

function formatTime(timeString) {
    if (!timeString || timeString === '-') return '-';
    // Handle "HH:MM:SS" or "HH:MM"
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    
    let h = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h}:${minutes} ${ampm}`;
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(action) {
    adminState.editingItem = null;

    if (action === 'add-flight') {
        document.getElementById('addFlightForm').reset();
        document.getElementById('flightFormTitle').textContent = 'Add New Flight';
        document.getElementById('flightSubmitBtn').textContent = 'Save Flight';
        switchSection('add-flight');
        return;
    }
    if (action === 'add-bus') {
        document.getElementById('addBusForm').reset();
        document.getElementById('busFormTitle').textContent = 'Add New Bus';
        document.getElementById('busSubmitBtn').textContent = 'Save Bus';
        switchSection('add-bus');
        return;
    }
    if (action === 'add-hotel') {
        document.getElementById('addHotelForm').reset();
        document.getElementById('hotelFormTitle').textContent = 'Add New Hotel';
        document.getElementById('hotelSubmitBtn').textContent = 'Save Hotel';
        switchSection('add-hotel');
        return;
    }
    if (action === 'add-package') {
        document.getElementById('addPackageForm').reset();
        document.getElementById('packageFormTitle').textContent = 'Add New Package';
        document.getElementById('packageSubmitBtn').textContent = 'Save Package';
        switchSection('add-package');
        return;
    }
    if (action === 'add-place') {
        document.getElementById('addPlaceForm').reset();
        document.getElementById('placeFormTitle').textContent = 'Add New Place';
        document.getElementById('placeSubmitBtn').textContent = 'Save Place';
        switchSection('add-place');
        return;
    }
    if (action === 'add-location') {
        document.getElementById('addLocationForm').reset();
        document.getElementById('locationFormTitle').textContent = 'Add New Location';
        document.getElementById('locationSubmitBtn').textContent = 'Save Location';
        switchSection('add-location');
        return;
    }
    if (action === 'add-airline') {
        document.getElementById('addAirlineForm').reset();
        document.getElementById('airlineFormTitle').textContent = 'Add New Airline';
        document.getElementById('airlineSubmitBtn').textContent = 'Save Airline';
        switchSection('add-airline');
        return;
    }
    if (action === 'add-operator') {
        document.getElementById('addOperatorForm').reset();
        document.getElementById('operatorFormTitle').textContent = 'Add New Operator';
        document.getElementById('operatorSubmitBtn').textContent = 'Save Operator';
        switchSection('add-operator');
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

        const packageDestSelect = document.getElementById('packageDestinations');
        if (packageDestSelect) packageDestSelect.innerHTML = locs;
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

        const flightNumber = document.getElementById('flightNumber').value.trim();
        const departureTime = document.getElementById('flightDeparture').value;
        const arrivalTime = document.getElementById('flightArrival').value;
        const durationMinutes = syncFlightDurationFromTimes();
        const totalSeats = document.getElementById('flightSeats').value;
        const basePrice = document.getElementById('flightPrice').value;
        const operatesOnDays = document.getElementById('flightDays').value;

        if (!/^[A-Za-z]{2}-[0-9]{3}$/.test(flightNumber)) {
            showMessage('Flight number must use the format yt-909', 'error');
            return;
        }

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'flight';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'flight',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                airline_id: Number(airlineId),
                flight_number: flightNumber,
                origin_location_id: Number(originId),
                destination_location_id: Number(destinationId),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: Number(durationMinutes),
                total_seats: Number(totalSeats),
                available_seats: isEditing ? undefined : Number(totalSeats),
                base_price: Number(basePrice),
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: Number(document.getElementById('flightStatus').value)
            })
        });

        showMessage(`Flight ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addFlightForm').reset();
        adminState.editingItem = null;
        switchSection('flights');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save flight', 'error');
    }
}

function editFlight(flight) {
    adminState.editingItem = { type: 'flight', id: Number(flight.flight_id) };

    // Switch to section
    switchSection('add-flight');

    // Update titles
    document.getElementById('flightFormTitle').textContent = 'Edit Flight';
    document.getElementById('flightSubmitBtn').textContent = 'Update Flight';

    // Populate form
    document.getElementById('flightAirlineId').value = flight.airline_id;
    document.getElementById('flightOriginId').value = flight.origin_location_id;
    document.getElementById('flightDestinationId').value = flight.destination_location_id;
    document.getElementById('flightNumber').value = flight.flight_number;
    document.getElementById('flightDeparture').value = flight.departure_time;
    document.getElementById('flightArrival').value = flight.arrival_time;
    syncFlightDurationFromTimes();
    document.getElementById('flightSeats').value = flight.total_seats;
    document.getElementById('flightPrice').value = flight.base_price;
    document.getElementById('flightDays').value = flight.operates_on_days;
    document.getElementById('flightStatus').value = flight.is_active;
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

        const busNumber = document.getElementById('busNumber').value.trim();
        const busType = document.getElementById('busType').value;
        const departureTime = document.getElementById('busDeparture').value;
        const arrivalTime = document.getElementById('busArrival').value;
        const durationMinutes = syncBusDurationFromTimes();
        const totalSeats = document.getElementById('busSeats').value;
        const basePrice = document.getElementById('busPrice').value;
        const operatesOnDays = document.getElementById('busDays').value;

        if (!/^[A-Za-z]{2}-[0-9]{3}$/.test(busNumber)) {
            showMessage('Bus number must use the format yt-909', 'error');
            return;
        }

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'bus';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'bus',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                operator_id: Number(operatorId),
                bus_number: busNumber,
                bus_type: busType,
                origin_location_id: Number(originId),
                destination_location_id: Number(destinationId),
                departure_time: departureTime,
                arrival_time: arrivalTime,
                duration_minutes: Number(durationMinutes),
                total_seats: Number(totalSeats),
                available_seats: isEditing ? undefined : Number(totalSeats),
                base_price: Number(basePrice),
                currency: 'NPR',
                operates_on_days: operatesOnDays,
                is_active: Number(document.getElementById('busStatus').value)
            })
        });

        showMessage(`Bus ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addBusForm').reset();
        adminState.editingItem = null;
        switchSection('buses');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save bus', 'error');
    }
}

function editBus(bus) {
    adminState.editingItem = { type: 'bus', id: Number(bus.bus_id) };

    // Switch to section
    switchSection('add-bus');

    // Update titles
    document.getElementById('busFormTitle').textContent = 'Edit Bus';
    document.getElementById('busSubmitBtn').textContent = 'Update Bus';

    // Populate form
    document.getElementById('busOperatorId').value = bus.operator_id;
    document.getElementById('busOriginId').value = bus.origin_location_id;
    document.getElementById('busDestinationId').value = bus.destination_location_id;
    document.getElementById('busNumber').value = bus.bus_number;
    document.getElementById('busType').value = bus.bus_type || 'regular';
    document.getElementById('busDeparture').value = bus.departure_time;
    document.getElementById('busArrival').value = bus.arrival_time;
    syncBusDurationFromTimes();
    document.getElementById('busSeats').value = bus.total_seats;
    document.getElementById('busPrice').value = bus.base_price;
    document.getElementById('busDays').value = bus.operates_on_days;
    document.getElementById('busStatus').value = bus.is_active;
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
        const hotelName = document.getElementById('hotelName').value;
        const locationId = document.getElementById('hotelLocationId').value;
        const hotelType = document.getElementById('hotelType').value;
        const starRating = document.getElementById('hotelRating').value;
        const basePrice = document.getElementById('hotelBasePrice').value;
        const totalRooms = document.getElementById('hotelTotalRooms').value;
        const address = document.getElementById('hotelAddress').value;
        const contactNumber = document.getElementById('hotelContact').value.trim();
        const email = document.getElementById('hotelEmail').value;
        const description = document.getElementById('hotelDescription').value;
        const imageUrl = document.getElementById('hotelImageUrl').value;

        // Validation
        if (!hotelName || !locationId || !hotelType || !starRating || !address || !basePrice || !totalRooms) {
            showMessage('Please fill in all required fields.', 'warning');
            return;
        }

        if (Number(basePrice) <= 0) {
            showMessage('Base Price must be a positive number.', 'warning');
            return;
        }

        if (address.trim().length < 3) {
            showMessage('Please enter a valid address.', 'warning');
            return;
        }

        if (contactNumber) {
            const phoneRegex = /^(98|97)[0-9]{8}$/;
            if (!phoneRegex.test(contactNumber)) {
                showMessage('Please enter a 10-digit contact number starting with 98 or 97.', 'warning');
                return;
            }
        }

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'hotel';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'hotel',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                hotel_name: hotelName,
                location_id: Number(locationId),
                address: address,
                description: description,
                star_rating: Number(starRating),
                hotel_type: hotelType,
                base_price: basePrice ? Number(basePrice) : undefined,
                total_rooms: totalRooms ? Number(totalRooms) : undefined,
                contact_number: contactNumber || null,
                email: email || null,
                image_url: imageUrl || null,
                is_active: Number(document.getElementById('hotelStatus').value)
            })
        });

        showMessage(`Hotel ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addHotelForm').reset();
        adminState.editingItem = null;
        switchSection('hotels');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save hotel', 'error');
    }
}

function editHotel(hotel) {
    adminState.editingItem = { type: 'hotel', id: Number(hotel.hotel_id) };

    // Switch to section
    switchSection('add-hotel');

    // Update titles
    document.getElementById('hotelFormTitle').textContent = 'Edit Hotel';
    document.getElementById('hotelSubmitBtn').textContent = 'Update Hotel';

    // Populate form
    document.getElementById('hotelName').value = hotel.hotel_name;
    document.getElementById('hotelLocationId').value = hotel.location_id;
    document.getElementById('hotelType').value = hotel.hotel_type;
    document.getElementById('hotelRating').value = hotel.star_rating;
    document.getElementById('hotelBasePrice').value = hotel.min_price_per_night ? Math.round(Number(hotel.min_price_per_night)) : 5000;
    document.getElementById('hotelTotalRooms').value = hotel.total_available_rooms || 10;
    document.getElementById('hotelAddress').value = hotel.address;
    document.getElementById('hotelContact').value = hotel.contact_number || '';
    document.getElementById('hotelEmail').value = hotel.email || '';
    document.getElementById('hotelDescription').value = hotel.description;
    document.getElementById('hotelImageUrl').value = hotel.image_url || '';
    document.getElementById('hotelStatus').value = hotel.is_active;
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
        const destinationsInput = document.getElementById('packageDestinations').value.trim();

        if (!packageName || !packageType || !durationDays || !durationNights || !basePrice || !description) {
            showMessage('Please fill in all required fields.', 'warning');
            return;
        }

        if (!destinationsInput) {
            showMessage('Please enter at least one destination.', 'warning');
            return;
        }

        if (!/^[a-zA-Z\s]+(,[a-zA-Z\s]+)*$/.test(destinationsInput)) {
            showMessage('Destinations must be valid names separated by commas (letters and spaces only, e.g. Kathmandu, Pokhara).', 'warning');
            return;
        }

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'package';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'package',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                package_name: packageName,
                package_type: packageType,
                description: description,
                duration_days: Number(durationDays),
                duration_nights: Number(durationNights),
                base_price: Number(basePrice),
                destinations: destinationsInput,
                currency: 'NPR',
                image_url: imageUrl || null,
                is_active: Number(document.getElementById('packageStatus').value)
            })
        });

        showMessage(`Package ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addPackageForm').reset();
        adminState.editingItem = null;
        switchSection('packages');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save package', 'error');
    }
}

function editPackage(pkg) {
    adminState.editingItem = { type: 'package', id: Number(pkg.package_id) };

    // Switch to section
    switchSection('add-package');

    // Update titles
    document.getElementById('packageFormTitle').textContent = 'Edit Package';
    document.getElementById('packageSubmitBtn').textContent = 'Update Package';

    // Populate form
    document.getElementById('packageName').value = pkg.package_name;
    document.getElementById('packageType').value = pkg.package_type;
    document.getElementById('packageDays').value = pkg.duration_days;
    document.getElementById('packageNights').value = pkg.duration_nights;
    document.getElementById('packagePrice').value = pkg.base_price;
    document.getElementById('packageDescription').value = pkg.description;
    document.getElementById('packageImageUrl').value = pkg.image_url || '';
    document.getElementById('packageStatus').value = pkg.is_active;
    document.getElementById('packageDestinations').value = pkg.destinations || '';
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

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'place';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'place',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                place_name: placeName,
                location_id: Number(locationId),
                category: category,
                description: description,
                image_url: imageUrl || null,
                is_active: 1
            })
        });

        showMessage(`Place ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addPlaceForm').reset();
        adminState.editingItem = null;
        switchSection('places');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save place', 'error');
    }
}

function editPlace(place) {
    adminState.editingItem = { type: 'place', id: Number(place.place_id) };

    // Switch to section
    switchSection('add-place');

    // Update titles
    document.getElementById('placeFormTitle').textContent = 'Edit Place';
    document.getElementById('placeSubmitBtn').textContent = 'Update Place';

    // Populate form
    document.getElementById('placeName').value = place.place_name;
    document.getElementById('placeLocationId').value = place.location_id;
    document.getElementById('placeCategory').value = place.category;
    document.getElementById('placeDescription').value = place.description;
    document.getElementById('placeImageUrl').value = place.image_url || '';
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

/**
 * FORM VALIDATION FUNCTIONS
 */

function validateFlightForm() {
    const originId = document.getElementById('flightOriginId').value;
    const destinationId = document.getElementById('flightDestinationId').value;
    const flightNumber = document.getElementById('flightNumber').value.trim();
    const duration = syncFlightDurationFromTimes();
    const seats = Number(document.getElementById('flightSeats').value);
    const price = Number(document.getElementById('flightPrice').value);

    if (originId === destinationId) {
        showMessage('Origin and destination cannot be the same', 'error');
        return false;
    }
    if (!/^[A-Za-z]{2}-[0-9]{3}$/.test(flightNumber)) {
        showMessage('Flight number must use the format yt-909', 'error');
        return false;
    }
    if (duration <= 0) {
        showMessage('Duration must be positive', 'error');
        return false;
    }
    if (seats <= 0) {
        showMessage('Total seats must be positive', 'error');
        return false;
    }
    if (price < 0) {
        showMessage('Price cannot be negative', 'error');
        return false;
    }
    
    return true;
}

function validateBusForm() {
    const originId = document.getElementById('busOriginId').value;
    const destinationId = document.getElementById('busDestinationId').value;
    const busNumber = document.getElementById('busNumber').value.trim();
    const duration = syncBusDurationFromTimes();
    const seats = Number(document.getElementById('busSeats').value);
    const price = Number(document.getElementById('busPrice').value);

    if (originId === destinationId) {
        showMessage('Origin and destination cannot be the same', 'error');
        return false;
    }
    if (!/^[A-Za-z]{2}-[0-9]{3}$/.test(busNumber)) {
        showMessage('Bus number must use the format yt-909', 'error');
        return false;
    }
    if (duration <= 0) {
        showMessage('Duration must be positive', 'error');
        return false;
    }
    if (seats <= 0) {
        showMessage('Total seats must be positive', 'error');
        return false;
    }
    if (price < 0) {
        showMessage('Price cannot be negative', 'error');
        return false;
    }
    return true;
}

function validateHotelForm() {
    const rating = Number(document.getElementById('hotelRating').value);
    if (rating < 0 || rating > 5) {
        showMessage('Star rating must be between 0 and 5', 'error');
        return false;
    }
    return true;
}

function validatePackageForm() {
    const days = Number(document.getElementById('packageDays').value);
    const nights = Number(document.getElementById('packageNights').value);
    const price = Number(document.getElementById('packagePrice').value);

    if (days <= 0) {
        showMessage('Duration days must be at least 1', 'error');
        return false;
    }
    if (nights < 0) {
        showMessage('Duration nights cannot be negative', 'error');
        return false;
    }
    if (price < 0) {
        showMessage('Price cannot be negative', 'error');
        return false;
    }
    return true;
}

function validatePlaceForm() {
    const name = document.getElementById('placeName').value.trim();
    if (name.length < 3) {
        showMessage('Place name is too short', 'error');
        return false;
    }
    return true;
}

function validateLocationForm() {
    const name = document.getElementById('locationName').value.trim();
    if (name.length < 2) {
        showMessage('Location name is too short', 'error');
        return false;
    }
    return true;
}

function validateAirlineForm() {
    const name = document.getElementById('airlineName').value.trim();
    const code = document.getElementById('airlineCode').value.trim();
    if (name.length < 2) {
        showMessage('Airline name is too short', 'error');
        return false;
    }
    if (code.length < 2) {
        showMessage('Airline code must be at least 2 characters', 'error');
        return false;
    }
    return true;
}

function validateOperatorForm() {
    const name = document.getElementById('operatorName').value.trim();
    const rating = Number(document.getElementById('operatorRating').value);
    if (name.length < 2) {
        showMessage('Operator name is too short', 'error');
        return false;
    }
    if (rating < 0 || rating > 5) {
        showMessage('Rating must be between 0 and 5', 'error');
        return false;
    }
    return true;
}

/**
 * RENDERING FUNCTIONS FOR SUPPORT TABLES
 */

function renderLocationsTable(locations) {
    const tbody = document.getElementById('locationsTableBody');
    if (!tbody) return;
    if (!locations.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No locations found</td></tr>';
        return;
    }
    tbody.innerHTML = locations.map(l => `
        <tr>
            <td>${l.location_id}</td>
            <td>${escapeHtml(l.location_name)}</td>
            <td>${escapeHtml(capitalize(l.location_type))}</td>
            <td>${escapeHtml(l.province || '-')}</td>
            <td>${escapeHtml(l.airport_code || '-')}</td>
            <td>${Number(l.is_popular) === 1 ? '⭐' : '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editLocation(${JSON.stringify(l).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteLocation(${l.location_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderAirlinesTable(airlines) {
    const tbody = document.getElementById('airlinesTableBody');
    if (!tbody) return;
    if (!airlines.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No airlines found</td></tr>';
        return;
    }
    tbody.innerHTML = airlines.map(a => `
        <tr>
            <td>${a.airline_id}</td>
            <td>${escapeHtml(a.airline_name)}</td>
            <td>${escapeHtml(a.airline_code)}</td>
            <td>${escapeHtml(a.contact_number || '-')}</td>
            <td>${Number(a.is_active) === 1 ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editAirline(${JSON.stringify(a).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAirline(${a.airline_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderOperatorsTable(operators) {
    const tbody = document.getElementById('operatorsTableBody');
    if (!tbody) return;
    if (!operators.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No operators found</td></tr>';
        return;
    }
    tbody.innerHTML = operators.map(o => `
        <tr>
            <td>${o.operator_id}</td>
            <td>${escapeHtml(o.operator_name)}</td>
            <td>${escapeHtml(o.contact_number || '-')}</td>
            <td>${o.rating || '-'}</td>
            <td>${Number(o.is_active) === 1 ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editOperator(${JSON.stringify(o).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOperator(${o.operator_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

/**
 * SUBMISSION FUNCTIONS
 */

async function submitNewLocation() {
    try {
        const name = document.getElementById('locationName').value;
        const type = document.getElementById('locationType').value;
        const province = document.getElementById('locationProvince').value;
        const airport = document.getElementById('locationAirport').value;
        const popular = document.getElementById('locationPopular').checked ? 1 : 0;

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'location';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'location',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                location_name: name,
                location_type: type,
                province: province,
                airport_code: airport || null,
                is_popular: popular
            })
        });

        showMessage(`Location ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addLocationForm').reset();
        adminState.editingItem = null;
        switchSection('locations');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save location', 'error');
    }
}

async function submitNewAirline() {
    try {
        const name = document.getElementById('airlineName').value;
        const code = document.getElementById('airlineCode').value;
        const contact = document.getElementById('airlineContact').value;

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'airline';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'airline',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                airline_name: name,
                airline_code: code,
                contact_number: contact || null,
                is_active: Number(document.getElementById('airlineStatus').value)
            })
        });

        showMessage(`Airline ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addAirlineForm').reset();
        adminState.editingItem = null;
        switchSection('airlines');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save airline', 'error');
    }
}

async function submitNewOperator() {
    try {
        const name = document.getElementById('operatorName').value;
        const contact = document.getElementById('operatorContact').value;
        const rating = document.getElementById('operatorRating').value;

        const isEditing = adminState.editingItem && adminState.editingItem.type === 'operator';

        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: isEditing ? 'PUT' : 'POST',
            body: JSON.stringify({
                item_type: 'operator',
                item_id: isEditing ? adminState.editingItem.id : undefined,
                operator_name: name,
                contact_number: contact || null,
                rating: Number(rating),
                is_active: Number(document.getElementById('operatorStatus').value)
            })
        });

        showMessage(`Operator ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        document.getElementById('addOperatorForm').reset();
        adminState.editingItem = null;
        switchSection('operators');
        await loadDashboardData();
    } catch (error) {
        showMessage(error.message || 'Unable to save operator', 'error');
    }
}

/**
 * Render analytical charts using Chart.js
 */
function renderCharts(bookings) {
    if (!window.Chart) return;

    // --- 1. Revenue Chart (Last 7 Days) ---
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revenueCtx) {
        // Destroy existing chart if it exists
        if (adminState.charts.revenue) adminState.charts.revenue.destroy();

        // Process data for last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueData = last7Days.map(date => {
            return bookings
                .filter(b => b.booking_status === 'confirmed' && b.booking_date.startsWith(date))
                .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        });

        adminState.charts.revenue = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Revenue (NPR)',
                    data: revenueData,
                    borderColor: '#DC143C',
                    backgroundColor: 'rgba(220, 20, 60, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#DC143C',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // --- 2. Booking Type Breakdown (Donut Chart) ---
    const typeCtx = document.getElementById('bookingTypeChart')?.getContext('2d');
    if (typeCtx) {
        if (adminState.charts.type) adminState.charts.type.destroy();

        const types = ['flight', 'bus', 'hotel', 'package'];
        const typeLabels = ['Flights', 'Buses', 'Hotels', 'Packages'];
        const typeCounts = types.map(t => bookings.filter(b => b.booking_type === t).length);

        adminState.charts.type = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: typeLabels,
                datasets: [{
                    data: typeCounts,
                    backgroundColor: ['#003893', '#DC143C', '#28a745', '#FFD700'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20, font: { weight: '600' } } }
                },
                cutout: '70%'
            }
        });
    }
}

/**
 * Export table data to CSV
 */
function exportTableToCSV(tableBodyId, filename) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    // Get headers from the table's head
    const table = tbody.closest('table');
    const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent.trim())
        .filter(text => text !== 'Actions'); // Don't export the Actions column

    // Get rows (only visible ones)
    const rows = Array.from(tbody.querySelectorAll('tr'))
        .filter(tr => tr.style.display !== 'none' && tr.cells.length > 1);

    const csvData = rows.map(tr => {
        return Array.from(tr.cells)
            .slice(0, headers.length) // Only take cells that have a matching header
            .map(td => {
                // Clean data: remove extra spaces, quotes, and commas
                let text = td.textContent.trim().replace(/"/g, '""');
                return `"${text}"`;
            }).join(',');
    });

    // Add headers to the top
    csvData.unshift(headers.map(h => `"${h}"`).join(','));

    const csvContent = "data:text/csv;charset=utf-8," + csvData.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Setup real-time filtering for tables
 */
function setupTableFilters() {
    const searchInputs = document.querySelectorAll('.search-input[data-filter-table]');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const tableId = e.target.getAttribute('data-filter-table');
            const tbody = document.getElementById(tableId);

            if (!tbody) return;

            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    });
}

/**
 * Setup global table sorting
 */
function setupTableSorting() {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const table = th.closest('table');
            const tbody = table.querySelector('tbody');
            const index = Array.from(th.parentNode.cells).indexOf(th);
            const isAsc = th.classList.contains('sort-asc');

            // Clear other headers
            th.parentNode.querySelectorAll('th').forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });

            const rows = Array.from(tbody.querySelectorAll('tr'));
            if (rows.length <= 1 && rows[0]?.cells.length === 1) return; // Skip empty tables

            const sortedRows = rows.sort((a, b) => {
                const aVal = a.cells[index]?.textContent.trim().toLowerCase();
                const bVal = b.cells[index]?.textContent.trim().toLowerCase();

                // Handle numbers and currency
                const aNum = parseFloat(aVal.replace(/[^0-9.-]+/g, ""));
                const bNum = parseFloat(bVal.replace(/[^0-9.-]+/g, ""));

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return isAsc ? bNum - aNum : aNum - bNum;
                }

                return isAsc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            });

            th.classList.toggle('sort-asc', !isAsc);
            th.classList.toggle('sort-desc', isAsc);

            tbody.append(...sortedRows);
        });
    });
}

/**
 * EDIT FUNCTIONS
 */

function editLocation(l) {
    adminState.editingItem = { type: 'location', id: Number(l.location_id) };
    switchSection('add-location');
    document.getElementById('locationFormTitle').textContent = 'Edit Location';
    document.getElementById('locationSubmitBtn').textContent = 'Update Location';

    document.getElementById('locationName').value = l.location_name;
    document.getElementById('locationType').value = l.location_type;
    document.getElementById('locationProvince').value = l.province;
    document.getElementById('locationAirport').value = l.airport_code || '';
    document.getElementById('locationPopular').checked = Number(l.is_popular) === 1;
}

function editAirline(a) {
    adminState.editingItem = { type: 'airline', id: Number(a.airline_id) };
    switchSection('add-airline');
    document.getElementById('airlineFormTitle').textContent = 'Edit Airline';
    document.getElementById('airlineSubmitBtn').textContent = 'Update Airline';

    document.getElementById('airlineName').value = a.airline_name;
    document.getElementById('airlineCode').value = a.airline_code;
    document.getElementById('airlineContact').value = a.contact_number || '';
    document.getElementById('airlineStatus').value = a.is_active;
}

function editOperator(o) {
    adminState.editingItem = { type: 'operator', id: Number(o.operator_id) };
    switchSection('add-operator');
    document.getElementById('operatorFormTitle').textContent = 'Edit Operator';
    document.getElementById('operatorSubmitBtn').textContent = 'Update Operator';

    document.getElementById('operatorName').value = o.operator_name;
    document.getElementById('operatorContact').value = o.contact_number || '';
    document.getElementById('operatorRating').value = o.rating || 4.0;
    document.getElementById('operatorStatus').value = o.is_active;
}

/**
 * DELETE FUNCTIONS
 */

async function deleteLocation(id) {
    try {
        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({ item_type: 'location', item_id: id })
        });
        showMessage('Location deleted', 'success');
        await loadDashboardData();
    } catch (error) { showMessage(error.message, 'error'); }
}

async function deleteAirline(id) {
    try {
        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({ item_type: 'airline', item_id: id })
        });
        showMessage('Airline deleted', 'success');
        await loadDashboardData();
    } catch (error) { showMessage(error.message, 'error'); }
}

async function deleteOperator(id) {
    try {
        await RoyalNepal.apiRequest('manage_inventory.php', {
            method: 'DELETE',
            body: JSON.stringify({ item_type: 'operator', item_id: id })
        });
        showMessage('Operator deleted', 'success');
        await loadDashboardData();
    } catch (error) { showMessage(error.message, 'error'); }
}
