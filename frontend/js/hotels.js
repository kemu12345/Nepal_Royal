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
        // Otherwise, load all available hotels without filtering by location or dates.
        searchHotels('', '', '');
    }

    // Set up event listeners for the filter and sort controls.
    document.getElementById('filter-name')?.addEventListener('input', debounce(applyFilters, 300));
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
    return function (...args) {
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

    if (isLoggedIn && user.first_name && navAuth) {
        navAuth.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-warning btn-sm px-4 fw-semibold dropdown-toggle d-flex align-items-center" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle me-2"></i>${user.first_name}
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="${user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html'}"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout(); return false;"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
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
            amenities: 'WiFi,Pool,Spa,Restaurant,Bar',
            image_url: 'https://picsum.photos/id/164/600/300'
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
            amenities: 'WiFi,Pool,Garden,Restaurant',
            image_url: 'https://picsum.photos/id/145/600/300'
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
            amenities: 'WiFi,Heating,Restaurant',
            image_url: 'https://picsum.photos/id/1080/600/300'
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
            amenities: 'WiFi,Safari,Restaurant,Bar',
            image_url: 'https://picsum.photos/id/137/600/300'
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
            amenities: 'Meals,Heating',
            image_url: 'https://picsum.photos/id/16/600/300'
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
 * Helper to sanitize hotel name search input against XSS and invalid characters.
 */
function sanitizeHotelSearchInput(input) {
    if (!input) return '';
    // Strip malicious tags like <script>
    let clean = input.replace(/<\/?[\w\s="/.':;#-\/]+>/gi, '');
    // Allow only letters, numbers, and spaces
    clean = clean.replace(/[^a-zA-Z0-9\s]/g, '');
    return clean.slice(0, 100);
}

/**
 * Resets all filters to their default values and re-applies them.
 */
function resetFilters() {
    const nameEl = document.getElementById('filter-name');
    const typeEl = document.getElementById('filter-type');
    const ratingEl = document.getElementById('filter-rating');
    const sortEl = document.getElementById('sort-by');
    const priceEl = document.getElementById('filter-price');
    const nameErrEl = document.getElementById('filter-name-error');

    if (nameEl) nameEl.value = '';
    if (typeEl) typeEl.value = '';
    if (ratingEl) ratingEl.value = '';
    if (sortEl) sortEl.value = 'price-asc';
    if (priceEl) priceEl.value = '';
    if (nameErrEl) nameErrEl.style.display = 'none';

    applyFilters();
}

/**
 * Applies the selected filters and sorting to the list of hotels.
 */
function applyFilters() {
    const rawNameFilter = document.getElementById('filter-name')?.value || '';
    const nameErrEl = document.getElementById('filter-name-error');

    let nameFilter = '';
    if (rawNameFilter) {
        if (/[^a-zA-Z0-9\s]/.test(rawNameFilter) || /<script/i.test(rawNameFilter)) {
            if (nameErrEl) nameErrEl.style.display = 'block';
        } else {
            if (nameErrEl) nameErrEl.style.display = 'none';
        }
        nameFilter = sanitizeHotelSearchInput(rawNameFilter);
    } else {
        if (nameErrEl) nameErrEl.style.display = 'none';
    }

    const typeFilter = document.getElementById('filter-type')?.value || '';
    const ratingFilter = document.getElementById('filter-rating')?.value || '';
    const priceFilter = document.getElementById('filter-price')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'price-asc';

    // Filter the hotels based on the selected criteria.
    filteredHotels = allHotels.filter(hotel => {
        if (nameFilter) {
            if (!hotel.hotel_name || !hotel.hotel_name.toLowerCase().includes(nameFilter.toLowerCase())) {
                return false;
            }
        }
        if (typeFilter && hotel.hotel_type !== typeFilter) return false;
        if (ratingFilter && parseFloat(hotel.star_rating) < parseFloat(ratingFilter)) return false;
        
        // Fix: If a price filter is set, exclude hotels with no price or price above the limit
        if (priceFilter) {
            if (!hotel.base_price_per_night || parseFloat(hotel.base_price_per_night) > parseFloat(priceFilter)) {
                return false;
            }
        }
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
        if (emptyEl) {
            emptyEl.style.display = 'block';
            emptyEl.classList.add('animate__animated', 'animate__fadeIn');
        }
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
    const stars = '⭐'.repeat(Math.floor(hotel.star_rating || 3));
    const typeClass = `badge-${hotel.hotel_type || 'hotel'}`;
    const availableRooms = hotel.available_rooms !== undefined && hotel.available_rooms !== null ? parseInt(hotel.available_rooms) : 0;
    const roomsClass = availableRooms > 5 ? 'text-success' : availableRooms > 0 ? 'text-warning' : 'text-danger';
    const amenitiesStr = hotel.amenities || 'WiFi,Room Service';
    const amenities = amenitiesStr.split(',').slice(0, 4);

    const roomType = hotel.room_type || 'Standard Room';
    const maxGuests = hotel.max_guests || 2;
    const basePrice = hotel.base_price_per_night || 5000;
    const currency = hotel.currency || 'NPR';
    const roomId = hotel.room_id;

    const defaultImages = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&h=300&fit=crop'
    ];
    const imageIndex = (hotel.hotel_id || 1) % defaultImages.length;
    const fallbackImg = defaultImages[imageIndex];
    const imageUrl = hotel.image_url || fallbackImg;

    return `
        <div class="col-12">
            <div class="hotel-card animate__animated animate__fadeInUp">
                <div class="row">
                    <div class="col-md-4">
                        <div class="hotel-image" style="position: relative; overflow: hidden; height: 200px; background: #1a1a2e;">
                            <span class="hotel-type-badge ${typeClass}" style="position: absolute; top: 10px; left: 10px; z-index: 2;">${hotel.hotel_type}</span>
                            <img src="${imageUrl}" alt="${hotel.hotel_name}"
                                 onerror="if(this.src!=='${fallbackImg}'){this.src='${fallbackImg}';}else{this.onerror=null;this.src='https://via.placeholder.com/600x300?text=No+Image';}"
                                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
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
                                    <i class="bi bi-door-open me-1"></i>${roomType}
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
                                <span class="price-currency">${currency}</span>
                                <span class="price-amount">${formatPrice(basePrice)}</span>
                            </div>
                        </div>
                        <div class="${roomsClass} small mb-2">
                            <i class="bi bi-door-closed me-1"></i>
                            ${availableRooms > 0 ? `${availableRooms} rooms left` : 'No rooms'}
                        </div>
                        <button class="btn btn-book w-100" onclick="openBookingModal(${roomId})" ${(availableRooms === 0 || !roomId) ? 'disabled' : ''}>
                            ${(availableRooms === 0 || !roomId) ? 'Sold Out' : '<i class="bi bi-calendar-check me-1"></i>Book Now'}
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
    // Find the hotel by room_id or hotel_id, using loose equality to handle string/number mismatches.
    selectedHotel = allHotels.find(h => h.room_id == roomId);
    if (!selectedHotel) return;

    const stars = '⭐'.repeat(Math.floor(selectedHotel.star_rating || 3));

    const modalBody = document.getElementById('booking-details');
    modalBody.innerHTML = `
        <div class="text-center mb-4">
            <div class="hotel-type-badge badge-${selectedHotel.hotel_type || 'hotel'} mb-2" style="font-size: 0.9rem; padding: 0.4rem 1rem;">
                ${(selectedHotel.hotel_type || 'hotel').toUpperCase()}
            </div>
            <h4 class="fw-bold mb-1">${selectedHotel.hotel_name}</h4>
            <div class="star-rating">${stars}</div>
            <p class="text-muted"><i class="bi bi-geo-alt me-1"></i>${selectedHotel.location_name}</p>
        </div>
        
        <div class="room-details p-3 rounded mb-4" style="background: #f8f9fa;">
            <div class="row text-center">
                <div class="col-6">
                    <i class="bi bi-door-open fs-4 text-success"></i>
                    <div class="small mt-1" id="displayRoomType">${selectedHotel.room_type || 'Standard Room'}</div>
                </div>
                <div class="col-6">
                    <i class="bi bi-cash-stack fs-4 text-success"></i>
                    <div class="small mt-1" id="displayRoomPrice">${selectedHotel.currency || 'NPR'} ${formatPrice(selectedHotel.base_price_per_night || 5000)}/night</div>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label for="roomTypeSelect" class="form-label fw-semibold">Choose Room Type</label>
                <select class="form-select" id="roomTypeSelect">
                    <option value="1" data-name="Standard Room" data-price="${selectedHotel.base_price_per_night || 5000}">Standard Room (Base Price)</option>
                    <option value="1.5" data-name="Deluxe Room" data-price="${(selectedHotel.base_price_per_night || 5000) * 1.5}">Deluxe Room (+50%)</option>
                    <option value="2.5" data-name="Suite" data-price="${(selectedHotel.base_price_per_night || 5000) * 2.5}">Suite (+150%)</option>
                </select>
            </div>
            <div class="col-md-6">
                <div class="p-2 border rounded bg-light text-center h-100 d-flex flex-column justify-content-center">
                    <span class="text-muted small fw-bold">Total Price Estimator</span>
                    <h5 class="text-success mb-0 fw-bold" id="totalPriceDisplay">${selectedHotel.currency || 'NPR'} 0</h5>
                </div>
            </div>

            <div class="col-md-6">
                <label for="modalCheckin" class="form-label fw-semibold">Check-in Date</label>
                <input type="date" class="form-control" id="modalCheckin" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6">
                <label for="modalCheckout" class="form-label fw-semibold">Check-out Date</label>
                <input type="date" class="form-control" id="modalCheckout">
            </div>
            <div class="col-md-6">
                <label for="roomCount" class="form-label fw-semibold">Number of Rooms</label>
                <select class="form-select" id="roomCount">
                    ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n} Room${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-6">
                <label for="guestCount" class="form-label fw-semibold">Guests</label>
                <select class="form-select" id="guestCount">
                    ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n} Guest${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
                <div class="form-text text-danger small" id="guestValidationMsg" style="display: none;">Maximum 4 guests allowed per room</div>
            </div>
            
            <div class="col-md-6">
                <label for="contactNumber" class="form-label fw-semibold">Contact Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control" id="contactNumber" placeholder="e.g. 98XXXXXXXX" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                <div class="form-text text-danger small" id="contactValidationMsg" style="display: none;">Please enter a 10-digit number starting with 98 or 97.</div>
            </div>
            <div class="col-md-6">
                <label for="contactAddress" class="form-label fw-semibold">Address <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="contactAddress" placeholder="Your city/address" required>
                <div class="form-text text-danger small" id="addressValidationMsg" style="display: none;">Address is required.</div>
            </div>
        </div>
    `;

    function updateTotalPrice() {
        const checkin = document.getElementById('modalCheckin').value;
        const checkout = document.getElementById('modalCheckout').value;
        const rooms = parseInt(document.getElementById('roomCount').value) || 1;
        const roomTypeSelect = document.getElementById('roomTypeSelect');
        const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
        
        const pricePerNight = parseFloat(selectedOption.getAttribute('data-price')) || 0;
        const roomName = selectedOption.getAttribute('data-name');
        
        // Update top display
        const roomTypeEl = document.getElementById('displayRoomType');
        const roomPriceEl = document.getElementById('displayRoomPrice');
        if (roomTypeEl) roomTypeEl.innerText = roomName;
        if (roomPriceEl) roomPriceEl.innerText = `${selectedHotel.currency || 'NPR'} ${formatPrice(pricePerNight)}/night`;

        let nights = 0;
        if (checkin && checkout) {
            const d1 = new Date(checkin);
            const d2 = new Date(checkout);
            if (d2 > d1) {
                nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
            }
        }
        
        const total = nights * rooms * pricePerNight;
        const totalEl = document.getElementById('totalPriceDisplay');
        if (totalEl) {
            totalEl.innerText = total > 0 ? `${selectedHotel.currency || 'NPR'} ${formatPrice(total)}` : `${selectedHotel.currency || 'NPR'} 0`;
        }
    }

    // Pre-fill dates from URL if available.
    const urlParams = new URLSearchParams(window.location.search);
    const checkin = urlParams.get('checkin');
    const checkout = urlParams.get('checkout');

    if (checkin) document.getElementById('modalCheckin').value = checkin;
    if (checkout) document.getElementById('modalCheckout').value = checkout;

    // Attach listeners for price calculation
    ['modalCheckin', 'modalCheckout', 'roomCount', 'roomTypeSelect'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateTotalPrice);
    });
    
    // Initial calculation
    updateTotalPrice();

    // Add event listener for guest count validation
    document.getElementById('guestCount')?.addEventListener('change', (e) => {
        const msgEl = document.getElementById('guestValidationMsg');
        if (msgEl) {
            msgEl.style.display = e.target.value >= 5 ? 'block' : 'none';
        }
    });

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('bookingModal'));
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
        
        // Add validation for 5 guests
        if (guests >= 5) {
            const msgEl = document.getElementById('guestValidationMsg');
            if (msgEl) msgEl.style.display = 'block';
            showToast('Sorry, we do not accept 5 or more guests in a single room', 'warning');
            return;
        }

        const contactNumber = document.getElementById('contactNumber').value.trim();
        const contactAddress = document.getElementById('contactAddress').value.trim();
        
        // Validate contact number (exactly 10 digits starting with 98 or 97)
        const phoneRegex = /^(98|97)[0-9]{8}$/;
        if (!phoneRegex.test(contactNumber)) {
            document.getElementById('contactValidationMsg').style.display = 'block';
            return;
        } else {
            document.getElementById('contactValidationMsg').style.display = 'none';
        }
        
        if (!contactAddress) {
            document.getElementById('addressValidationMsg').style.display = 'block';
            return;
        } else {
            document.getElementById('addressValidationMsg').style.display = 'none';
        }

        const roomTypeSelect = document.getElementById('roomTypeSelect');
        const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
        const priceMultiplier = parseFloat(roomTypeSelect.value);
        const roomTypeName = selectedOption.getAttribute('data-name');

        const nights = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)));

        const response = await fetch(`${API_BASE_URL}/create_booking.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_type: 'hotel',
                item_id: selectedHotel.room_id || selectedHotel.hotel_id,
                check_in: checkin,
                check_out: checkout,
                nights,
                rooms,
                guests,
                price_multiplier: priceMultiplier,
                guest_details: [
                    {
                        contact: contactNumber,
                        address: contactAddress,
                        room_preference: roomTypeName
                    }
                ]
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
    return parseFloat(price || 0).toLocaleString('en-NP', {
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
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Handles the user logout process.
 */
function logout() {
    if (window.RoyalNepalRoutes) {
        window.RoyalNepalRoutes.logoutToHome();
        return;
    }

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.replace('home.html');
}
