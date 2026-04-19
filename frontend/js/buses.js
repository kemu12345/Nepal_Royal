/*
    This script handles the functionality for the bus search results page.
    It fetches bus data based on URL parameters, provides filtering and sorting options,
    and manages the booking process through a modal.
*/

// Resolve backend API URL for common local development modes.
const API_BASE_URL = (() => {
    const { origin, protocol, port, hostname, pathname } = window.location;
    
    if (protocol === 'file:' || port === '5500' || port === '5501') {
        return `http://${hostname || 'localhost'}:8000/backend/api`;
    }
    
    const parts = pathname.split('/');
    const index = parts.findIndex(part => part.toLowerCase() === 'nepal_royal');
    if (index !== -1) {
        const projectBase = parts.slice(0, index + 1).join('/');
        return `${origin}${projectBase}/backend/api`;
    }
    
    return '../../backend/api';
})();

// Global variables to store bus data.
let allBuses = [];      // Holds all buses fetched from the API.
let filteredBuses = []; // Holds the buses after applying filters.
let selectedBus = null; // Holds the bus object selected for booking.

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters (from, to, date) from the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');

    // If search parameters exist, fetch buses from the API.
    if (from && to && date) {
        displaySearchSummary(from, to, date);
        searchBuses(from, to, date);
    } else {
        // If no search parameters, load demo data for display purposes.
        loadDemoBuses();
    }

    // Set up event listeners for the filter and sort controls.
    document.getElementById('filter-operator')?.addEventListener('change', applyFilters);
    document.getElementById('filter-type')?.addEventListener('change', applyFilters);
    document.getElementById('sort-by')?.addEventListener('change', applyFilters);
    document.getElementById('filter-price')?.addEventListener('input', debounce(applyFilters, 300));
    
    // Update the navigation bar to show user info if logged in.
    updateAuthButtons();
});

/**
 * A debounce function to limit the rate at which a function gets called.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Updates the authentication buttons in the navigation bar to show the user's name
 * and a dropdown menu if they are logged in.
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
 * Returns a static array of demo bus data.
 * This is used for frontend development and testing when the backend is not available.
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
 * Loads the demo bus data into the page.
 */
function loadDemoBuses() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    allBuses = getDemoBuses();
    filteredBuses = [...allBuses];
    populateOperatorFilter(allBuses);
    applyFilters();
}

/**
 * Displays a summary of the current search (origin, destination, and date)
 * in the page header. It fetches location names from the API.
 */
async function displaySearchSummary(fromId, toId, date) {
    const summaryEl = document.getElementById('searchSummary');
    if (!summaryEl) return;
    
    try {
        // Fetch location data to get names from IDs.
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
 * Fetches bus data from the API based on the search criteria.
 */
async function searchBuses(from, to, date) {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results-list');
    const emptyEl = document.getElementById('no-results');

    if (loadingEl) loadingEl.style.display = 'block';
    if (resultsEl) resultsEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_buses.php?from=${from}&to=${to}&date=${date}`
        );
        const data = await response.json();

        if (loadingEl) loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allBuses = data.data;
        } else {
            // Fallback to demo buses if the API returns no data.
            allBuses = getDemoBuses();
        }
        
        filteredBuses = [...allBuses];
        populateOperatorFilter(allBuses);
        applyFilters();
    } catch (error) {
        console.error('Error searching buses:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        // Fallback to demo buses on API error.
        allBuses = getDemoBuses();
        filteredBuses = [...allBuses];
        populateOperatorFilter(allBuses);
        applyFilters();
    }
}

/**
 * Populates the 'Operator' filter dropdown with unique operator names
 * from the fetched bus data.
 */
function populateOperatorFilter(buses) {
    const operators = [...new Set(buses.map(b => b.operator_name))];
    const filterSelect = document.getElementById('filter-operator');
    if (!filterSelect) return;

    // Clear existing options but keep the "All Operators" default.
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    operators.forEach(operator => {
        const option = new Option(operator, operator);
        filterSelect.add(option);
    });
}

/**
 * Resets all filters to their default values and re-applies them.
 */
function resetFilters() {
    const opFilter = document.getElementById('filter-operator');
    const typeFilter = document.getElementById('filter-type');
    const sortFilter = document.getElementById('sort-by');
    const priceFilter = document.getElementById('filter-price');

    if (opFilter) opFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortFilter) sortFilter.value = 'price-asc';
    if (priceFilter) priceFilter.value = '';
    
    applyFilters();
}

/**
 * Applies the selected filters and sorting to the list of buses.
 */
function applyFilters() {
    const operatorFilter = document.getElementById('filter-operator')?.value || '';
    const typeFilter = document.getElementById('filter-type')?.value || '';
    const priceFilter = document.getElementById('filter-price')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'price-asc';

    // Filter the buses based on the selected criteria.
    filteredBuses = allBuses.filter(bus => {
        if (operatorFilter && bus.operator_name !== operatorFilter) return false;
        if (typeFilter && bus.bus_type !== typeFilter) return false;
        if (parseFloat(bus.base_price) > parseFloat(priceFilter)) return false;
        return true;
    });

    // Sort the filtered buses.
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
 * Renders the list of buses on the page.
 */
function displayBuses(buses) {
    const resultsEl = document.getElementById('results-list');
    const resultsCountEl = document.getElementById('results-count');
    const emptyEl = document.getElementById('no-results');

    if (resultsCountEl) {
        resultsCountEl.textContent = `${buses.length} bus${buses.length !== 1 ? 'es' : ''} found`;
    }

    if (!resultsEl) return;

    if (buses.length === 0) {
        resultsEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    resultsEl.innerHTML = buses.map(bus => createBusCard(bus)).join('');
}

/**
 * Creates the HTML for a single bus card.
 * @param {object} bus - The bus data object.
 * @returns {string} The HTML string for the bus card.
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
 * Opens the booking modal with the details of the selected bus.
 */
function openBookingModal(busId) {
    selectedBus = allBuses.find(b => b.bus_id === busId);
    if (!selectedBus) return;
    
    const modalBody = document.getElementById('booking-details');
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
 * Handles the booking confirmation.
 * It checks if the user is logged in before proceeding.
 */
async function confirmBooking() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // If not logged in, hide the modal and redirect to the login page.
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('Please login to book a bus', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    try {
        const seats = Number.parseInt(document.getElementById('seatCount')?.value || '1', 10);
        const travelDate = new URLSearchParams(window.location.search).get('date') || new Date().toISOString().split('T')[0];

        const response = await fetch(`${API_BASE_URL}/create_booking.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_type: 'bus',
                item_id: selectedBus.bus_id,
                travel_date: travelDate,
                passengers: seats,
                passenger_details: []
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Booking failed');
        }

        showToast('Booking confirmed! Redirecting to your dashboard...', 'success');
        
        const modalEl = document.getElementById('bookingModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            // Blur the active element (like the close button) to prevent aria-hidden/focus warnings.
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            modal.hide();
        }
        
        // Redirect to dashboard after a short delay so the user can see the success message.
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } catch (error) {
        showToast(error.message || 'Unable to create booking', 'danger');
    }
}

/**
 * Shows a Bootstrap toast message at the bottom of the page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast ('info', 'success', 'warning').
 */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }
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
 * Helper function to format duration from minutes to a "Xh Ym" string.
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Helper function to format time from "HH:MM:SS" to "HH:MM".
 */
function formatTime(time) {
    return time.substring(0, 5);
}

/**
 * Helper function to format a number as a price string with commas.
 */
function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-US');
}

/**
 * Helper function to format a date string into a more readable format.
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
 * Logs the user out and reloads the page.
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}
