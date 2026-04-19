/*
    This script handles the functionality for the flight search results page.
    It fetches flight data based on URL parameters, provides filtering and sorting,
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

// Global variables to store flight data.
let allFlights = [];      // Holds all flights fetched from the API.
let filteredFlights = []; // Holds the flights after applying filters.
let selectedFlight = null;  // Holds the flight object selected for booking.

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters (from, to, date) from the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');

    // If search parameters are missing, redirect to the home page.
    if (!from || !to || !date) {
        window.location.href = 'home.html';
        return;
    }

    // Display a summary of the search in the page header.
    displaySearchSummary(from, to, date);

    // Fetch flights from the API based on the search criteria.
    searchFlights(from, to, date);

    // Set up event listeners for the filter and sort controls.
    document.getElementById('filter-airline').addEventListener('change', applyFilters);
    document.getElementById('filter-price').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('sort-by')?.addEventListener('change', applyFilters);
    
    // Update the navigation bar to show user info if logged in.
    updateAuthButtons();
});

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
 * A debounce function to limit the rate at which a function gets called.
 * This is useful for input events to prevent excessive function calls.
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
 * Resets all filters to their default values and re-applies them.
 */
function resetFilters() {
    document.getElementById('filter-airline').value = '';
    document.getElementById('filter-price').value = '';
    document.getElementById('sort-by').value = 'price-asc';
    applyFilters();
}

/**
 * Displays a summary of the current search (origin, destination, and date).
 * It fetches location names from the API to show readable names instead of IDs.
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
 * Fetches flight data from the API based on the search criteria.
 */
async function searchFlights(from, to, date) {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results-list');
    const noResultsEl = document.getElementById('no-results');

    if (loadingEl) loadingEl.style.display = 'block';
    if (resultsEl) resultsEl.innerHTML = '';
    if (noResultsEl) noResultsEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_flights.php?from=${from}&to=${to}&date=${date}`
        );
        const data = await response.json();

        if (loadingEl) loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allFlights = data.data;
            filteredFlights = [...allFlights];
            populateAirlineFilter(allFlights);
            applyFilters();
        } else {
            // Fallback to demo flights if the API returns no results.
            allFlights = getDemoFlights(from, to, date);
            filteredFlights = [...allFlights];
            populateAirlineFilter(allFlights);
            applyFilters();
        }
    } catch (error) {
        console.error('Error searching flights:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        // Fallback to demo flights on API error.
        allFlights = getDemoFlights(from, to, date);
        filteredFlights = [...allFlights];
        populateAirlineFilter(allFlights);
        applyFilters();
    }
}

/**
 * Returns a static array of demo flight data for testing purposes.
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
 * Populates the 'Airline' filter dropdown with unique airline names
 * from the fetched flight data.
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
 * Applies the selected filters and sorting to the list of flights.
 */
function applyFilters() {
    const airlineFilter = document.getElementById('filter-airline').value;
    const priceFilter = document.getElementById('filter-price').value;
    const sortBy = document.getElementById('sort-by').value;

    // Filter the flights based on the selected criteria.
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

    // Sort the filtered flights.
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

    // Display the filtered and sorted results.
    displayFlights(filteredFlights);
}

/**
 * Renders the list of flights on the page.
 */
function displayFlights(flights) {
    const resultsEl = document.getElementById('results-list');
    const resultsCountEl = document.getElementById('results-count');
    const noResultsEl = document.getElementById('no-results');

    if (resultsCountEl) {
        resultsCountEl.textContent = `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`;
    }

    if (!resultsEl) return;

    if (flights.length === 0) {
        resultsEl.innerHTML = '';
        if (noResultsEl) noResultsEl.style.display = 'block';
        return;
    }

    if (noResultsEl) noResultsEl.style.display = 'none';
    resultsEl.innerHTML = flights.map(flight => createFlightCard(flight)).join('');

    // Re-add event listeners to the "Book Now" buttons after rendering.
    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const flightId = btn.dataset.flightId;
            handleBooking(flightId);
        });
    });
}

/**
 * Creates the HTML for a single flight card.
 * @param {object} flight - The flight data object.
 * @returns {string} The HTML string for the flight card.
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
 * Opens the booking modal with the details of the selected flight.
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
 * Handles the booking confirmation.
 * It checks if the user is logged in before proceeding.
 */
async function confirmBooking() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showToast('Please login to book a flight', 'warning');
        setTimeout(() => {
            // Redirect to login page with a redirect-back URL.
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    try {
        const travelDate = new URLSearchParams(window.location.search).get('date') || new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/create_booking.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_type: 'flight',
                item_id: selectedFlight.flight_id,
                travel_date: travelDate,
                passengers: 1,
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
            // Blur the active element to prevent aria-hidden/focus warnings.
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
 * Shows a Bootstrap toast notification.
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
 * A wrapper function to handle the booking process.
 */
function handleBooking(flightId) {
    openBookingModal(flightId);
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
    return parseFloat(price).toLocaleString('en-NP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Helper function to format a date string into a more readable format.
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
