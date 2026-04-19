/*
    This script handles the functionality for the hotel search results page.
    It fetches hotel data based on URL parameters, provides filtering and sorting,
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

// Global variables to store hotel data.
let allHotels = [];      // Holds all hotels fetched from the API.
let filteredHotels = []; // Holds the hotels after applying filters.
let selectedHotel = null;  // Holds the hotel object selected for booking.

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters (city, check-in, check-out) from the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    const checkin = urlParams.get('checkin');
    const checkout = urlParams.get('checkout');

    // If search parameters are present, fetch hotels from the API.
    if (city && checkin && checkout) {
        displaySearchSummary(city, checkin, checkout);
        searchHotels(city, checkin, checkout);
    } else {
        // Otherwise, load a default set of demo hotels for display.
        loadDemoHotels();
    }

    // Set up event listeners for the filter and sort controls.
    document.getElementById('filter-type')?.addEventListener('change', applyFilters);
    document.getElementById('filter-rating')?.addEventListener('change', applyFilters);
    document.getElementById('sort-by')?.addEventListener('change', applyFilters);
    document.getElementById('filter-price')?.addEventListener('input', debounce(applyFilters, 300));
    
    // Update the authentication buttons based on the user's login status.
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
 * Updates the authentication buttons in the navbar.
 * If the user is logged in, it shows a dropdown with their name and a logout link.
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
 * Returns a static array of demo hotel data for testing or when the API is unavailable.
 */
function getDemoHotels() {
    return [
        {
            hotel_id: 1,
            hotel_name: 'Hotel Yak & Yeti',
            hotel_type: 'hotel',
            star_rating: 5,
            location_name: 'Kathmandu',
            address: 'Durbar Marg, Kathmandu',
            room_id: 1,
            room_type: 'Deluxe Room',
            max_guests: 2,
            base_price_per_night: 12000,
            currency: 'NPR',
            available_rooms: 8,
            amenities: 'WiFi,Pool,Spa,Restaurant,Bar'
        },
        {
            hotel_id: 2,
            hotel_name: 'Temple Tree Resort',
            hotel_type: 'resort',
            star_rating: 4,
            location_name: 'Pokhara',
            address: 'Lakeside, Pokhara',
            room_id: 2,
            room_type: 'Garden View Room',
            max_guests: 2,
            base_price_per_night: 8500,
            currency: 'NPR',
            available_rooms: 12,
            amenities: 'WiFi,Pool,Garden,Restaurant'
        },
        {
            hotel_id: 3,
            hotel_name: 'Everest Guest House',
            hotel_type: 'guesthouse',
            star_rating: 3,
            location_name: 'Namche Bazaar',
            address: 'Main Street, Namche',
            room_id: 3,
            room_type: 'Mountain View',
            max_guests: 2,
            base_price_per_night: 3500,
            currency: 'NPR',
            available_rooms: 5,
            amenities: 'WiFi,Heating,Restaurant'
        },
        {
            hotel_id: 4,
            hotel_name: 'Chitwan Tiger Lodge',
            hotel_type: 'resort',
            star_rating: 4,
            location_name: 'Chitwan',
            address: 'Sauraha, Chitwan',
            room_id: 4,
            room_type: 'Jungle Cottage',
            max_guests: 3,
            base_price_per_night: 6500,
            currency: 'NPR',
            available_rooms: 10,
            amenities: 'WiFi,Safari,Restaurant,Bar'
        },
        {
            hotel_id: 5,
            hotel_name: 'Himalayan Teahouse',
            hotel_type: 'teahouse',
            star_rating: 2,
            location_name: 'Lukla',
            address: 'Lukla Village',
            room_id: 5,
            room_type: 'Basic Room',
            max_guests: 2,
            base_price_per_night: 1500,
            currency: 'NPR',
            available_rooms: 8,
            amenities: 'Meals,Heating'
        }
    ];
}

/**
 * Loads and displays the demo hotel data.
 */
function loadDemoHotels() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    allHotels = getDemoHotels();
    filteredHotels = [...allHotels];
    applyFilters();
}

/**
 * Displays a summary of the current search (city, dates, and number of nights).
 */
async function displaySearchSummary(cityId, checkin, checkout) {
    const summaryEl = document.getElementById('searchSummary');
    if (!summaryEl) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/get_locations.php`);
        const data = await response.json();

        if (data.success) {
            const location = data.data.find(loc => loc.location_id == cityId);
            const nights = calculateNights(checkin, checkout);

            summaryEl.innerHTML = `
                <span class="badge bg-light text-dark me-2"><i class="bi bi-geo-alt me-1"></i>${location?.location_name || 'City'}</span>
                <span class="badge bg-light text-dark me-2"><i class="bi bi-calendar3 me-1"></i>${formatDate(checkin)} - ${formatDate(checkout)}</span>
                <span class="badge bg-warning text-dark"><i class="bi bi-moon me-1"></i>${nights} Night${nights !== 1 ? 's' : ''}</span>
            `;
        }
    } catch (error) {
        console.error('Error loading location name:', error);
    }
}

/**
 * Calculates the number of nights between two dates.
 */
function calculateNights(checkin, checkout) {
    const date1 = new Date(checkin);
    const date2 = new Date(checkout);
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fetches hotel data from the API based on the search criteria.
 */
async function searchHotels(city, checkin, checkout) {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results-list');
    const emptyEl = document.getElementById('no-results');

    if (loadingEl) loadingEl.style.display = 'block';
    if (resultsEl) resultsEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_hotels.php?city=${city}&checkin=${checkin}&checkout=${checkout}`
        );
        const data = await response.json();

        if (loadingEl) loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allHotels = data.data;
        } else {
            // Fallback to demo hotels if the API returns no results.
            allHotels = getDemoHotels();
        }
        
        filteredHotels = [...allHotels];
        applyFilters();
    } catch (error) {
        console.error('Error searching hotels:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        // Fallback to demo hotels on API error.
        allHotels = getDemoHotels();
        filteredHotels = [...allHotels];
        applyFilters();
    }
}

/**
 * Resets all filters to their default values and re-applies them.
 */
function resetFilters() {
    document.getElementById('hotelTypeFilter').value = '';
    document.getElementById('starFilter').value = '';
    document.getElementById('sortFilter').value = 'rating-desc';
    document.getElementById('priceRange').value = 20000;
    document.getElementById('priceValue').textContent = 'NPR 20000';
    applyFilters();
}

/**
 * Applies the selected filters and sorting to the list of hotels.
 */
function applyFilters() {
    const typeFilter = document.getElementById('filter-type')?.value || '';
    const ratingFilter = document.getElementById('filter-rating')?.value || '';
    const priceFilter = document.getElementById('filter-price')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'price-asc';

    // Filter the hotels based on the selected criteria.
    filteredHotels = allHotels.filter(hotel => {
        if (typeFilter && hotel.hotel_type !== typeFilter) return false;
        if (ratingFilter && parseFloat(hotel.star_rating) < parseFloat(ratingFilter)) return false;
        if (parseFloat(hotel.base_price_per_night) > parseFloat(priceFilter)) return false;
        return true;
    });

    // Sort the filtered hotels.
    filteredHotels.sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return parseFloat(a.base_price_per_night) - parseFloat(b.base_price_per_night);
            case 'price-desc':
                return parseFloat(b.base_price_per_night) - parseFloat(a.base_price_per_night);
            case 'rating-desc':
                return parseFloat(b.star_rating) - parseFloat(a.star_rating);
            case 'name-asc':
                return a.hotel_name.localeCompare(b.hotel_name);
            default:
                return 0;
        }
    });

    // Display the filtered and sorted results.
    displayHotels(filteredHotels);
}

/**
 * Renders the list of hotels on the page.
 */
function displayHotels(hotels) {
    const resultsEl = document.getElementById('results-list');
    const resultsCountEl = document.getElementById('results-count');
    const emptyEl = document.getElementById('no-results');

    if (resultsCountEl) {
        resultsCountEl.textContent = `${hotels.length} hotel${hotels.length !== 1 ? 's' : ''} found`;
    }

    if (!resultsEl) return;

    if (hotels.length === 0) {
        resultsEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    resultsEl.innerHTML = hotels.map(hotel => createHotelCard(hotel)).join('');
}

/**
 * Creates the HTML for a single hotel card.
 * @param {object} hotel - The hotel data object.
 * @returns {string} The HTML string for the hotel card.
 */
function createHotelCard(hotel) {
    const stars = '⭐'.repeat(Math.floor(hotel.star_rating));
    const typeClass = `badge-${hotel.hotel_type}`;
    const roomsClass = hotel.available_rooms > 5 ? 'text-success' : hotel.available_rooms > 0 ? 'text-warning' : 'text-danger';
    const amenities = hotel.amenities ? hotel.amenities.split(',').slice(0, 4) : [];
    
    return `
        <div class="col-12">
            <div class="hotel-card animate__animated animate__fadeInUp">
                <div class="row">
                    <div class="col-md-4">
                        <div class="hotel-image">
                            <span class="hotel-type-badge ${typeClass}">${hotel.hotel_type}</span>
                            <div class="d-flex align-items-center justify-content-center h-100">
                                <i class="bi bi-building fs-1 text-white"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-5">
                        <div class="p-3">
                            <h4 class="fw-bold mb-1">${hotel.hotel_name}</h4>
                            <div class="star-rating mb-2">${stars}</div>
                            <p class="text-muted mb-2">
                                <i class="bi bi-geo-alt me-1"></i>${hotel.location_name}
                                <span class="ms-2 text-muted small">${hotel.address || ''}</span>
                            </p>
                            
                            <div class="room-info mb-3">
                                <span class="badge bg-light text-dark me-2">
                                    <i class="bi bi-door-open me-1"></i>${hotel.room_type}
                                </span>
                                <span class="badge bg-light text-dark">
                                    <i class="bi bi-people me-1"></i>Max ${hotel.max_guests} Guests
                                </span>
                            </div>
                            
                            <div class="amenities">
                                ${amenities.map(a => `<span class="amenity-tag"><i class="bi bi-check-circle me-1"></i>${a.trim()}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 d-flex flex-column justify-content-center align-items-center p-3 border-start">
                        <div class="text-center mb-3">
                            <span class="text-muted small">per night</span>
                            <div class="price-tag">
                                <span class="price-currency">${hotel.currency}</span>
                                <span class="price-amount">${formatPrice(hotel.base_price_per_night)}</span>
                            </div>
                        </div>
                        <div class="${roomsClass} small mb-2">
                            <i class="bi bi-door-closed me-1"></i>
                            ${hotel.available_rooms > 0 ? `${hotel.available_rooms} rooms left` : 'No rooms'}
                        </div>
                        <button class="btn btn-book w-100" onclick="openBookingModal(${hotel.room_id})" ${hotel.available_rooms === 0 ? 'disabled' : ''}>
                            ${hotel.available_rooms === 0 ? 'Sold Out' : '<i class="bi bi-calendar-check me-1"></i>Book Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Opens the booking modal with the details of the selected hotel.
 */
function openBookingModal(roomId) {
    selectedHotel = allHotels.find(h => h.room_id === roomId);
    if (!selectedHotel) return;
    
    const stars = '⭐'.repeat(Math.floor(selectedHotel.star_rating));
    
    const modalBody = document.getElementById('booking-details');
    modalBody.innerHTML = `
        <div class="text-center mb-4">
            <div class="hotel-type-badge badge-${selectedHotel.hotel_type} mb-2" style="font-size: 0.9rem; padding: 0.4rem 1rem;">
                ${selectedHotel.hotel_type.toUpperCase()}
            </div>
            <h4 class="fw-bold mb-1">${selectedHotel.hotel_name}</h4>
            <div class="star-rating">${stars}</div>
            <p class="text-muted"><i class="bi bi-geo-alt me-1"></i>${selectedHotel.location_name}</p>
        </div>
        
        <div class="room-details p-3 rounded mb-4" style="background: #f8f9fa;">
            <div class="row text-center">
                <div class="col-4">
                    <i class="bi bi-door-open fs-4 text-success"></i>
                    <div class="small mt-1">${selectedHotel.room_type}</div>
                </div>
                <div class="col-4">
                    <i class="bi bi-people fs-4 text-success"></i>
                    <div class="small mt-1">Max ${selectedHotel.max_guests} Guests</div>
                </div>
                <div class="col-4">
                    <i class="bi bi-cash-stack fs-4 text-success"></i>
                    <div class="small mt-1">${selectedHotel.currency} ${formatPrice(selectedHotel.base_price_per_night)}/night</div>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label fw-semibold">Check-in Date</label>
                <input type="date" class="form-control" id="modalCheckin" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Check-out Date</label>
                <input type="date" class="form-control" id="modalCheckout">
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Number of Rooms</label>
                <select class="form-select" id="roomCount">
                    ${[1,2,3].map(n => `<option value="${n}">${n} Room${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Guests</label>
                <select class="form-select" id="guestCount">
                    ${[1,2,3,4].map(n => `<option value="${n}">${n} Guest${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
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
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('Please login to book a hotel', 'warning');
        setTimeout(() => {
            // Redirect to login page with a redirect-back URL.
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    const checkin = document.getElementById('modalCheckin').value;
    const checkout = document.getElementById('modalCheckout').value;
    if (!checkin || !checkout) {
        showToast('Please select check-in date', 'warning');
        return;
    }

    if (new Date(checkout) <= new Date(checkin)) {
        showToast('Check-out must be after check-in', 'warning');
        return;
    }

    try {
        const rooms = Number.parseInt(document.getElementById('roomCount')?.value || '1', 10);
        const guests = Number.parseInt(document.getElementById('guestCount')?.value || '1', 10);
        const nights = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)));

        const response = await fetch(`${API_BASE_URL}/create_booking.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_type: 'hotel',
                item_id: selectedHotel.room_id,
                check_in: checkin,
                check_out: checkout,
                nights,
                rooms,
                guests,
                guest_details: []
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
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Handles the user logout process.
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}
