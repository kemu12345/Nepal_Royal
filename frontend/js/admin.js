/*
    Admin Dashboard JavaScript
    Handles section switching, button clicks, and form submissions
*/

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is an admin
    RoyalNepal.requireAuth('admin');

    initializeEventListeners();
    loadDashboardStats();
});

/**
 * Initialize all event listeners for buttons and navigation
 */
function initializeEventListeners() {
    // Sidebar navigation - section switching
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Quick action buttons
    const actionButtons = document.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

/**
 * Switch to a different section
 */
function switchSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(`section-${sectionName}`);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update sidebar active state
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Update page title
    updatePageTitle(sectionName);

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
}

/**
 * Update the page title based on current section
 */
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users': 'Users Management',
        'flights': 'Flights Management',
        'buses': 'Buses Management',
        'hotels': 'Hotels Management',
        'packages': 'Packages Management',
        'places': 'Places Management',
        'bookings': 'Bookings Management'
    };

    if (pageTitle && titles[section]) {
        pageTitle.textContent = titles[section];
    }
}

/**
 * Toggle sidebar visibility on mobile
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Load and display dashboard statistics
 */
async function loadDashboardStats() {
    try {
        // Get stats from localStorage or API
        const stats = {
            users: 0,
            bookings: 0,
            flights: 0,
            hotels: 0
        };

        // Update the UI with stats
        const totalUsers = document.getElementById('totalUsers');
        const totalBookings = document.getElementById('totalBookings');
        const totalFlights = document.getElementById('totalFlights');
        const totalHotels = document.getElementById('totalHotels');

        if (totalUsers) totalUsers.textContent = stats.users;
        if (totalBookings) totalBookings.textContent = stats.bookings;
        if (totalFlights) totalFlights.textContent = stats.flights;
        if (totalHotels) totalHotels.textContent = stats.hotels;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(action) {
    const actions = {
        'add-flight': () => switchSection('flights'),
        'add-bus': () => switchSection('buses'),
        'add-hotel': () => switchSection('hotels'),
        'add-package': () => switchSection('packages'),
        'add-place': () => switchSection('places')
    };

    if (actions[action]) {
        actions[action]();
    }
}

/**
 * Display a message to the user
 */
function showMessage(text, type = 'info') {
    // Create a message element if it doesn't exist
    let messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.className = `message-box ${type}`;
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertBefore(messageBox, contentArea.firstChild);
        }
    }

    messageBox.textContent = text;
    messageBox.className = `message-box ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageBox.className = 'message-box';
    }, 5000);
}
