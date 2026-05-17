# Nepal Royal - Frontend Utilities & Improvements

## Overview

This document describes the new utility modules added to improve code organization, reduce duplication, and enhance maintainability.

## New Files

### 1. `/frontend/js/utils.js`
**Purpose**: Centralized utility functions used across the application

**Key Functions**:
- `formatPrice(price, locale)` - Format numbers as prices with locale support
- `formatDate(dateString, options)` - Format dates into readable strings
- `formatTimeAgo(dateString)` - Format dates as "X hours ago" format
- `showToast(message, type, duration)` - Display Bootstrap toast notifications
- `showMessage(message, type)` - Display messages (fallback-aware)
- `logout()` - Clear session and reload page
- `isUserLoggedIn()` - Check authentication status
- `getCurrentUser()` - Get current user object
- `isValidEmail(email)` - Validate email format
- `isValidPhone(phone)` - Validate 10-digit phone numbers
- `isValidRoute(origin, destination)` - Validate different locations
- `formatErrorMessage(error)` - Convert error objects to user-friendly messages
- `debugLog(message, data)` - Conditional debug logging
- `errorLog(message, error)` - Error logging with context
- `getApiBaseUrl()` - Get API base URL
- `getUrlParams(url)` - Parse URL query parameters
- `redirectTo(url, delay)` - Redirect with optional delay
- `isMobileDevice()` - Detect mobile devices
- `debounce(func, wait)` - Debounce function calls
- `throttle(func, limit)` - Throttle function calls

**Usage**:
```javascript
// Include in HTML before other scripts
<script src="frontend/js/utils.js"></script>

// Then use anywhere
formatPrice(12500); // "12,500"
showToast('Booking confirmed!', 'success');
if (isUserLoggedIn()) { ... }
```

### 2. `/frontend/js/session-manager.js`
**Purpose**: Centralized session and authentication management

**Key Features**:
- Session state management (login, logout, check expiry)
- User role verification (admin/user)
- Automatic session expiry detection (24 hours)
- Session warning system (notifies before expiry)
- Session renewal capability
- Protected page routing (requireLogin, requireAdmin)

**Main Class**: `SessionManager` (static methods)

**Key Methods**:
- `SessionManager.saveUser(user)` - Save user to session
- `SessionManager.getUser()` - Get current user
- `SessionManager.isLoggedIn()` - Check if logged in
- `SessionManager.getUserRole()` - Get user role
- `SessionManager.isAdmin()` - Check if admin
- `SessionManager.clearSession()` - Logout user
- `SessionManager.isSessionExpired()` - Check session expiry
- `SessionManager.renewSession()` - Renew session
- `SessionManager.requireLogin(redirectUrl)` - Protect page with login requirement
- `SessionManager.requireAdmin()` - Protect page with admin requirement

**Usage**:
```javascript
// Include in HTML
<script src="frontend/js/session-manager.js"></script>

// Check login status
if (!SessionManager.isLoggedIn()) {
    SessionManager.requireLogin();
}

// Protect admin pages
SessionManager.requireAdmin();

// Save user after login
SessionManager.saveUser(userData);

// Get current user
const user = SessionManager.getUser();
```

### 3. `/frontend/js/api-handler.js`
**Purpose**: Centralized API request handling with improved error management

**Key Features**:
- Unified API request interface
- Automatic timeout handling (30 seconds)
- Retry logic with exponential backoff
- Response parsing and validation
- Error classification (auth, validation, server, network)
- Request/response logging
- FormData support
- Automatic CSRF handling

**Main Class**: `APIHandler` (static methods)

**HTTP Methods**:
- `APIHandler.get(endpoint, params)` - GET request
- `APIHandler.post(endpoint, data)` - POST request
- `APIHandler.put(endpoint, data)` - PUT request
- `APIHandler.delete(endpoint)` - DELETE request
- `APIHandler.request(endpoint, options)` - Generic request
- `APIHandler.retryRequest(endpoint, options, attempt)` - Retry with backoff

**Error Handling**:
```javascript
try {
    const data = await APIHandler.post('create_booking.php', bookingData);
    console.log(data);
} catch (error) {
    if (error.isAuthError()) {
        // Handle 401/403
    } else if (error.isValidationError()) {
        // Handle 400
    } else if (error.isServerError()) {
        // Handle 5xx
    } else if (error.isNetworkError()) {
        // Handle network issues
    }
    showToast(error.message, 'error');
}
```

**Usage**:
```javascript
// Include in HTML
<script src="frontend/js/api-handler.js"></script>

// GET request
const buses = await APIHandler.get('get_buses.php', { from: 'Kathmandu' });

// POST request
const booking = await APIHandler.post('create_booking.php', {
    booking_type: 'hotel',
    item_id: 123
});

// With error handling
try {
    const data = await APIHandler.post('endpoint.php', payload);
    showToast('Success!', 'success');
} catch (error) {
    showToast(error.message, 'error');
}
```

## Migration Guide

### For Existing Pages

Update your HTML to include the new utilities:

```html
<!-- In header, before other scripts -->
<script src="../../js/utils.js"></script>
<script src="../../js/session-manager.js"></script>
<script src="../../js/api-handler.js"></script>

<!-- Then your page-specific scripts -->
<script src="../../js/buses.js"></script>
```

### Replace Duplicate Functions

**Before**:
```javascript
// Duplicated in multiple files
function formatPrice(price) {
    return parseFloat(price || 0).toLocaleString('en-NP', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
```

**After**:
```javascript
// Use shared utils
const formatted = formatPrice(price);
```

### Replace Session Checks

**Before**:
```javascript
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
if (!isLoggedIn) {
    window.location.href = 'login.html';
}
```

**After**:
```javascript
SessionManager.requireLogin();
```

### Replace API Calls

**Before**:
```javascript
const response = await fetch(`${API_BASE_URL}/get_buses.php`, {
    method: 'GET',
    credentials: 'include'
});
const data = await response.json();
```

**After**:
```javascript
const data = await APIHandler.get('get_buses.php');
```

## Benefits

1. **Code Reusability**: Eliminate duplicate functions across 6+ files
2. **Consistency**: Standardized error handling, logging, and messaging
3. **Maintainability**: Single source of truth for common operations
4. **Security**: Centralized session management with expiry handling
5. **Robustness**: Better error handling and retry logic
6. **Debugging**: Integrated logging system with debug mode support
7. **Performance**: Debounce and throttle utilities for event handling

## Debug Mode

Enable debug logging by setting before page load:
```javascript
const DEBUG_MODE = true;
```

Then call:
```javascript
debugLog('My message', data);
// Output: [Nepal Royal] My message {data}
```

## Best Practices

1. **Always include utils.js first** - Other scripts may depend on it
2. **Use SessionManager for auth** - Don't manually check localStorage
3. **Use APIHandler for API calls** - Provides consistent error handling
4. **Use showToast for notifications** - More professional than alert()
5. **Enable DEBUG_MODE during development** - For troubleshooting

## Future Improvements

- [ ] Add validation utilities library
- [ ] Add state management for complex pages
- [ ] Add service worker for offline support
- [ ] Add performance monitoring
- [ ] Add analytics tracking
- [ ] Add form builder utilities
- [ ] Add data cache management

## Files to Refactor (Priority Order)

1. **admin.js** - Heavy use of duplicate validation functions
2. **dashboard.js** - Multiple session checks
3. **hotels.js** - Duplicate utility functions
4. **buses.js** - Duplicate utility functions
5. **flights.js** - API call patterns
6. **packages.js** - Booking logic standardization

## Support

For questions or issues with these utilities, refer to function JSDoc comments or test in browser console with `DEBUG_MODE = true`.
