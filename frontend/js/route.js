(function (window, document) {
    'use strict';

    const routes = {
        home: 'home.html',
        explore: 'explore.html',
        flights: 'flights.html',
        buses: 'buses.html',
        hotels: 'hotels.html',
        packages: 'packages.html',
        login: 'login.html',
        register: 'register.html',
        dashboard: 'dashboard.html',
        adminDashboard: 'admin-dashboard.html'
    };

    const pageToRoute = Object.entries(routes).reduce((acc, [route, page]) => {
        acc[page] = route;
        return acc;
    }, {});

    function pathParts() {
        return window.location.pathname.split('/');
    }

    function indexOfPart(parts, value) {
        return parts.findIndex(part => part.toLowerCase() === value);
    }

    function pagesBaseUrl() {
        const { origin, protocol, href } = window.location;

        if (protocol === 'file:') {
            const cleanHref = href.split(/[?#]/)[0];
            const frontendIndex = cleanHref.toLowerCase().indexOf('/frontend/');

            if (frontendIndex !== -1) {
                return `${cleanHref.slice(0, frontendIndex)}/frontend/pages/`;
            }

            return new URL('frontend/pages/', cleanHref).href;
        }

        const parts = pathParts();
        const frontendIndex = indexOfPart(parts, 'frontend');

        if (frontendIndex !== -1) {
            return `${origin}${parts.slice(0, frontendIndex + 1).join('/')}/pages/`;
        }

        const projectIndex = indexOfPart(parts, 'nepal_royal');
        if (projectIndex !== -1) {
            return `${origin}${parts.slice(0, projectIndex + 1).join('/')}/frontend/pages/`;
        }

        return `${origin}/frontend/pages/`;
    }

    function pageFile(routeOrPage) {
        return routes[routeOrPage] || routeOrPage;
    }

    function pageUrl(routeOrPage, options = {}) {
        const url = new URL(pageFile(routeOrPage), pagesBaseUrl());

        if (options.params instanceof URLSearchParams) {
            url.search = options.params.toString();
        } else if (options.params && typeof options.params === 'object') {
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
        }

        if (options.hash) {
            url.hash = options.hash;
        }

        return url.href;
    }

    function apiBaseUrl() {
        const { protocol, port, hostname } = window.location;

        if (protocol === 'file:' || port === '5500' || port === '5501') {
            return `http://${hostname || 'localhost'}:8000/backend/api`;
        }

        return new URL('../../backend/api', pagesBaseUrl()).href.replace(/\/$/, '');
    }

    function currentRedirect() {
        const { protocol, href, pathname, search, hash } = window.location;
        return protocol === 'file:' ? href : `${pathname}${search}${hash}`;
    }

    function pageNameFromPath(pathname) {
        return decodeURIComponent(pathname.split('/').pop() || '').toLowerCase();
    }

    function isKnownPage(pathname) {
        return Boolean(pageToRoute[pageNameFromPath(pathname)]);
    }

    function isAuthPage(pathname = window.location.pathname) {
        const page = pageNameFromPath(pathname);
        return page === routes.login || page === routes.register;
    }

    function defaultDashboardRoute(user) {
        return user && user.role === 'admin' ? 'adminDashboard' : 'dashboard';
    }

    function safeRedirectUrl(rawRedirect, fallbackRoute = 'dashboard') {
        const fallbackUrl = pageUrl(fallbackRoute);

        if (!rawRedirect) {
            return fallbackUrl;
        }

        try {
            const redirectUrl = new URL(rawRedirect, window.location.href);
            const isFileMode = window.location.protocol === 'file:';
            const sameOrigin = isFileMode
                ? redirectUrl.protocol === 'file:'
                : redirectUrl.origin === window.location.origin;

            if (!sameOrigin || !isKnownPage(redirectUrl.pathname) || isAuthPage(redirectUrl.pathname)) {
                return fallbackUrl;
            }

            return redirectUrl.href;
        } catch (_error) {
            return fallbackUrl;
        }
    }

    function navigateTo(routeOrPage, options = {}) {
        const url = pageUrl(routeOrPage, options);

        if (options.replace) {
            window.location.replace(url);
            return;
        }

        window.location.assign(url);
    }

    function redirectToLogin(options = {}) {
        navigateTo('login', {
            replace: options.replace !== false,
            params: {
                redirect: options.redirect || currentRedirect()
            }
        });
    }

    function redirectToDashboard(user, options = {}) {
        navigateTo(defaultDashboardRoute(user), {
            replace: options.replace !== false
        });
    }

    async function logoutToHome() {
        try {
            await fetch(`${apiBaseUrl()}/logout.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            navigateTo('home', { replace: true });
        }
    }

    function normalizeInternalPageLinks(root = document) {
        root.querySelectorAll('a[href]').forEach(anchor => {
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
                return;
            }

            try {
                const parsed = new URL(href, window.location.href);
                const page = pageNameFromPath(parsed.pathname);
                const route = pageToRoute[page];

                if (!route) {
                    return;
                }

                anchor.href = pageUrl(route, {
                    params: parsed.searchParams,
                    hash: parsed.hash ? parsed.hash.slice(1) : ''
                });
            } catch (_error) {
                // Leave malformed hrefs unchanged.
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => normalizeInternalPageLinks());

    window.RoyalNepalRoutes = {
        routes,
        pagesBaseUrl,
        pageUrl,
        apiBaseUrl,
        currentRedirect,
        isAuthPage,
        safeRedirectUrl,
        navigateTo,
        redirectToLogin,
        redirectToDashboard,
        logoutToHome,
        defaultDashboardRoute,
        normalizeInternalPageLinks
    };

    if (typeof window.logout !== 'function') {
        window.logout = logoutToHome;
    }
})(window, document);
