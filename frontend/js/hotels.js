/**
 * Royal Nepal - Hotels Search Results (Bootstrap Enhanced)
 */

const API_BASE_URL = '../../backend/api';
let allHotels = [];
let filteredHotels = [];
let selectedHotel = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');
    const checkin = urlParams.get('checkin');
    const checkout = urlParams.get('checkout');

    if (city && checkin && checkout) {
        displaySearchSummary(city, checkin, checkout);
        searchHotels(city, checkin, checkout);
    } else {
        // Load demo hotels
        loadDemoHotels();
    }

    // Setup filter handlers
    document.getElementById('hotelTypeFilter')?.addEventListener('change', applyFilters);
    document.getElementById('starFilter')?.addEventListener('change', applyFilters);
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
 * Get demo hotels
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
 * Load demo hotels
 */
function loadDemoHotels() {
    document.getElementById('loadingState').style.display = 'none';
    allHotels = getDemoHotels();
    filteredHotels = [...allHotels];
    applyFilters();
}

/**
 * Display search summary
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
 * Calculate nights between dates
 */
function calculateNights(checkin, checkout) {
    const date1 = new Date(checkin);
    const date2 = new Date(checkout);
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Search for hotels
 */
async function searchHotels(city, checkin, checkout) {
    const loadingEl = document.getElementById('loadingState');
    const resultsEl = document.getElementById('hotelsContainer');
    const emptyEl = document.getElementById('emptyState');

    loadingEl.style.display = 'flex';
    resultsEl.innerHTML = '';
    emptyEl.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/get_hotels.php?location=${city}&checkin=${checkin}&checkout=${checkout}`
        );
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allHotels = data.data;
        } else {
            allHotels = getDemoHotels();
        }
        
        filteredHotels = [...allHotels];
        applyFilters();
    } catch (error) {
        console.error('Error searching hotels:', error);
        loadingEl.style.display = 'none';
        allHotels = getDemoHotels();
        filteredHotels = [...allHotels];
        applyFilters();
    }
}

/**
 * Reset all filters
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
 * Apply filters and sorting
 */
function applyFilters() {
    const typeFilter = document.getElementById('hotelTypeFilter')?.value || '';
    const ratingFilter = document.getElementById('starFilter')?.value || '';
    const priceFilter = document.getElementById('priceRange')?.value || 20000;
    const sortBy = document.getElementById('sortFilter')?.value || 'rating-desc';

    filteredHotels = allHotels.filter(hotel => {
        if (typeFilter && hotel.hotel_type !== typeFilter) return false;
        if (ratingFilter && parseFloat(hotel.star_rating) < parseFloat(ratingFilter)) return false;
        if (parseFloat(hotel.base_price_per_night) > parseFloat(priceFilter)) return false;
        return true;
    });

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

    displayHotels(filteredHotels);
}

/**
 * Display hotels
 */
function displayHotels(hotels) {
    const resultsEl = document.getElementById('hotelsContainer');
    const emptyEl = document.getElementById('emptyState');

    if (hotels.length === 0) {
        resultsEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    resultsEl.innerHTML = hotels.map(hotel => createHotelCard(hotel)).join('');
}

/**
 * Create Bootstrap hotel card
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
 * Open booking modal
 */
function openBookingModal(roomId) {
    selectedHotel = allHotels.find(h => h.room_id === roomId);
    if (!selectedHotel) return;
    
    const stars = '⭐'.repeat(Math.floor(selectedHotel.star_rating));
    
    const modalBody = document.getElementById('bookingModalBody');
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
 * Confirm booking
 */
function confirmBooking() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('Please login to book a hotel', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    const checkin = document.getElementById('modalCheckin').value;
    if (!checkin) {
        showToast('Please select check-in date', 'warning');
        return;
    }
    
    bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
    showToast(`🏨 Booking confirmed at ${selectedHotel.hotel_name}!`, 'success');
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
