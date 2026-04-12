/**
 * Royal Nepal - Home Page JavaScript (Bootstrap Enhanced)
 * Homepage search portal, navigation, and dynamic features
 */

const API_BASE_URL = '../../backend/api';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
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
 * Navbar scroll effect
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
    handleScroll(); // Initial check
}

/**
 * Back to top button
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
 * Update auth buttons based on login status
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
                    <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                    <li><a class="dropdown-item" href="#"><i class="bi bi-clipboard-check me-2"></i>My Bookings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}

/**
 * Initialize date pickers
 */
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Set checkout date to tomorrow by default
    const checkin = document.getElementById('hotel-checkin');
    const checkout = document.getElementById('hotel-checkout');
    
    if (checkin && checkout) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        checkout.value = tomorrow.toISOString().split('T')[0];
        checkout.min = tomorrow.toISOString().split('T')[0];
        
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
 * Initialize form handlers
 */
function initFormHandlers() {
    document.getElementById('flightSearchForm')?.addEventListener('submit', handleFlightSearch);
    document.getElementById('busSearchForm')?.addEventListener('submit', handleBusSearch);
    document.getElementById('hotelSearchForm')?.addEventListener('submit', handleHotelSearch);
}

/**
 * Load locations into dropdowns
 */
async function loadLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_locations.php`);
        const data = await response.json();

        if (data.success) {
            populateLocationDropdowns(data.data);
        } else {
            // Use fallback data if API fails
            populateLocationDropdowns(getFallbackLocations());
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        // Use fallback data
        populateLocationDropdowns(getFallbackLocations());
    }
}

/**
 * Get fallback locations when API is unavailable
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
 * Populate all location dropdowns
 */
function populateLocationDropdowns(locations) {
    // Flight dropdowns (airports only)
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

    // Bus dropdowns (cities)
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

    // Hotel dropdown (all popular locations)
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
 * Handle flight search
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

    // Redirect to flights page with parameters
    window.location.href = `flights.html?from=${from}&to=${to}&date=${date}`;
}

/**
 * Handle bus search
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

    // Redirect to buses page with parameters
    window.location.href = `buses.html?from=${from}&to=${to}&date=${date}`;
}

/**
 * Handle hotel search
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

    // Redirect to hotels page with parameters
    window.location.href = `hotels.html?city=${city}&checkin=${checkin}&checkout=${checkout}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
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
    
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Initialize floating particles effect
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
    
    // Add particle animation CSS
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
 * Initialize scroll animations
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
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    document.querySelectorAll('.destination-card, .service-card, .feature-card, .testimonials-section .card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}
