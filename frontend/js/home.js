/*
    This script manages the functionality of the home page.
    It handles the search forms, navigation bar effects, user authentication status,
    and other dynamic features like animations and particles.
*/

// Base URL for the backend API.
const API_BASE_URL = '../../backend/api';

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all the features for the home page.
    initNavbarScroll();
    initBackToTop();
    initAuthButtons();
    loadLocations();
    initDatePickers();
    initFormHandlers();
    initParticles();
    initAnimations();
});

/**
 * Adds a scroll effect to the main navigation bar.
 * The navbar becomes more opaque when the user scrolls down.
 */
function initNavbarScroll() {
    const navbar = document.getElementById('mainNavbar');
    
    const handleScroll = () => {
        if (window.scrollY > 100) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run on page load to set initial state.
}

/**
 * Initializes the "Back to Top" button, which appears after scrolling down.
 */
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Updates the authentication buttons in the navbar based on login status.
 * If logged in, it shows a user dropdown with dashboard and logout links.
 */
function initAuthButtons() {
    const authButtons = document.getElementById('authButtons');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (authButtons && isLoggedIn) {
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-warning btn-sm dropdown-toggle px-3" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i>${user.first_name || 'User'}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="pages/dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                    <li><a class="dropdown-item" href="pages/dashboard.html?tab=bookings"><i class="bi bi-clipboard-check me-2"></i>My Bookings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
    }
}

/**
 * Handles the user logout process by clearing session data from local storage.
 */
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}

/**
 * Initializes date pickers, setting minimum dates to today
 * and handling dependencies between check-in and check-out dates.
 */
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Set hotel check-out date to tomorrow by default.
    const checkin = document.getElementById('hotel-checkin');
    const checkout = document.getElementById('hotel-checkout');
    
    if (checkin && checkout) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        checkout.value = tomorrow.toISOString().split('T')[0];
        checkout.min = tomorrow.toISOString().split('T')[0];
        
        // Ensure check-out date is always after check-in date.
        checkin.addEventListener('change', () => {
            const nextDay = new Date(checkin.value);
            nextDay.setDate(nextDay.getDate() + 1);
            checkout.min = nextDay.toISOString().split('T')[0];
            if (new Date(checkout.value) <= new Date(checkin.value)) {
                checkout.value = nextDay.toISOString().split('T')[0];
            }
        });
    }
}

/**
 * Attaches submit event listeners to the search forms.
 */
function initFormHandlers() {
    document.getElementById('flightSearchForm')?.addEventListener('submit', handleFlightSearch);
    document.getElementById('busSearchForm')?.addEventListener('submit', handleBusSearch);
    document.getElementById('hotelSearchForm')?.addEventListener('submit', handleHotelSearch);
}

/**
 * Fetches location data from the API and populates the dropdowns.
 * Uses a fallback if the API call fails.
 */
async function loadLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_locations.php`);
        const data = await response.json();

        if (data.success) {
            populateLocationDropdowns(data.data);
        } else {
            // Use fallback data if API returns an error.
            populateLocationDropdowns(getFallbackLocations());
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        // Use fallback data on network error.
        populateLocationDropdowns(getFallbackLocations());
    }
}

/**
 * Returns a static array of location data for testing or when the API is down.
 */
function getFallbackLocations() {
    return [
        { location_id: 1, location_name: 'Kathmandu', airport_code: 'KTM', location_type: 'city', is_popular: 1 },
        { location_id: 2, location_name: 'Pokhara', airport_code: 'PKR', location_type: 'city', is_popular: 1 },
        { location_id: 3, location_name: 'Lukla', airport_code: 'LUA', location_type: 'town', is_popular: 1 },
        { location_id: 4, location_name: 'Bharatpur', airport_code: 'BHR', location_type: 'city', is_popular: 1 },
        { location_id: 5, location_name: 'Biratnagar', airport_code: 'BIR', location_type: 'city', is_popular: 0 },
        { location_id: 6, location_name: 'Nepalgunj', airport_code: 'KEP', location_type: 'city', is_popular: 0 },
        { location_id: 7, location_name: 'Chitwan', location_type: 'district', is_popular: 1 },
        { location_id: 8, location_name: 'Lumbini', location_type: 'city', is_popular: 1 },
    ];
}

/**
 * Populates the location dropdowns for flights, buses, and hotels
 * based on the location type.
 */
function populateLocationDropdowns(locations) {
    // Flight dropdowns (only show locations with an airport code).
    const airportLocations = locations.filter(loc => loc.airport_code);

    const flightFromSelect = document.getElementById('flight-from');
    const flightToSelect = document.getElementById('flight-to');

    airportLocations.forEach(loc => {
        if (flightFromSelect) {
            const option = new Option(`${loc.location_name} (${loc.airport_code})`, loc.location_id);
            flightFromSelect.add(option);
        }
        if (flightToSelect) {
            const option = new Option(`${loc.location_name} (${loc.airport_code})`, loc.location_id);
            flightToSelect.add(option);
        }
    });

    // Bus dropdowns (only show cities and districts).
    const cityLocations = locations.filter(loc => loc.location_type === 'city' || loc.location_type === 'district');

    const busFromSelect = document.getElementById('bus-from');
    const busToSelect = document.getElementById('bus-to');

    cityLocations.forEach(loc => {
        if (busFromSelect) {
            const option = new Option(loc.location_name, loc.location_id);
            busFromSelect.add(option);
        }
        if (busToSelect) {
            const option = new Option(loc.location_name, loc.location_id);
            busToSelect.add(option);
        }
    });

    // Hotel dropdown (only show popular locations).
    const hotelCitySelect = document.getElementById('hotel-city');
    const popularLocations = locations.filter(loc => loc.is_popular == 1);

    popularLocations.forEach(loc => {
        if (hotelCitySelect) {
            const option = new Option(loc.location_name, loc.location_id);
            hotelCitySelect.add(option);
        }
    });
}

/**
 * Handles the flight search form submission.
 * Validates input and redirects to the flights page with search parameters.
 */
function handleFlightSearch(e) {
    e.preventDefault();

    const from = document.getElementById('flight-from').value;
    const to = document.getElementById('flight-to').value;
    const date = document.getElementById('flight-date').value;

    if (!from || !to || !date) {
        showToast('Please fill all fields', 'warning');
        return;
    }
    
    if (from === to) {
        showToast('Origin and destination cannot be the same', 'warning');
        return;
    }

    // Redirect to the flights page with search parameters in the URL.
    window.location.href = `pages/flights.html?from=${from}&to=${to}&date=${date}`;
}

/**
 * Handles the bus search form submission.
 * Validates input and redirects to the buses page with search parameters.
 */
function handleBusSearch(e) {
    e.preventDefault();

    const from = document.getElementById('bus-from').value;
    const to = document.getElementById('bus-to').value;
    const date = document.getElementById('bus-date').value;

    if (!from || !to || !date) {
        showToast('Please fill all fields', 'warning');
        return;
    }
    
    if (from === to) {
        showToast('Origin and destination cannot be the same', 'warning');
        return;
    }

    // Redirect to the buses page with search parameters in the URL.
    window.location.href = `pages/buses.html?from=${from}&to=${to}&date=${date}`;
}

/**
 * Handles the hotel search form submission.
 * Validates input and redirects to the hotels page with search parameters.
 */
function handleHotelSearch(e) {
    e.preventDefault();

    const city = document.getElementById('hotel-city').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;

    if (!city || !checkin || !checkout) {
        showToast('Please fill all fields', 'warning');
        return;
    }

    if (new Date(checkout) <= new Date(checkin)) {
        showToast('Check-out date must be after check-in date', 'warning');
        return;
    }

    // Redirect to the hotels page with search parameters in the URL.
    window.location.href = `pages/hotels.html?city=${city}&checkin=${checkin}&checkout=${checkout}`;
}

/**
 * Displays a Bootstrap toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast (success, warning, danger, info).
 */
function showToast(message, type = 'info') {
    // Create a container for toasts if it doesn't already exist.
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const bgClass = {
        'success': 'bg-success',
        'warning': 'bg-warning',
        'danger': 'bg-danger',
        'info': 'bg-info'
    }[type] || 'bg-info';
    
    const textClass = type === 'warning' ? 'text-dark' : 'text-white';
    
    const toastHTML = `
        <div class="toast align-items-center ${bgClass} ${textClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-info-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    
    // Remove the toast from the DOM after it's hidden.
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Initializes a floating particles animation in the background.
 */
function initParticles() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        particles.appendChild(particle);
    }
    
    // Add the keyframe animation CSS to the document's head.
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initializes scroll-triggered animations for various elements on the page
 * using the Intersection Observer API.
 */
function initAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target); // Stop observing after animation.
            }
        });
    }, observerOptions);
    
    // Observe cards and sections to apply the fade-in animation.
    document.querySelectorAll('.destination-card, .service-card, .feature-card, .testimonials-section .card').forEach(el => {
        el.style.opacity = '0'; // Hide element initially.
        observer.observe(el);
    });
}
