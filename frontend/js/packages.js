/*
    This script handles the functionality for the tour packages page.
    It fetches package data from the API, provides filtering and sorting options,
    and manages the booking process through a modal.
*/

// Base URL for the backend API.
const API_BASE_URL = '../../backend/api';

// Global variables to store package data.
let allPackages = [];      // Holds all packages fetched from the API.
let filteredPackages = []; // Holds the packages after applying filters.
let selectedPackage = null;  // Holds the package object selected for booking.

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Load all tour packages from the API.
    loadPackages();
    
    // Set up event listeners for the filter and sort controls.
    document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
    document.getElementById('durationFilter')?.addEventListener('change', applyFilters);
    document.getElementById('priceFilter')?.addEventListener('change', applyFilters);
    document.getElementById('sortFilter')?.addEventListener('change', applyFilters);
    
    // Update the authentication buttons based on the user's login status.
    updateAuthButtons();
});

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
 * Returns a static array of demo package data for testing or when the API is unavailable.
 */
function getDemoPackages() {
    return [
        {
            package_id: 1,
            package_name: 'Everest Base Camp Trek',
            package_type: 'trekking',
            difficulty_level: 'hard',
            duration_days: 14,
            duration_nights: 13,
            base_price: 1850,
            currency: 'USD',
            description: 'The iconic trek to the base of the world\'s highest peak. Experience Sherpa culture, stunning mountain views, and the thrill of standing at 5,364m.',
            is_featured: 1
        },
        {
            package_id: 2,
            package_name: 'Annapurna Circuit Adventure',
            package_type: 'adventure',
            difficulty_level: 'moderate',
            duration_days: 18,
            duration_nights: 17,
            base_price: 1650,
            currency: 'USD',
            description: 'Circle the entire Annapurna massif through diverse landscapes from subtropical to alpine. Cross the famous Thorong La Pass at 5,416m.',
            is_featured: 1
        },
        {
            package_id: 3,
            package_name: 'Kathmandu Valley Cultural Tour',
            package_type: 'cultural',
            difficulty_level: 'easy',
            duration_days: 5,
            duration_nights: 4,
            base_price: 450,
            currency: 'USD',
            description: 'Explore the UNESCO World Heritage sites of Kathmandu, Patan, and Bhaktapur. Discover ancient temples, palaces, and living traditions.',
            is_featured: 0
        },
        {
            package_id: 4,
            package_name: 'Chitwan Wildlife Safari',
            package_type: 'wildlife',
            difficulty_level: 'easy',
            duration_days: 4,
            duration_nights: 3,
            base_price: 380,
            currency: 'USD',
            description: 'Experience the jungle of Chitwan National Park. Spot one-horned rhinos, Bengal tigers, and over 500 bird species.',
            is_featured: 0
        },
        {
            package_id: 5,
            package_name: 'Muktinath Pilgrimage Journey',
            package_type: 'pilgrimage',
            difficulty_level: 'moderate',
            duration_days: 7,
            duration_nights: 6,
            base_price: 890,
            currency: 'USD',
            description: 'Visit the sacred Muktinath Temple, holy to both Hindus and Buddhists. Journey through dramatic high-altitude landscapes.',
            is_featured: 0
        },
        {
            package_id: 6,
            package_name: 'Langtang Valley Trek',
            package_type: 'trekking',
            difficulty_level: 'moderate',
            duration_days: 10,
            duration_nights: 9,
            base_price: 950,
            currency: 'USD',
            description: 'Trek through the beautiful Langtang Valley, known as the "Valley of Glaciers". Experience Tamang culture and stunning Himalayan scenery.',
            is_featured: 0
        }
    ];
}

/**
 * Fetches package data from the API and displays it.
 * Shows loading and empty states as needed.
 */
async function loadPackages() {
    const loadingEl = document.getElementById('loadingState');
    const packagesEl = document.getElementById('packagesContainer');
    const emptyEl = document.getElementById('emptyState');

    loadingEl.style.display = 'flex';
    packagesEl.innerHTML = '';
    emptyEl.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/get_packages.php`);
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allPackages = data.data;
        } else {
            // Fallback to demo packages if the API returns no results.
            allPackages = getDemoPackages();
        }
        
        filteredPackages = [...allPackages];
        applyFilters();
    } catch (error) {
        console.error('Error loading packages:', error);
        loadingEl.style.display = 'none';
        // Fallback to demo packages on API error.
        allPackages = getDemoPackages();
        filteredPackages = [...allPackages];
        applyFilters();
    }
}

/**
 * Resets all filters to their default values and re-applies them.
 */
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('durationFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortFilter').value = 'popular';
    applyFilters();
}

/**
 * Applies the selected filters and sorting to the list of packages.
 */
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const durationFilter = document.getElementById('durationFilter')?.value || '';
    const priceFilter = document.getElementById('priceFilter')?.value || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'popular';

    // Filter the packages based on the selected criteria.
    filteredPackages = allPackages.filter(pkg => {
        // Category filter
        if (categoryFilter && pkg.package_type !== categoryFilter) {
            return false;
        }

        // Duration filter
        if (durationFilter) {
            const days = parseInt(pkg.duration_days);
            switch (durationFilter) {
                case '1-3':
                    if (days < 1 || days > 3) return false;
                    break;
                case '4-7':
                    if (days < 4 || days > 7) return false;
                    break;
                case '8-14':
                    if (days < 8 || days > 14) return false;
                    break;
                case '15+':
                    if (days < 15) return false;
                    break;
            }
        }

        // Price filter
        if (priceFilter) {
            const price = parseFloat(pkg.base_price);
            switch (priceFilter) {
                case 'budget':
                    if (price >= 500) return false;
                    break;
                case 'mid':
                    if (price < 500 || price > 1500) return false;
                    break;
                case 'luxury':
                    if (price < 1500) return false;
                    break;
            }
        }

        return true;
    });

    // Sort the filtered packages.
    filteredPackages.sort((a, b) => {
        switch (sortBy) {
            case 'popular':
                // Prioritize featured packages.
                if (a.is_featured && !b.is_featured) return -1;
                if (!a.is_featured && b.is_featured) return 1;
                return 0;
            case 'price-low':
                return parseFloat(a.base_price) - parseFloat(b.base_price);
            case 'price-high':
                return parseFloat(b.base_price) - parseFloat(a.base_price);
            case 'duration':
                return parseInt(a.duration_days) - parseInt(b.duration_days);
            default:
                return 0;
        }
    });

    // Display the filtered and sorted results.
    displayPackages(filteredPackages);
}

/**
 * Renders the list of packages on the page.
 */
function displayPackages(packages) {
    const packagesEl = document.getElementById('packagesContainer');
    const emptyEl = document.getElementById('emptyState');

    if (packages.length === 0) {
        packagesEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    packagesEl.innerHTML = packages.map(pkg => createPackageCard(pkg)).join('');
}

/**
 * Creates the HTML for a single package card.
 * @param {object} pkg - The package data object.
 * @returns {string} The HTML string for the package card.
 */
function createPackageCard(pkg) {
    const badgeClass = `badge-${pkg.package_type}`;
    const typeEmoji = getTypeEmoji(pkg.package_type);
    const highlights = getDefaultHighlights(pkg.package_type);
    const featuredRibbon = pkg.is_featured == 1 ? '<div class="position-absolute top-0 start-0 bg-warning text-dark px-3 py-1 fw-bold" style="border-radius: 20px 0 15px 0;"><i class="bi bi-star-fill me-1"></i>FEATURED</div>' : '';

    return `
        <div class="col-md-6 col-lg-4">
            <div class="package-card animate__animated animate__fadeInUp">
                <div class="package-image">
                    ${featuredRibbon}
                    <div class="d-flex align-items-center justify-content-center h-100 text-white" style="font-size: 4rem;">
                        ${typeEmoji}
                    </div>
                    <span class="package-badge ${badgeClass}">${pkg.package_type}</span>
                    <span class="package-duration"><i class="bi bi-calendar3 me-1"></i>${pkg.duration_days}D/${pkg.duration_nights}N</span>
                    <div class="package-price-tag">$${formatPrice(pkg.base_price)}</div>
                </div>
                <div class="package-body">
                    <h5 class="package-title">${pkg.package_name}</h5>
                    <p class="text-muted small mb-3">${pkg.description ? pkg.description.substring(0, 100) + '...' : 'Amazing Nepal experience awaits you!'}</p>
                    
                    <ul class="package-highlights">
                        ${highlights.map(h => `<li><i class="bi bi-check-circle-fill"></i>${h}</li>`).join('')}
                    </ul>
                    
                    <div class="package-meta">
                        <div class="meta-item">
                            <i class="bi bi-speedometer"></i>
                            <span>${pkg.difficulty_level}</span>
                        </div>
                        <div class="meta-item">
                            <i class="bi bi-people-fill"></i>
                            <span>Group</span>
                        </div>
                        <div class="meta-item">
                            <i class="bi bi-geo-alt-fill"></i>
                            <span>Nepal</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-book" onclick="openBookingModal(${pkg.package_id})">
                        <i class="bi bi-gift me-2"></i>Book Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Returns an emoji corresponding to the package type.
 */
function getTypeEmoji(type) {
    const emojis = {
        'trekking': '🥾',
        'adventure': '🏔️',
        'cultural': '🏛️',
        'wildlife': '🐘',
        'pilgrimage': '🙏'
    };
    return emojis[type] || '🎒';
}

/**
 * Returns a default list of highlights based on the package type.
 */
function getDefaultHighlights(type) {
    const highlights = {
        'trekking': ['Professional guide', 'Teahouse stays', 'Permits included'],
        'cultural': ['UNESCO sites', 'Local guide', 'Traditional meals'],
        'wildlife': ['Jungle safari', 'Expert naturalist', 'Lodge stay'],
        'adventure': ['Safety equipment', 'Expert guides', 'Insurance'],
        'pilgrimage': ['Spiritual guide', 'Temple visits', 'Ceremonies']
    };
    return highlights[type] || ['Professional guide', 'All meals', 'Transport'];
}

/**
 * Opens the booking modal with the details of the selected package.
 */
function openBookingModal(packageId) {
    selectedPackage = allPackages.find(p => p.package_id === packageId);
    if (!selectedPackage) return;
    
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="d-flex align-items-center justify-content-center rounded" style="height: 200px; background: linear-gradient(135deg, #6f42c1, #4a1d96); font-size: 5rem;">
                    ${getTypeEmoji(selectedPackage.package_type)}
                </div>
            </div>
            <div class="col-md-6">
                <h4 class="fw-bold text-primary">${selectedPackage.package_name}</h4>
                <p class="text-muted">${selectedPackage.description || 'Amazing experience awaits!'}</p>
                
                <div class="d-flex gap-2 mb-3">
                    <span class="badge bg-purple">${selectedPackage.package_type}</span>
                    <span class="badge bg-secondary">${selectedPackage.difficulty_level}</span>
                </div>
                
                <div class="row text-center">
                    <div class="col-4">
                        <i class="bi bi-calendar3 fs-4 text-purple"></i>
                        <div class="small text-muted mt-1">${selectedPackage.duration_days} Days</div>
                    </div>
                    <div class="col-4">
                        <i class="bi bi-moon-fill fs-4 text-purple"></i>
                        <div class="small text-muted mt-1">${selectedPackage.duration_nights} Nights</div>
                    </div>
                    <div class="col-4">
                        <i class="bi bi-cash-stack fs-4 text-purple"></i>
                        <div class="small text-muted mt-1">$${formatPrice(selectedPackage.base_price)}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <hr class="my-4">
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label fw-semibold">Travel Date</label>
                <input type="date" class="form-control" id="travelDate" min="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Number of Travelers</label>
                <select class="form-select" id="travelers">
                    <option value="1">1 Person</option>
                    <option value="2" selected>2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5+ People (Group)</option>
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
function confirmBooking() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        showToast('Please login to book a package', 'warning');
        setTimeout(() => {
            // Redirect to login page with a redirect-back URL.
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    const travelDate = document.getElementById('travelDate').value;
    if (!travelDate) {
        showToast('Please select a travel date', 'warning');
        return;
    }
    
    // Simulate the booking process.
    bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
    showToast(`🎉 Booking confirmed for ${selectedPackage.package_name}!`, 'success');
}

/**
 * Shows a Bootstrap toast notification.
 */
function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container');
    const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-info';
    
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
    return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
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
