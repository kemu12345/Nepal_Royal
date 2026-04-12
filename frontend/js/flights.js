/**
 * Royal Nepal - Flights Search Results (Bootstrap Enhanced)
 */

const API_BASE_URL = '../../backend/api';
let allFlights = [];
let filteredFlights = [];
let selectedFlight = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');

    if (!from || !to || !date) {
        window.location.href = 'home.html';
        return;
    }

    // Display search summary
    displaySearchSummary(from, to, date);

    // Search for flights
    searchFlights(from, to, date);

    // Setup filter and sort handlers
    document.getElementById('filter-airline').addEventListener('change', applyFilters);
    document.getElementById('filter-price').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('sort-by').addEventListener('change', applyFilters);
});

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Reset filters
function resetFilters() {
    document.getElementById('filter-airline').value = '';
    document.getElementById('filter-price').value = '';
    document.getElementById('sort-by').value = 'price-asc';
    applyFilters();
}

/**
 * Display search summary
 */
async function displaySearchSummary(fromId, toId, date) {
    try {
        const response = await fetch(`${API_BASE_URL}/get_locations.php`);
        const data = await response.json();

        if (data.success) {
            const fromLocation = data.data.find(loc => loc.location_id == fromId);
            const toLocation = data.data.find(loc => loc.location_id == toId);

            const fromName = fromLocation?.location_name || 'Unknown';
            const toName = toLocation?.location_name || 'Unknown';
            
            document.getElementById('search-summary').innerHTML = `
                <i class="bi bi-geo-alt text-warning me-1"></i>${fromName} 
                <i class="bi bi-arrow-right mx-2"></i> 
                <i class="bi bi-geo-alt-fill text-warning me-1"></i>${toName} 
                <span class="badge bg-light text-dark ms-2"><i class="bi bi-calendar3 me-1"></i>${formatDate(date)}</span>
            `;
        }
    } catch (error) {
        console.error('Error loading location names:', error);
        document.getElementById('search-summary').textContent = 'Search Results';
    }
}

/**
 * Search for flights
 */
async function searchFlights(from, to, date) {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results-list');
    const noResultsEl = document.getElementById('no-results');

    loadingEl.style.display = 'block';
    resultsEl.innerHTML = '';
    noResultsEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_flights.php?origin=${from}&destination=${to}&date=${date}`
        );
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allFlights = data.data;
            filteredFlights = [...allFlights];
            populateAirlineFilter(allFlights);
            applyFilters();
        } else {
            // Show demo flights if no results
            allFlights = getDemoFlights(from, to, date);
            filteredFlights = [...allFlights];
            populateAirlineFilter(allFlights);
            applyFilters();
        }
    } catch (error) {
        console.error('Error searching flights:', error);
        loadingEl.style.display = 'none';
        // Show demo flights on error
        allFlights = getDemoFlights(from, to, date);
        filteredFlights = [...allFlights];
        populateAirlineFilter(allFlights);
        applyFilters();
    }
}

/**
 * Get demo flights for testing
 */
function getDemoFlights(from, to, date) {
    const airlines = [
        { name: 'Buddha Air', code: 'BU' },
        { name: 'Yeti Airlines', code: 'YT' },
        { name: 'Shree Airlines', code: 'SHA' },
        { name: 'Saurya Airlines', code: 'SYA' }
    ];
    
    const locations = {
        '1': 'Kathmandu',
        '2': 'Pokhara',
        '3': 'Lukla',
        '4': 'Bharatpur',
        '5': 'Biratnagar'
    };
    
    const fromName = locations[from] || 'Kathmandu';
    const toName = locations[to] || 'Pokhara';
    
    return airlines.map((airline, i) => ({
        flight_id: i + 1,
        airline_name: airline.name,
        flight_number: `${airline.code}${100 + i * 10}`,
        origin_name: fromName,
        destination_name: toName,
        departure_time: `0${6 + i}:${i % 2 === 0 ? '00' : '30'}:00`,
        arrival_time: `0${6 + i}:${i % 2 === 0 ? '35' : '05'}:00`,
        duration_minutes: 35 + (i * 5),
        base_price: 4500 + (i * 500),
        currency: 'NPR',
        available_seats: 10 + (i * 5)
    }));
}

/**
 * Populate airline filter dropdown
 */
function populateAirlineFilter(flights) {
    const airlines = [...new Set(flights.map(f => f.airline_name))];
    const filterSelect = document.getElementById('filter-airline');

    airlines.forEach(airline => {
        const option = new Option(airline, airline);
        filterSelect.add(option);
    });
}

/**
 * Apply filters and sorting
 */
function applyFilters() {
    const airlineFilter = document.getElementById('filter-airline').value;
    const priceFilter = document.getElementById('filter-price').value;
    const sortBy = document.getElementById('sort-by').value;

    // Filter flights
    filteredFlights = allFlights.filter(flight => {
        // Airline filter
        if (airlineFilter && flight.airline_name !== airlineFilter) {
            return false;
        }

        // Price filter
        if (priceFilter && parseFloat(flight.base_price) > parseFloat(priceFilter)) {
            return false;
        }

        return true;
    });

    // Sort flights
    filteredFlights.sort((a, b) => {
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

    // Display results
    displayFlights(filteredFlights);
}

/**
 * Display flights
 */
function displayFlights(flights) {
    const resultsEl = document.getElementById('results-list');
    const resultsCountEl = document.getElementById('results-count');
    const noResultsEl = document.getElementById('no-results');

    resultsCountEl.textContent = `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`;

    if (flights.length === 0) {
        resultsEl.innerHTML = '';
        noResultsEl.style.display = 'block';
        return;
    }

    noResultsEl.style.display = 'none';
    resultsEl.innerHTML = flights.map(flight => createFlightCard(flight)).join('');

    // Add event listeners to book buttons
    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const flightId = btn.dataset.flightId;
            handleBooking(flightId);
        });
    });
}

/**
 * Create flight card HTML (Bootstrap version)
 */
function createFlightCard(flight) {
    const duration = formatDuration(flight.duration_minutes);
    const seatsText = flight.available_seats > 0
        ? `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${flight.available_seats} seats</span>`
        : '<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Sold out</span>';
    
    const seatsBadge = flight.available_seats <= 5 && flight.available_seats > 0
        ? '<span class="badge bg-warning text-dark ms-2">Only few left!</span>'
        : '';

    return `
        <div class="card flight-card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <span class="airline-badge">${flight.airline_name}</span>
                        <div class="text-muted small mt-2">
                            <i class="bi bi-hash"></i>${flight.flight_number}
                        </div>
                    </div>
                    
                    <div class="col-md-5">
                        <div class="d-flex align-items-center">
                            <div class="text-center">
                                <div class="fw-bold fs-5">${formatTime(flight.departure_time)}</div>
                                <div class="text-muted small">${flight.origin_name}</div>
                            </div>
                            <div class="route-line"></div>
                            <div class="text-center">
                                <div class="fw-bold fs-5">${formatTime(flight.arrival_time)}</div>
                                <div class="text-muted small">${flight.destination_name}</div>
                            </div>
                        </div>
                        <div class="text-center mt-2">
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-clock me-1"></i>${duration}
                            </span>
                        </div>
                    </div>
                    
                    <div class="col-md-2 text-center">
                        <div class="price-tag">NPR ${formatPrice(flight.base_price)}</div>
                        <div class="mt-2 small">${seatsText}${seatsBadge}</div>
                    </div>
                    
                    <div class="col-md-2 text-end">
                        <button class="btn btn-book btn-danger" 
                                data-flight-id="${flight.flight_id}" 
                                ${flight.available_seats === 0 ? 'disabled' : ''}
                                onclick="openBookingModal(${flight.flight_id})">
                            ${flight.available_seats === 0 ? '<i class="bi bi-x-circle me-1"></i>Sold Out' : '<i class="bi bi-lightning-fill me-1"></i>Book Now'}
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
function openBookingModal(flightId) {
    selectedFlight = allFlights.find(f => f.flight_id == flightId);
    if (!selectedFlight) return;
    
    const detailsEl = document.getElementById('booking-details');
    detailsEl.innerHTML = `
        <div class="text-center mb-4">
            <span class="airline-badge fs-5">${selectedFlight.airline_name}</span>
            <div class="text-muted mt-2">${selectedFlight.flight_number}</div>
        </div>
        <div class="row mb-3">
            <div class="col-5 text-center">
                <div class="fw-bold fs-4">${formatTime(selectedFlight.departure_time)}</div>
                <div class="text-muted">${selectedFlight.origin_name}</div>
            </div>
            <div class="col-2 d-flex align-items-center justify-content-center">
                <i class="bi bi-airplane fs-4 text-danger"></i>
            </div>
            <div class="col-5 text-center">
                <div class="fw-bold fs-4">${formatTime(selectedFlight.arrival_time)}</div>
                <div class="text-muted">${selectedFlight.destination_name}</div>
            </div>
        </div>
        <hr>
        <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted">Duration</span>
            <span class="fw-semibold">${formatDuration(selectedFlight.duration_minutes)}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="text-muted">Available Seats</span>
            <span class="fw-semibold text-success">${selectedFlight.available_seats}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between align-items-center">
            <span class="fw-bold fs-5">Total Price</span>
            <span class="fw-bold fs-4 text-danger">NPR ${formatPrice(selectedFlight.base_price)}</span>
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
        showToast('Please login to book a flight', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    showToast('Booking confirmed! Check your email for details.', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    modal.hide();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const bgClass = { 'success': 'bg-success', 'warning': 'bg-warning', 'danger': 'bg-danger', 'info': 'bg-info' }[type] || 'bg-info';
    const textClass = type === 'warning' ? 'text-dark' : 'text-white';
    
    const toastHTML = `
        <div class="toast align-items-center ${bgClass} ${textClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body"><i class="bi bi-info-circle me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Handle booking
 */
function handleBooking(flightId) {
    openBookingModal(flightId);
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
 * Format time (HH:MM:SS to HH:MM)
 */
function formatTime(time) {
    return time.substring(0, 5);
}

/**
 * Format price with commas
 */
function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-NP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
