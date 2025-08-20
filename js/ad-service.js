// Ad Service for Google AdSense Integration
// File: js/ad-service.js

class AdService {
    constructor() {
        this.isInitialized = false;
        this.adsEnabled = true;
        this.adUnits = [];
        this.isPremiumUser = false;
        this.init();
    }

    async init() {
        // Check if user is premium (no ads for premium users)
        await this.checkPremiumStatus();
        
        if (!this.isPremiumUser && this.adsEnabled) {
            this.initializeAdSense();
            this.setupAdPlacements();
        }
        
        this.isInitialized = true;
        console.log('Ad Service initialized', { adsEnabled: this.adsEnabled, isPremium: this.isPremiumUser });
    }

    /**
     * Check if user has premium subscription (ad-free)
     */
    async checkPremiumStatus() {
        try {
            if (window.authManager && window.authManager.isUserAuthenticated()) {
                const subscriptionType = await window.authManager.getSubscriptionStatus();
                this.isPremiumUser = subscriptionType === 'premium' || subscriptionType === 'trial';
            }
        } catch (error) {
            console.error('Error checking premium status:', error);
            this.isPremiumUser = false;
        }
        
        // If premium, disable ads
        if (this.isPremiumUser) {
            this.adsEnabled = false;
            this.hideAllAds();
        }
    }

    /**
     * Initialize Google AdSense
     */
    initializeAdSense() {
        // Check if AdSense script is already loaded
        if (typeof window.adsbygoogle !== 'undefined') {
            console.log('AdSense already loaded');
            return;
        }

        // Create AdSense script
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
        script.crossOrigin = 'anonymous';
        
        // Add to head
        document.head.appendChild(script);
        
        // Initialize ads array
        window.adsbygoogle = window.adsbygoogle || [];
        
        console.log('AdSense script added to page');
    }

    /**
     * Setup ad placements throughout the app
     */
    setupAdPlacements() {
        // Define ad placements
        const placements = [
            // Removed header banner from index page per user request
            {
                id: 'header-banner',
                type: 'banner',
                size: 'responsive',
                pages: ['library'],  // Only show on library page, not index
                position: 'header'
            },
            {
                id: 'story-bottom',
                type: 'rectangle',
                size: '336x280',
                pages: ['story'],
                position: 'story-bottom'
            },
            {
                id: 'sidebar-ad',
                type: 'rectangle',
                size: '300x250',
                pages: ['library'],
                position: 'sidebar'
            },
            {
                id: 'between-stories',
                type: 'native',
                size: 'fluid',
                pages: ['library'],
                position: 'between-content'
            }
        ];

        // Create ad units based on current page
        const currentPage = this.getCurrentPage();
        placements.forEach(placement => {
            if (placement.pages.includes(currentPage)) {
                this.createAdUnit(placement);
            }
        });
    }

    /**
     * Create an ad unit
     */
    createAdUnit(config) {
        // Check if ad container exists
        let container = document.getElementById(`ad-${config.id}`);
        
        if (!container) {
            // Create container if it doesn't exist
            container = this.createAdContainer(config);
            if (!container) return;
        }

        // Skip if premium user
        if (this.isPremiumUser) {
            container.style.display = 'none';
            return;
        }

        // Create ad HTML with family-friendly settings
        const adHtml = `
            <ins class="adsbygoogle"
                style="display:${config.size === 'fluid' ? 'block' : 'inline-block'};
                       ${config.size !== 'fluid' && config.size !== 'responsive' ? `width:${config.size.split('x')[0]}px;height:${config.size.split('x')[1]}px;` : ''}
                       ${config.size === 'responsive' ? 'width:100%;height:auto;' : ''}"
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="${this.getAdSlot(config.id)}"
                ${config.size === 'responsive' ? 'data-ad-format="auto"' : ''}
                ${config.size === 'fluid' ? 'data-ad-format="fluid"' : ''}
                data-full-width-responsive="${config.size === 'responsive' ? 'true' : 'false'}"
                data-ad-channel="kids-content"
                data-tag-for-child-directed-treatment="1"
                data-tag-for-under-age-of-consent="1">
            </ins>
        `;

        container.innerHTML = adHtml;

        // Push to adsbygoogle
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.adUnits.push(config);
            console.log('Ad unit created:', config.id);
        } catch (error) {
            console.error('Error creating ad unit:', error);
        }
    }

    /**
     * Create ad container dynamically
     */
    createAdContainer(config) {
        const container = document.createElement('div');
        container.id = `ad-${config.id}`;
        container.className = 'ad-container';
        
        // Add styling
        container.style.cssText = `
            margin: 20px auto;
            text-align: center;
            min-height: ${config.size === 'fluid' ? '100px' : config.size.split('x')[1] + 'px'};
            max-width: 100%;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 8px;
        `;

        // Add "Advertisement" label for transparency
        const label = document.createElement('div');
        label.className = 'ad-label';
        label.textContent = 'Advertisement';
        label.style.cssText = `
            font-size: 11px;
            color: #999;
            text-align: center;
            margin-bottom: 5px;
            font-family: sans-serif;
        `;
        container.appendChild(label);

        // Find appropriate location to insert
        let inserted = false;
        
        switch (config.position) {
            case 'header':
                const header = document.querySelector('header');
                if (header) {
                    header.parentNode.insertBefore(container, header.nextSibling);
                    inserted = true;
                }
                break;
                
            case 'story-bottom':
                const storyContent = document.getElementById('storyContent');
                if (storyContent) {
                    storyContent.parentNode.appendChild(container);
                    inserted = true;
                }
                break;
                
            case 'sidebar':
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.appendChild(container);
                    inserted = true;
                }
                break;
                
            case 'between-content':
                const contentGrid = document.querySelector('.story-grid');
                if (contentGrid) {
                    // Insert after every 3rd story
                    const stories = contentGrid.querySelectorAll('.story-card');
                    if (stories.length > 3) {
                        contentGrid.insertBefore(container, stories[3]);
                        inserted = true;
                    }
                }
                break;
        }

        return inserted ? container : null;
    }

    /**
     * Get ad slot ID based on placement
     */
    getAdSlot(placementId) {
        // Map placement IDs to AdSense slot IDs
        // These would be real slot IDs from your AdSense account
        const slots = {
            'header-banner': '1234567890',
            'story-bottom': '2345678901',
            'sidebar-ad': '3456789012',
            'between-stories': '4567890123'
        };
        
        return slots[placementId] || '0000000000';
    }

    /**
     * Get current page type
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('story')) return 'story';
        if (path.includes('library')) return 'library';
        if (path.includes('profile')) return 'profile';
        return 'index';
    }

    /**
     * Hide all ads (for premium users)
     */
    hideAllAds() {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'none';
        });
        console.log('All ads hidden (premium user)');
    }

    /**
     * Show ads (when user downgrades from premium)
     */
    showAds() {
        if (!this.isPremiumUser) {
            const adContainers = document.querySelectorAll('.ad-container');
            adContainers.forEach(container => {
                container.style.display = 'block';
            });
            this.adsEnabled = true;
            console.log('Ads enabled');
        }
    }

    /**
     * Refresh ads (useful for single-page apps)
     */
    refreshAds() {
        if (!this.adsEnabled || this.isPremiumUser) return;
        
        // Clear existing ads
        this.adUnits.forEach(unit => {
            const container = document.getElementById(`ad-${unit.id}`);
            if (container) {
                container.innerHTML = '';
            }
        });
        
        this.adUnits = [];
        
        // Recreate ads
        this.setupAdPlacements();
    }

    /**
     * Track ad events for analytics
     */
    trackAdEvent(event, adUnit) {
        if (window.analyticsService) {
            window.analyticsService.trackEvent('Ads', event, adUnit);
        }
    }

    /**
     * Handle ad blocker detection
     */
    detectAdBlocker() {
        // Simple ad blocker detection
        setTimeout(() => {
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox';
            document.body.appendChild(testAd);
            
            window.setTimeout(() => {
                if (testAd.offsetHeight === 0) {
                    this.handleAdBlocker();
                }
                testAd.remove();
            }, 100);
        }, 2000);
    }

    /**
     * Handle when ad blocker is detected
     */
    handleAdBlocker() {
        console.log('Ad blocker detected');
        
        // Track event
        if (window.analyticsService) {
            window.analyticsService.trackEvent('Ads', 'ad_blocker_detected');
        }
        
        // Could show a polite message about supporting the site
        // but don't be aggressive about it since this is a kids' site
    }

    /**
     * Create ad specifically for the middle of story content
     */
    createStoryMiddleAd() {
        // Skip if premium user
        if (this.isPremiumUser) {
            const container = document.getElementById('story-middle-ad');
            if (container) {
                container.style.display = 'none';
            }
            return;
        }

        const adContainer = document.getElementById('ad-story-middle');
        if (!adContainer) return;

        // Create native ad unit for story content
        const adHtml = `
            <ins class="adsbygoogle"
                style="display:block"
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="5678901234"
                data-ad-format="auto"
                data-full-width-responsive="true"
                data-ad-channel="kids-content"
                data-tag-for-child-directed-treatment="1"
                data-tag-for-under-age-of-consent="1">
            </ins>
        `;

        adContainer.innerHTML = adHtml;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Story middle ad created');
            
            // Track ad impression
            if (window.analyticsService) {
                window.analyticsService.trackEvent('Ads', 'story_middle_ad_shown');
            }
        } catch (error) {
            console.error('Error creating story middle ad:', error);
        }
    }

    /**
     * Apply family-friendly ad settings
     */
    applyFamilyFriendlySettings() {
        // These settings ensure only appropriate ads for children
        window.googletag = window.googletag || {cmd: []};
        window.googletag.cmd.push(function() {
            // Set content rating to G (General Audiences)
            googletag.pubads().setPrivacySettings({
                'restrictDataProcessing': true,
                'childDirectedTreatment': true,
                'underAgeOfConsent': true
            });
            
            // Set safe frame to ensure ads don't interfere with content
            googletag.pubads().setSafeFrameConfig({
                allowOverlayExpansion: false,
                allowPushExpansion: false,
                sandbox: true
            });
            
            // Disable personalized ads for children
            googletag.pubads().setRequestNonPersonalizedAds(1);
        });
    }
}

// Create global ad service instance
window.adService = new AdService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdService;
}