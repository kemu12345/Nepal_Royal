/*
    This script handles the functionality for the "Explore" page.
    It loads a list of places from the backend, allows users to search,
    filter by category, and sort the results.
*/

// Base URL for the backend API.
const API_BASE_URL = '../../backend/api';

// Global variables to store place data.
let allPlaces = [];         // Holds all places fetched from the API.
let filteredPlaces = [];    // Holds the places after applying filters.
let currentCategory = '';   // The currently selected category filter.

// This event listener runs when the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Load all places from the API.
    loadPlaces();
    
    // Set up a debounced event listener for the search input to avoid excessive filtering.
    document.getElementById('searchInput')?.addEventListener('input', debounce(applyFilters, 300));
    // Set up an event listener for the sort dropdown.
    document.getElementById('sortFilter')?.addEventListener('change', applyFilters);
    
    // Set up click handlers for the category filter pills.
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            // Manages the 'active' class for visual feedback.
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.dataset.category;
            applyFilters();
        });
    });
    
    // Update the navigation bar to show user info if logged in.
    updateAuthButtons();
});

/**
 * A debounce function to limit the rate at which a function gets called.
 * This is useful for input events like search to prevent API calls on every keystroke.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
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
 * Returns a static array of demo places.
 * This is used for frontend development and testing when the backend is not available.
 */
function getDemoPlaces() {
    return [
        {
            place_id: 1,
            place_name: 'Pashupatinath Temple',
            category: 'temple',
            location_name: 'Kathmandu',
            description: 'One of the most sacred Hindu temples dedicated to Lord Shiva. A UNESCO World Heritage Site with stunning architecture and religious significance.',
            is_unesco_heritage: 1,
            entry_fee: 1000,
            currency: 'NPR'
        },
        {
            place_id: 2,
            place_name: 'Boudhanath Stupa',
            category: 'monastery',
            location_name: 'Kathmandu',
            description: 'One of the largest spherical stupas in Nepal and the holiest Tibetan Buddhist temple outside Tibet. UNESCO World Heritage Site.',
            is_unesco_heritage: 1,
            entry_fee: 400,
            currency: 'NPR'
        },
        {
            place_id: 3,
            place_name: 'Kathmandu Durbar Square',
            category: 'palace',
            location_name: 'Kathmandu',
            description: 'Historic palace square with stunning Newari architecture, temples, and the famous Kumari (Living Goddess) house.',
            is_unesco_heritage: 1,
            entry_fee: 1000,
            currency: 'NPR'
        },
        {
            place_id: 4,
            place_name: 'Mount Everest',
            category: 'mountain',
            location_name: 'Solukhumbu',
            description: 'The highest peak in the world at 8,848.86 meters. Known as Sagarmatha in Nepali, meaning "Goddess of the Sky".',
            is_unesco_heritage: 0,
            entry_fee: 0,
            currency: 'NPR'
        },
        {
            place_id: 5,
            place_name: 'Phewa Lake',
            category: 'lake',
            location_name: 'Pokhara',
            description: 'A beautiful freshwater lake in Pokhara with stunning reflections of the Annapurna range. Perfect for boating and relaxation.',
            is_unesco_heritage: 0,
            entry_fee: 0,
            currency: 'NPR'
        },
        {
            place_id: 6,
            place_name: 'Chitwan National Park',
            category: 'park',
            location_name: 'Chitwan',
            description: 'Nepal\'s first national park and a UNESCO World Heritage Site. Home to one-horned rhinos, Bengal tigers, and diverse wildlife.',
            is_unesco_heritage: 1,
            entry_fee: 2000,
            currency: 'NPR'
        },
        {
            place_id: 7,
            place_name: 'Swayambhunath (Monkey Temple)',
            category: 'temple',
            location_name: 'Kathmandu',
            description: 'An ancient religious complex atop a hill in the Kathmandu Valley. Known for the all-seeing eyes of Buddha painted on the stupa.',
            is_unesco_heritage: 1,
            entry_fee: 200,
            currency: 'NPR'
        },
        {
            place_id: 8,
            place_name: 'Patan Durbar Square',
            category: 'heritage_site',
            location_name: 'Lalitpur',
            description: 'A stunning display of Newari architecture with ancient palaces, temples, and the famous Krishna Mandir.',
            is_unesco_heritage: 1,
            entry_fee: 1000,
            currency: 'NPR'
        },
        {
            place_id: 9,
            place_name: 'Sarangkot Viewpoint',
            category: 'viewpoint',
            location_name: 'Pokhara',
            description: 'Famous viewpoint offering spectacular sunrise views of the Annapurna and Dhaulagiri mountain ranges.',
            is_unesco_heritage: 0,
            entry_fee: 0,
            currency: 'NPR'
        }
    ];
}

/**
 * Fetches all places from the API and initiates the display process.
 */
async function loadPlaces() {
    const loadingEl = document.getElementById('loadingState');
    const placesEl = document.getElementById('placesContainer');
    const emptyEl = document.getElementById('emptyState');

    loadingEl.style.display = 'flex';
    placesEl.innerHTML = '';
    emptyEl.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/get_places.php`);
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success && data.data && data.data.length > 0) {
            allPlaces = data.data;
        } else {
            // Fallback to demo data if API fails or returns no data.
            allPlaces = getDemoPlaces();
        }
        
        filteredPlaces = [...allPlaces];
        applyFilters();
    } catch (error) {
        console.error('Error loading places:', error);
        loadingEl.style.display = 'none';
        // Fallback to demo data on API error.
        allPlaces = getDemoPlaces();
        filteredPlaces = [...allPlaces];
        applyFilters();
    }
}

/**
 * Resets all filters to their default state and re-applies them.
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    currentCategory = '';
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.category-pill[data-category=""]').classList.add('active');
    document.getElementById('sortFilter').value = 'name-asc';
    applyFilters();
}

/**
 * Applies the current search, category, and sorting filters to the list of places.
 */
function applyFilters() {
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'name-asc';

    // Filter the places based on the search query and selected category.
    filteredPlaces = allPlaces.filter(place => {
        // Search filter checks name, description, and location.
        if (searchQuery) {
            const nameMatch = place.place_name.toLowerCase().includes(searchQuery);
            const descMatch = place.description?.toLowerCase().includes(searchQuery);
            const locMatch = place.location_name?.toLowerCase().includes(searchQuery);
            if (!nameMatch && !descMatch && !locMatch) {
                return false;
            }
        }

        // Category filter.
        if (currentCategory && place.category !== currentCategory) {
            return false;
        }

        return true;
    });

    // Sort the filtered places based on the selected sort option.
    filteredPlaces.sort((a, b) => {
        switch (sortBy) {
            case 'name-asc':
                return a.place_name.localeCompare(b.place_name);
            case 'name-desc':
                return b.place_name.localeCompare(a.place_name);
            case 'heritage':
                // Prioritize UNESCO heritage sites.
                if (a.is_unesco_heritage && !b.is_unesco_heritage) return -1;
                if (!a.is_unesco_heritage && b.is_unesco_heritage) return 1;
                return a.place_name.localeCompare(b.place_name);
            default:
                return 0;
        }
    });

    displayPlaces(filteredPlaces);
}

/**
 * Renders the list of filtered and sorted places on the page.
 */
function displayPlaces(places) {
    const placesEl = document.getElementById('placesContainer');
    const resultsCountEl = document.getElementById('resultsCount');
    const emptyEl = document.getElementById('emptyState');

    resultsCountEl.textContent = `${places.length} place${places.length !== 1 ? 's' : ''} found`;

    if (places.length === 0) {
        placesEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    placesEl.innerHTML = places.map(place => createPlaceCard(place)).join('');
}

/**
 * Creates the HTML for a single place card.
 * @param {object} place - The place data object.
 * @returns {string} The HTML string for the place card.
 */
function createPlaceCard(place) {
    const categoryIcon = getCategoryIcon(place.category);
    const badgeClass = `badge-${place.category}`;
    const heritageBadge = place.is_unesco_heritage == 1 ? '<div class="heritage-badge"><i class="bi bi-award-fill me-1"></i>UNESCO</div>' : '';
    
    // Generate feature tags like "World Heritage" and entry fee.
    const features = [];
    if (place.is_unesco_heritage == 1) features.push('World Heritage');
    if (place.entry_fee && parseFloat(place.entry_fee) > 0) {
        features.push(`${place.currency} ${place.entry_fee}`);
    } else {
        features.push('Free Entry');
    }

    return `
        <div class="col-md-6 col-lg-4">
            <div class="place-card animate__animated animate__fadeInUp">
                <div class="place-image">
                    ${heritageBadge}
                    <span class="place-category-badge ${badgeClass}">${formatCategory(place.category)}</span>
                    <span style="font-size: 4rem;">${categoryIcon}</span>
                </div>
                <div class="place-body">
                    <h5 class="place-title">${place.place_name}</h5>
                    <p class="place-location"><i class="bi bi-geo-alt-fill"></i>${place.location_name || 'Nepal'}</p>
                    <p class="place-description">${place.description || 'Discover this amazing place in Nepal.'}</p>
                    <div class="place-features">
                        ${features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                    </div>
                    <button class="btn btn-explore" onclick="viewPlace(${place.place_id})">
                        <i class="bi bi-arrow-right-circle me-2"></i>Explore More
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Placeholder function for viewing more details about a place.
 * In a full application, this might navigate to a new page or open a modal.
 */
function viewPlace(placeId) {
    const place = allPlaces.find(p => p.place_id === placeId);
    if (place) {
        showToast(`🗺️ Exploring ${place.place_name}!`, 'info');
    }
}

/**
 * Returns an emoji icon based on the place category.
 * @param {string} category - The category of the place.
 * @returns {string} An emoji icon.
 */
function getCategoryIcon(category) {
    const icons = {
        'temple': '🛕',
        'monastery': '⛩️',
        'palace': '🏰',
        'museum': '🏛️',
        'viewpoint': '🏔️',
        'lake': '🏞️',
        'park': '🌳',
        'mountain': '⛰️',
        'waterfall': '💧',
        'heritage_site': '🏛️'
    };
    return icons[category] || '📍';
}

/**
 * Formats a category string (e.g., 'heritage_site') into a more readable format ('Heritage Site').
 */
function formatCategory(category) {
    return category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Shows a Bootstrap toast message at the bottom of the page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast ('info', 'success', 'warning', 'danger').
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
 * Logs the user out and reloads the page.
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.reload();
}
