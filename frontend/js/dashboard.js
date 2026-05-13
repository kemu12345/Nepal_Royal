const WISHLIST_KEY = 'royalNepalWishlist';
const API_BASE_URL = (() => {
    const { protocol, port, hostname, origin, pathname } = window.location;

    // Dev mode: file:// pages or Live Server ports
    if (protocol === 'file:' || port === '5500' || port === '5501') {
        return `http://${hostname || 'localhost'}:8000/backend/api`;
    }

    const parts = pathname.split('/');
    const projectIndex = parts.findIndex(part => part.toLowerCase() === 'nepal_royal');
    if (projectIndex !== -1) {
        const projectBase = parts.slice(0, projectIndex + 1).join('/');
        return `${origin}${projectBase}/backend/api`;
    }

    const frontendIndex = parts.findIndex(part => part.toLowerCase() === 'frontend');
    if (frontendIndex > 0) {
        const basePath = parts.slice(0, frontendIndex).join('/');
        return `${origin}${basePath}/backend/api`;
    }

    return `${origin}/backend/api`;
})();

function readWishlist() {
    try {
        const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

function writeWishlist(items) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = String(readWishlist().length);
    }
}

function syncWishlistButtons() {
    const names = new Set(readWishlist().map((item) => item.name));
    document.querySelectorAll('.wishlist-toggle').forEach((button) => {
        const place = button.dataset.place;
        const isSaved = names.has(place);
        button.classList.toggle('active', isSaved);
        button.textContent = isSaved ? 'Saved' : 'Save';
    });
}

function renderWishlistSection() {
    const wishlistList = document.getElementById('wishlistList');
    if (!wishlistList) return;

    const items = readWishlist();
    if (!items.length) {
        wishlistList.innerHTML = '<p class="text-muted mb-0">No saved places yet. Tap Save on a destination card.</p>';
        updateWishlistCount();
        syncWishlistButtons();
        return;
    }

    wishlistList.innerHTML = items.map((item) => `
        <div class="wishlist-item">
            <div>
                <p class="wishlist-item-title">${item.name}</p>
                <p class="wishlist-item-subtitle">${item.category || 'Destination'}</p>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" data-remove-wishlist="${item.name}">
                <i class="bi bi-trash"></i> Remove
            </button>
        </div>
    `).join('');

    wishlistList.querySelectorAll('[data-remove-wishlist]').forEach((button) => {
        button.addEventListener('click', () => {
            const toRemove = button.getAttribute('data-remove-wishlist');
            const filtered = readWishlist().filter((entry) => entry.name !== toRemove);
            writeWishlist(filtered);
            renderWishlistSection();
        });
    });

    updateWishlistCount();
    syncWishlistButtons();
}

function bindWishlistButtons() {
    document.querySelectorAll('.wishlist-toggle').forEach((button) => {
        button.addEventListener('click', () => {
            const place = button.dataset.place;
            const category = button.dataset.category || 'Destination';
            const existing = readWishlist();
            const alreadySaved = existing.some((item) => item.name === place);

            const updated = alreadySaved
                ? existing.filter((item) => item.name !== place)
                : [...existing, { name: place, category }];

            writeWishlist(updated);
            renderWishlistSection();
        });
    });
}

function formatAmount(amount, currency = 'NPR') {
    const value = Number.parseFloat(amount || 0);
    return `${currency} ${value.toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;
}

function bookingDestination(booking) {
    const d = booking.details || {};
    if (booking.booking_type === 'flight' || booking.booking_type === 'bus') {
        return `${d.origin || '-'} to ${d.destination || '-'}`;
    }
    if (booking.booking_type === 'hotel') {
        return d.hotel_name || d.city || '-';
    }
    if (booking.booking_type === 'package') {
        return d.package_name || '-';
    }
    return '-';
}

function bindDashboardNavLinks() {
    const navLinks = document.querySelectorAll('[data-dashboard-link]');
    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('data-dashboard-link');
            const target = document.getElementById(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            navLinks.forEach((item) => item.classList.remove('active'));
            document.querySelectorAll(`[data-dashboard-link="${targetId}"]`).forEach((item) => {
                item.classList.add('active');
            });
        });
    });
}

async function loadUserBookingData() {
    const response = await fetch(`${API_BASE_URL}/get_user_bookings.php`, {
        credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        if (response.status === 401 || response.status === 403) {
            window.location.href = 'login.html?redirect=dashboard.html';
            return;
        }
        throw new Error(data.message || 'Unable to load booking history');
    }

    const bookings = data.data || [];
    const flightCount = bookings.filter(b => b.booking_type === 'flight').length;
    const hotelCount = bookings.filter(b => b.booking_type === 'hotel').length;
    const packageCount = bookings.filter(b => b.booking_type === 'package').length;

    document.getElementById('flightBookings').textContent = String(flightCount);
    document.getElementById('hotelBookings').textContent = String(hotelCount);
    document.getElementById('packageBookings').textContent = String(packageCount);

    const recentBody = document.getElementById('recentBookings');
    if (!recentBody) return;

    if (!bookings.length) {
        recentBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No bookings yet. Start exploring Nepal!
                </td>
            </tr>
        `;
        return;
    }

    recentBody.innerHTML = bookings.slice(0, 8).map((b) => `
        <tr>
            <td>${b.booking_reference || b.booking_id}</td>
            <td>${b.booking_type}</td>
            <td>${bookingDestination(b)}</td>
            <td>${new Date(b.booking_date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${(b.booking_status || 'pending').toLowerCase()}">${b.booking_status}</span></td>
            <td>${formatAmount(b.total_amount, b.currency)}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!isLoggedIn) {
        window.location.href = 'login.html?redirect=dashboard.html';
        return;
    }

    // Update user info
    if (user.first_name) {
        const initial = user.first_name.charAt(0).toUpperCase();
        const fullName = `${user.first_name} ${user.last_name || ''}`;
        
        // Left Sidebar Update
        if (document.getElementById('userFullName')) document.getElementById('userFullName').textContent = fullName;
        if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email || '';
        if (document.getElementById('userInitial')) document.getElementById('userInitial').textContent = initial;

        // Profile Section Update
        if (document.getElementById('profileAvatarLarge')) document.getElementById('profileAvatarLarge').textContent = initial;
        if (document.getElementById('profileNameDetail')) document.getElementById('profileNameDetail').textContent = fullName;
        if (document.getElementById('detailFirstName')) document.getElementById('detailFirstName').textContent = user.first_name;
        if (document.getElementById('detailLastName')) document.getElementById('detailLastName').textContent = user.last_name || '-';
        if (document.getElementById('detailEmail')) document.getElementById('detailEmail').textContent = user.email || '-';
        if (document.getElementById('detailPhone')) document.getElementById('detailPhone').textContent = user.phone || 'Not provided';
    }

    bindDashboardNavLinks();
    bindWishlistButtons();
    renderWishlistSection();

    loadUserBookingData().catch((error) => {
        console.error('Dashboard booking history error:', error);
    });

    loadNotifications();
});

async function loadNotifications() {
    const badge = document.getElementById('notifBadge');
    const headerCount = document.getElementById('notifCountHeader');
    const container = document.getElementById('notifItemsContainer');

    try {
        const response = await fetch(`${API_BASE_URL}/get_notifications.php`, { credentials: 'include' });
        const res = await response.json();

        if (!res.success) return;

        const notifications = res.data || [];
        const unread = notifications.filter(n => Number(n.is_read) === 0);

        // Update badge
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.classList.remove('d-none');
            headerCount.textContent = `${unread.length} New`;
        } else {
            badge.classList.add('d-none');
            headerCount.textContent = '0 New';
        }

        if (notifications.length === 0) {
            container.innerHTML = `
                <li class="p-4 text-center text-muted">
                    <i class="bi bi-bell-slash d-block fs-2 mb-2"></i>
                    No notifications
                </li>
            `;
            return;
        }

        container.innerHTML = notifications.map(n => `
            <li class="p-3 border-bottom notification-item ${Number(n.is_read) === 0 ? 'unread' : ''}" 
                data-notif-id="${n.notification_id}" style="cursor: pointer; transition: 0.2s;">
                <div class="d-flex gap-3">
                    <div class="notif-icon-circle ${n.notification_type}">
                        <i class="bi ${getNotifIcon(n.notification_type)}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <strong class="small">${n.title}</strong>
                            <small class="text-muted" style="font-size: 0.7rem;">${formatTimeAgo(n.created_at)}</small>
                        </div>
                        <p class="mb-0 text-secondary small mt-1" style="line-height: 1.3;">${n.message}</p>
                    </div>
                </div>
            </li>
        `).join('');

        // Bind clicks to mark as read
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.notifId;
                await markNotificationRead(id);
                loadNotifications(); // Refresh
            });
        });

    } catch (err) {
        console.error('Error loading notifications:', err);
    }
}

async function markNotificationRead(id) {
    try {
        await fetch(`${API_BASE_URL}/mark_notification_read.php`, {
            method: 'POST',
            body: JSON.stringify({ notification_id: id }),
            credentials: 'include'
        });
    } catch (err) {
        console.error('Error marking notification as read:', err);
    }
}

function getNotifIcon(type) {
    const icons = {
        'booking_created': 'bi-calendar-plus',
        'booking_update': 'bi-info-circle',
        'new_booking': 'bi-plus-circle',
        'system': 'bi-gear'
    };
    return icons[type] || 'bi-bell';
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}

// --- Review System Logic ---
let selectedRating = 0;
const REVIEWS_KEY = 'royalNepalReviews';

document.querySelectorAll('#reviewStars i').forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        updateStars();
    });
    star.addEventListener('mouseover', () => {
        highlightStars(parseInt(star.dataset.value));
    });
    star.addEventListener('mouseout', () => {
        updateStars();
    });
});

function highlightStars(count) {
    document.querySelectorAll('#reviewStars i').forEach((star, i) => {
        star.className = i < count ? 'bi bi-star-fill' : 'bi bi-star';
    });
}

function updateStars() {
    highlightStars(selectedRating);
}

function submitReview() {
    const text = document.getElementById('reviewText').value.trim();
    const user = JSON.parse(localStorage.getItem('user') || '{"first_name": "Guest"}');

    if (selectedRating === 0 || !text) {
        alert('Please provide a rating and a comment.');
        return;
    }

    const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    const newReview = {
        name: user.first_name,
        rating: selectedRating,
        comment: text,
        date: new Date().toLocaleDateString()
    };

    reviews.unshift(newReview);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    // Reset form
    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    updateStars();
    renderReviews();
}

function renderReviews() {
    const container = document.getElementById('reviewsList');
    const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');

    if (!reviews.length) {
        container.innerHTML = '<p class="text-muted text-center py-4">No reviews yet. Be the first to share!</p>';
        return;
    }

    container.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="text-primary">${r.name}</strong>
                <small class="text-muted">${r.date}</small>
            </div>
            <div class="text-warning small mb-2">
                ${'<i class="bi bi-star-fill"></i>'.repeat(r.rating)}
                ${'<i class="bi bi-star"></i>'.repeat(5 - r.rating)}
            </div>
            <p class="mb-0 text-secondary" style="font-size: 0.9rem; line-height: 1.4;">"${r.comment}"</p>
        </div>
    `).join('');
}

// Initialize reviews on load
document.addEventListener('DOMContentLoaded', renderReviews);
