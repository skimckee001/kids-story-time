// Analytics Service for Kids Story Time
// File: js/analytics-service.js

class AnalyticsService {
    constructor() {
        this.isInitialized = false;
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.events = [];
        this.init();
    }

    init() {
        // Initialize Google Analytics if available
        this.initGoogleAnalytics();
        
        // Initialize custom analytics
        this.initCustomAnalytics();
        
        // Track page views
        this.trackPageView();
        
        // Set up automatic tracking
        this.setupAutomaticTracking();
        
        this.isInitialized = true;
        console.log('Analytics Service initialized');
    }

    /**
     * Initialize Google Analytics (GA4)
     */
    initGoogleAnalytics() {
        // Check if gtag is available
        if (typeof gtag !== 'undefined') {
            // Configure GA4
            gtag('config', 'G-XXXXXXXXXX', {
                'page_title': document.title,
                'page_location': window.location.href,
                'page_path': window.location.pathname
            });
            console.log('Google Analytics initialized');
        } else {
            console.log('Google Analytics not loaded - add gtag script to enable');
        }
    }

    /**
     * Initialize custom analytics tracking
     */
    initCustomAnalytics() {
        // Load existing analytics data from localStorage
        this.loadStoredEvents();
        
        // Set up periodic sync to backend (if available)
        this.setupPeriodicSync();
    }

    /**
     * Track a custom event
     */
    trackEvent(category, action, label = null, value = null) {
        const event = {
            event_type: 'custom',
            category,
            action,
            label,
            value,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            user_id: this.userId,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        };

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }

        // Store locally
        this.events.push(event);
        this.saveEvents();

        // Log for debugging
        console.log('Event tracked:', event);

        return event;
    }

    /**
     * Track page view
     */
    trackPageView(pagePath = null, pageTitle = null) {
        const event = {
            event_type: 'page_view',
            page_path: pagePath || window.location.pathname,
            page_title: pageTitle || document.title,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            user_id: this.userId,
            referrer: document.referrer,
            page_load_time: this.getPageLoadTime()
        };

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': event.page_title,
                'page_location': window.location.href,
                'page_path': event.page_path
            });
        }

        this.events.push(event);
        this.saveEvents();

        return event;
    }

    /**
     * Track story generation
     */
    trackStoryGeneration(storyData) {
        return this.trackEvent('Story', 'generate', storyData.theme, storyData.length);
    }

    /**
     * Track story interaction
     */
    trackStoryInteraction(action, details) {
        return this.trackEvent('Story', action, details);
    }

    /**
     * Track user action
     */
    trackUserAction(action, details) {
        return this.trackEvent('User', action, details);
    }

    /**
     * Track conversion (signup, subscription, etc.)
     */
    trackConversion(type, value = null) {
        const event = this.trackEvent('Conversion', type, null, value);
        
        // Send enhanced conversion data to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'send_to': 'G-XXXXXXXXXX/conversion',
                'value': value,
                'currency': 'USD',
                'transaction_id': this.generateTransactionId()
            });
        }

        return event;
    }

    /**
     * Track timing (performance metrics)
     */
    trackTiming(category, variable, time, label = null) {
        const event = {
            event_type: 'timing',
            category,
            variable,
            time,
            label,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            user_id: this.userId
        };

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                'name': variable,
                'value': time,
                'event_category': category,
                'event_label': label
            });
        }

        this.events.push(event);
        this.saveEvents();

        return event;
    }

    /**
     * Track error
     */
    trackError(error, fatal = false) {
        const event = {
            event_type: 'error',
            error_message: error.message || error,
            error_stack: error.stack,
            fatal,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            user_id: this.userId,
            page_url: window.location.href
        };

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                'description': error.message || error,
                'fatal': fatal
            });
        }

        this.events.push(event);
        this.saveEvents();

        console.error('Error tracked:', event);
        return event;
    }

    /**
     * Set up automatic tracking for common events
     */
    setupAutomaticTracking() {
        // Track clicks on important buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a');
            if (target) {
                const label = target.textContent || target.getAttribute('aria-label');
                const href = target.getAttribute('href');
                
                if (target.tagName === 'BUTTON') {
                    this.trackEvent('UI', 'button_click', label);
                } else if (target.tagName === 'A' && href) {
                    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
                        // External link
                        this.trackEvent('UI', 'external_link_click', href);
                    } else {
                        // Internal link
                        this.trackEvent('UI', 'internal_link_click', href);
                    }
                }
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formName = form.getAttribute('name') || form.getAttribute('id') || 'unnamed_form';
            this.trackEvent('Form', 'submit', formName);
        });

        // Track scroll depth
        this.trackScrollDepth();

        // Track time on page
        this.trackTimeOnPage();

        // Track window errors
        window.addEventListener('error', (e) => {
            this.trackError(e.error || e.message, true);
        });

        // Track promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError(e.reason, false);
        });
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let maxScrollDepth = 0;
        let scrollDepthTracked = {};

        const checkScrollDepth = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);
            
            // Track milestones: 25%, 50%, 75%, 100%
            [25, 50, 75, 100].forEach(milestone => {
                if (scrollPercentage >= milestone && !scrollDepthTracked[milestone]) {
                    scrollDepthTracked[milestone] = true;
                    this.trackEvent('Engagement', 'scroll_depth', `${milestone}%`, milestone);
                }
            });
            
            maxScrollDepth = Math.max(maxScrollDepth, scrollPercentage);
        };

        // Throttle scroll tracking
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(checkScrollDepth, 100);
        });

        // Track max scroll depth on page unload
        window.addEventListener('beforeunload', () => {
            if (maxScrollDepth > 0) {
                this.trackEvent('Engagement', 'max_scroll_depth', `${maxScrollDepth}%`, maxScrollDepth);
            }
        });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage() {
        const startTime = Date.now();
        
        // Track time spent when leaving page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
            this.trackTiming('Engagement', 'time_on_page', timeSpent, window.location.pathname);
        });

        // Also track periodically for long sessions
        setInterval(() => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            if (timeSpent > 0 && timeSpent % 60 === 0) { // Every minute
                this.trackEvent('Engagement', 'active_time', `${timeSpent}s`, timeSpent);
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Get page load time
     */
    getPageLoadTime() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            return loadTime > 0 ? loadTime : null;
        }
        return null;
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate transaction ID
     */
    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get or create user ID
     */
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }

    /**
     * Save events to localStorage
     */
    saveEvents() {
        try {
            // Keep only last 500 events
            if (this.events.length > 500) {
                this.events = this.events.slice(-500);
            }
            localStorage.setItem('analytics_events', JSON.stringify(this.events));
        } catch (error) {
            console.error('Failed to save analytics events:', error);
        }
    }

    /**
     * Load stored events
     */
    loadStoredEvents() {
        try {
            const stored = localStorage.getItem('analytics_events');
            if (stored) {
                this.events = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load analytics events:', error);
            this.events = [];
        }
    }

    /**
     * Set up periodic sync to backend
     */
    setupPeriodicSync() {
        // Sync events every 30 seconds if there are new events
        setInterval(() => {
            if (this.events.length > 0) {
                this.syncToBackend();
            }
        }, 30000);

        // Also sync on page unload
        window.addEventListener('beforeunload', () => {
            this.syncToBackend();
        });
    }

    /**
     * Sync events to backend
     */
    async syncToBackend() {
        // Only sync if we have events and a backend endpoint
        if (this.events.length === 0) return;

        try {
            // In production, send to your analytics endpoint
            const endpoint = '/.netlify/functions/analytics';
            
            // For demo, just log
            console.log('Would sync', this.events.length, 'events to backend');
            
            // Uncomment when backend is ready:
            /*
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: this.events,
                    session_id: this.sessionId,
                    user_id: this.userId
                })
            });

            if (response.ok) {
                // Clear synced events
                this.events = [];
                this.saveEvents();
            }
            */
        } catch (error) {
            console.error('Failed to sync analytics:', error);
        }
    }

    /**
     * Get analytics summary
     */
    getAnalyticsSummary() {
        const summary = {
            total_events: this.events.length,
            session_id: this.sessionId,
            user_id: this.userId,
            events_by_type: {},
            events_by_category: {}
        };

        this.events.forEach(event => {
            // Count by type
            summary.events_by_type[event.event_type] = (summary.events_by_type[event.event_type] || 0) + 1;
            
            // Count by category
            if (event.category) {
                summary.events_by_category[event.category] = (summary.events_by_category[event.category] || 0) + 1;
            }
        });

        return summary;
    }
}

// Create global analytics instance
window.analyticsService = new AnalyticsService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsService;
}