/**
 * Royal Nepal - Buses Search Results (Bootstrap Enhanced)
 */

const API_BASE_URL = '../../backend/api';
let allBuses = [];
let filteredBuses = [];
let selectedBus = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');

    if (from && to && date) {
        displaySearchSummary(from, to, date);
        searchBuses(from, to, date);
    } else {
        // Load demo buses if no search params
        loadDemoBuses();
    }

    // Setup filter handlers
    document.getElementById('operatorFilter')?.addEventListener('change', applyFilters);
    document.getElementById('busTypeFilter')?.addEventListener('change', applyFilters);
    document.getElementById('sortFilter')?.addEventListener('change', applyFilters);
    document.getElementById('priceRange')?.addEventListener('input', function() {
        document.getElementById('priceValue').textContent = `NPR ${this.value}`;
        applyFilters();
    });
    
    // Update auth buttons
    updateAuthButtons();
});

/**
 * Update auth buttons based on login status
 */
function updateAuthButtons() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navAuth = document.getElementById('navAuth');
    
    if (navAuth && isLoggedIn && user.first_name) {
        navAuth.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-warning btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i>${user.first_name}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
    }
}

/**
 * Get demo buses
 */
function getDemoBuses() {
    return [
        {
            bus_id: 1,
            operator_name: 'Sajha Yatayat',
            bus_number: 'BA 1 KHA 2345',
            bus_type: 'deluxe',
            origin_name: 'Kathmandu',
            destination_name: 'Pokhara',
            departure_time: '06:30:00',
            arrival_time: '13:30:00',
            duration_minutes: 420,
            base_price: 1200,
            currency: 'NPR',
            available_seats: 25
        },
        {
            bus_id: 2,
            operator_name: 'Greenline Tours',
            bus_number: 'BA 2 KHA 5678',
            bus_type: 'ac',
            origin_name: 'Kathmandu',
            destination_name: 'Pokhara',
            departure_time: '07:00:00',
            arrival_time: '13:00:00',
            duration_minutes: 360,
            base_price: 1800,
            currency: 'NPR',
            available_seats: 12
        },
        {
            bus_id: 3,
            operator_name: 'Buddha Air Bus',
            bus_number: 'BA 3 KHA 9012',
            bus_type: 'sleeper',
            origin_name: 'Kathmandu',
            destination_name: 'Chitwan',
            departure_time: '21:00:00',
            arrival_time: '04:00:00',
            duration_minutes: 420,
            base_price: 1500,
            currency: 'NPR',
            available_seats: 8
        },
        {
            bus_id: 4,
            operator_name: 'Local Express',
            bus_number: 'BA 4 KHA 3456',
            bus_type: 'regular',
            origin_name: 'Pokhara',
            destination_name: 'Lumbini',
            departure_time: '08:00:00',
            arrival_time: '14:00:00',
            duration_minutes: 360,
            base_price: 800,
            currency: 'NPR',
            available_seats: 35
        }
    ];
}

/**
 * Load demo buses
 */
function loadDemoBuses() {
    document.getElementById('loadingState').style.display = 'none';
    allBuses = getDemoBuses();
    filteredBuses = [...allBuses];
    populateOperatorFilter(allBuses);
    applyFilters();
}

/**
 * Display search summary
 */
async function displaySearchSummary(fromId, toId, date) {
    const summaryEl = document.getElementById('searchSummary');
    if (!summaryEl) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_locations.php`);
        const data = await response.json();

        if (data.success) {
            const fromLocation = data.data.find(loc => loc.location_id == fromId);
            const toLocation = data.data.find(loc => loc.location_id == toId);
            
            summaryEl.innerHTML = `
                <span class="badge bg-light text-dark me-2"><i class="bi bi-geo-alt me-1"></i>${fromLocation?.location_name || 'Origin'}</span>
                <i class="bi bi-arrow-right text-white mx-2"></i>
                <span class="badge bg-light text-dark me-2"><i class="bi bi-geo-fill me-1"></i>${toLocation?.location_name || 'Destination'}</span>
                <span class="badge bg-warning text-dark"><i class="bi bi-calendar3 me-1"></i>${formatDate(date)}</span>
            `;
        }
    } catch (error) {
        console.error('Error loading location names:', error);
    }
}

/**
 * Search for buses
 */
async function searchBuses(from, to, date) {
    const loadingEl = document.getElementById('loadingState');
    const resultsEl = document.getElementById('busesContainer');
    const emptyEl = document.getElementById('emptyState');

    loadingEl.style.display = 'flex';
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_buses.php?origin=${from}&destination=${to}&date=${date}`
        );
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allBuses = data.data;
        } else {
            allBuses = getDemoBuses();
        }
        
        filteredBuses = [...allBuses];
        populateOperatorFilter(allBuses);
        applyFilters();
    } catch (error) {
        console.error('Error searching buses:', error);
        loadingEl.style.display = 'none';
        allBuses = getDemoBuses();
        filteredBuses = [...allBuses];
        populateOperatorFilter(allBuses);
        applyFilters();
    }
}

/**
 * Populate operator filter dropdown
 */
function populateOperatorFilter(buses) {
    const operators = [...new Set(buses.map(b => b.operator_name))];
    const filterSelect = document.getElementById('operatorFilter');
    if (!filterSelect) return;

    // Clear existing options except first
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    operators.forEach(operator => {
        const option = new Option(operator, operator);
        filterSelect.add(option);
    });
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('operatorFilter').value = '';
    document.getElementById('busTypeFilter').value = '';
    document.getElementById('sortFilter').value = 'price-asc';
    document.getElementById('priceRange').value = 5000;
    document.getElementById('priceValue').textContent = 'NPR 5000';
    applyFilters();
}

/**
 * Apply filters and sorting
 */
function applyFilters() {
    const operatorFilter = document.getElementById('operatorFilter')?.value || '';
    const typeFilter = document.getElementById('busTypeFilter')?.value || '';
    const priceFilter = document.getElementById('priceRange')?.value || 5000;
    const sortBy = document.getElementById('sortFilter')?.value || 'price-asc';

    filteredBuses = allBuses.filter(bus => {
        if (operatorFilter && bus.operator_name !== operatorFilter) return false;
        if (typeFilter && bus.bus_type !== typeFilter) return false;
        if (parseFloat(bus.base_price) > parseFloat(priceFilter)) return false;
        return true;
    });

    filteredBuses.sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return parseFloat(a.base_price) - parseFloat(b.base_price);
            case 'price-desc':
                return parseFloat(b.base_price) - parseFloat(a.base_price);
            case 'duration-asc':
                return parseInt(a.duration_minutes) - parseInt(b.duration_minutes);
            case 'departure-asc':
                return a.departure_time.localeCompare(b.departure_time);
            default:
                return 0;
        }
    });

    displayBuses(filteredBuses);
}

/**
 * Display buses
 */
function displayBuses(buses) {
    const resultsEl = document.getElementById('busesContainer');
    const emptyEl = document.getElementById('emptyState');

    if (buses.length === 0) {
        resultsEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    resultsEl.innerHTML = buses.map(bus => createBusCard(bus)).join('');
}

/**
 * Create Bootstrap bus card
 */
function createBusCard(bus) {
    const duration = formatDuration(bus.duration_minutes);
    const seatsClass = bus.available_seats > 10 ? 'text-success' : bus.available_seats > 0 ? 'text-warning' : 'text-danger';
    const busTypeClass = `badge-${bus.bus_type}`;
    
    return `
        <div class="col-12">
            <div class="bus-card animate__animated animate__fadeInUp">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <div class="d-flex align-items-center">
                            <div class="operator-logo me-3">
                                <i class="bi bi-bus-front fs-3"></i>
                            </div>
                            <div>
                                <h5 class="mb-1 fw-bold">${bus.operator_name}</h5>
                                <span class="text-muted small">${bus.bus_number}</span>
                                <div class="mt-1">
                                    <span class="bus-type-badge ${busTypeClass}">${bus.bus_type.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-5">
                        <div class="route-display">
                            <div class="text-center">
                                <div class="fw-bold fs-5">${formatTime(bus.departure_time)}</div>
                                <div class="text-muted small">${bus.origin_name}</div>
                            </div>
                            <div class="route-line">
                                <div class="route-dot start"></div>
                                <div class="route-path">
                                    <span class="duration-badge">${duration}</span>
                                </div>
                                <div class="route-dot end"></div>
                            </div>
                            <div class="text-center">
                                <div class="fw-bold fs-5">${formatTime(bus.arrival_time)}</div>
                                <div class="text-muted small">${bus.destination_name}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-2 text-center">
                        <div class="${seatsClass}">
                            <i class="bi bi-person-fill me-1"></i>
                            ${bus.available_seats > 0 ? `${bus.available_seats} seats` : 'Sold out'}
                        </div>
                    </div>
                    
                    <div class="col-md-2 text-end">
                        <div class="price-tag mb-2">
                            <span class="price-currency">${bus.currency}</span>
                            <span class="price-amount">${formatPrice(bus.base_price)}</span>
                        </div>
                        <button class="btn btn-book w-100" onclick="openBookingModal(${bus.bus_id})" ${bus.available_seats === 0 ? 'disabled' : ''}>
                            ${bus.available_seats === 0 ? 'Sold Out' : '<i class="bi bi-ticket-perforated me-1"></i>Book'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Open booking modal
 */
function openBookingModal(busId) {
    selectedBus = allBuses.find(b => b.bus_id === busId);
    if (!selectedBus) return;
    
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
        <div class="text-center mb-4">
            <div class="bus-type-badge badge-${selectedBus.bus_type} mb-3" style="font-size: 1rem; padding: 0.5rem 1.5rem;">
                ${selectedBus.bus_type.toUpperCase()}
            </div>
            <h4 class="fw-bold">${selectedBus.operator_name}</h4>
            <p class="text-muted">${selectedBus.bus_number}</p>
        </div>
        
        <div class="route-summary p-3 rounded mb-4" style="background: #f8f9fa;">
            <div class="d-flex justify-content-between align-items-center">
                <div class="text-center">
                    <div class="fw-bold fs-4">${formatTime(selectedBus.departure_time)}</div>
                    <div class="text-muted">${selectedBus.origin_name}</div>
                </div>
                <div class="text-center">
                    <i class="bi bi-arrow-right fs-4 text-primary"></i>
                    <div class="small text-muted">${formatDuration(selectedBus.duration_minutes)}</div>
                </div>
                <div class="text-center">
                    <div class="fw-bold fs-4">${formatTime(selectedBus.arrival_time)}</div>
                    <div class="text-muted">${selectedBus.destination_name}</div>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label fw-semibold">Number of Seats</label>
                <select class="form-select" id="seatCount">
                    ${[1,2,3,4,5].map(n => `<option value="${n}">${n} Seat${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Total Price</label>
                <div class="form-control bg-light fw-bold text-primary">${selectedBus.currency} ${formatPrice(selectedBus.base_price)}</div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

/**
 * Confirm booking
 */
function confirmBooking() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('Please login to book a bus', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
    showToast(`🚌 Booking confirmed for ${selectedBus.operator_name}!`, 'success');
}

/**
 * Show Bootstrap toast
 */
function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container');
    const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning text-dark' : 'bg-info';
    
    const toastHtml = `
        <div class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toast = new bootstrap.Toast(container.lastElementChild);
    toast.show();
}

/**
 * Format duration
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Format time
 */
function formatTime(time) {
    return time.substring(0, 5);
}

/**
 * Format price
 */
function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-US');
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Logout function
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}
