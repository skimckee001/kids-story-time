// Star Points Service for KidsStoryTime
// File: js/star-points-service.js

class StarPointsService {
    constructor() {
        this.isInitialized = false;
        this.userStars = 0;
        this.dailyShareClaimed = false;
        this.init();
    }

    async init() {
        // Load user's star balance
        await this.loadStarBalance();
        
        // Check daily reset
        this.checkDailyReset();
        
        // Initialize UI elements
        this.initializeUI();
        
        this.isInitialized = true;
        console.log('Star Points Service initialized', { stars: this.userStars });
    }

    /**
     * Load user's star balance from storage or database
     */
    async loadStarBalance() {
        try {
            // Check if user is authenticated
            if (window.authManager && window.authManager.isUserAuthenticated()) {
                // Load from database (would be implemented with backend)
                const userData = await this.fetchUserStarsFromDatabase();
                this.userStars = userData.stars || 0;
            } else {
                // Load from localStorage for non-authenticated users
                const localData = localStorage.getItem('starPointsData');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    this.userStars = parsed.stars || 0;
                } else {
                    // Initialize new user
                    this.userStars = 0;
                    this.saveStarBalance();
                }
            }
        } catch (error) {
            console.error('Error loading star balance:', error);
            this.userStars = 0;
        }
    }

    /**
     * Save star balance to storage
     */
    async saveStarBalance() {
        try {
            if (window.authManager && window.authManager.isUserAuthenticated()) {
                // Save to database (would be implemented with backend)
                await this.saveUserStarsToDatabase(this.userStars);
            } else {
                // Save to localStorage
                const data = {
                    stars: this.userStars,
                    lastUpdated: new Date().toISOString(),
                    dailyShareClaimed: this.dailyShareClaimed,
                    lastShareDate: localStorage.getItem('lastShareDate') || null
                };
                localStorage.setItem('starPointsData', JSON.stringify(data));
            }
            
            // Update UI
            this.updateStarDisplay();
        } catch (error) {
            console.error('Error saving star balance:', error);
        }
    }

    /**
     * Add stars to user's balance
     */
    async addStars(amount, reason) {
        this.userStars += amount;
        await this.saveStarBalance();
        
        // Show notification
        this.showStarNotification(amount, reason);
        
        // Track event
        if (window.analyticsService) {
            window.analyticsService.trackEvent('Stars', 'earned', reason, amount);
        }
        
        console.log(`Added ${amount} stars for ${reason}. Total: ${this.userStars}`);
        return this.userStars;
    }

    /**
     * Deduct stars from user's balance
     */
    async useStars(amount, feature) {
        if (this.userStars < amount) {
            this.showInsufficientStarsMessage(amount - this.userStars);
            return false;
        }
        
        this.userStars -= amount;
        await this.saveStarBalance();
        
        // Track event
        if (window.analyticsService) {
            window.analyticsService.trackEvent('Stars', 'redeemed', feature, amount);
        }
        
        console.log(`Used ${amount} stars for ${feature}. Remaining: ${this.userStars}`);
        return true;
    }

    /**
     * Award stars for story creation
     */
    async awardStoryCreationStars() {
        await this.addStars(1, 'story_created');
    }

    /**
     * Award stars for using Read Aloud
     */
    async awardReadAloudStars() {
        // Check if already claimed today (max once per story)
        const today = new Date().toDateString();
        const lastReadAloud = localStorage.getItem('lastReadAloudDate');
        
        if (lastReadAloud !== today) {
            await this.addStars(5, 'read_aloud_used');
            localStorage.setItem('lastReadAloudDate', today);
        }
    }

    /**
     * Award stars for sharing (once per day)
     */
    async awardShareStars() {
        if (!this.dailyShareClaimed) {
            await this.addStars(10, 'story_shared');
            this.dailyShareClaimed = true;
            localStorage.setItem('lastShareDate', new Date().toDateString());
            return true;
        } else {
            this.showDailyLimitMessage();
            return false;
        }
    }

    /**
     * Award stars for referral
     */
    async awardReferralStars(referredUserId) {
        await this.addStars(50, `referral_${referredUserId}`);
    }

    /**
     * Check if daily limits should reset
     */
    checkDailyReset() {
        const today = new Date().toDateString();
        const lastShareDate = localStorage.getItem('lastShareDate');
        
        if (lastShareDate !== today) {
            this.dailyShareClaimed = false;
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        // Add star display to header if it doesn't exist
        if (!document.getElementById('starPointsDisplay')) {
            this.createStarDisplay();
        }
        
        // Update display
        this.updateStarDisplay();
    }

    /**
     * Create star display element
     */
    createStarDisplay() {
        // Check if star display already exists
        if (document.getElementById('starPointsDisplay')) {
            return;
        }

        // Try to find the header container for star display
        let targetContainer = document.getElementById('headerStarContainer');
        
        // If not found, try to find a header element to insert into
        if (!targetContainer) {
            // Look for the header buttons area
            const headerButtons = document.querySelector('header .flex.items-center.space-x-3');
            if (headerButtons) {
                // Create container if it doesn't exist
                targetContainer = document.createElement('div');
                targetContainer.id = 'headerStarContainer';
                headerButtons.insertBefore(targetContainer, headerButtons.firstChild);
            }
        }
        
        // If still no target, create a fixed position element as fallback
        if (!targetContainer) {
            console.log('Header container not found, will retry star display creation');
            setTimeout(() => this.createStarDisplay(), 500);
            return;
        }

        const starDisplay = document.createElement('div');
        starDisplay.id = 'starPointsDisplay';
        starDisplay.className = 'star-points-display';
        starDisplay.style.cssText = `
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 36px;
            margin-right: 8px;
        `;
        starDisplay.innerHTML = `
            <span style="font-size: 16px; margin-right: 5px;">⭐</span>
            <span id="starCount" style="font-size: 14px;">${this.userStars}</span>
        `;
        
        // Add hover effect
        starDisplay.addEventListener('mouseenter', () => {
            starDisplay.style.transform = 'scale(1.05)';
        });
        starDisplay.addEventListener('mouseleave', () => {
            starDisplay.style.transform = 'scale(1)';
        });
        
        // Add click handler to show star info
        starDisplay.addEventListener('click', () => {
            this.showStarInfoModal();
        });
        
        // Insert into header container
        targetContainer.appendChild(starDisplay);
        targetContainer.classList.remove('hidden');
    }

    /**
     * Update star display
     */
    updateStarDisplay() {
        const starCount = document.getElementById('starCount');
        if (starCount) {
            starCount.textContent = this.userStars;
            
            // Add animation
            starCount.style.transform = 'scale(1.2)';
            setTimeout(() => {
                starCount.style.transform = 'scale(1)';
            }, 300);
        }
    }

    /**
     * Show star notification
     */
    showStarNotification(amount, reason) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'star-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.5s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const reasonText = {
            'story_created': 'Story Created!',
            'story_shared': 'Story Shared!',
            'read_aloud_used': 'Read Aloud Used!',
            'referral': 'Friend Joined!'
        };
        
        notification.innerHTML = `
            <span style="font-size: 24px;">⭐</span>
            <div>
                <div style="font-weight: bold;">+${amount} Stars!</div>
                <div style="font-size: 12px; opacity: 0.9;">${reasonText[reason] || reason}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
        
        // Add CSS animations if not already present
        if (!document.getElementById('starAnimations')) {
            const style = document.createElement('style');
            style.id = 'starAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show insufficient stars message
     */
    showInsufficientStarsMessage(needed) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3 style="color: #333; margin-bottom: 15px;">Need More Stars! ⭐</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    You need ${needed} more stars for this feature.
                </p>
                <p style="color: #666; margin-bottom: 20px;">
                    <strong>Earn stars by:</strong><br>
                    • Creating stories (+1 star)<br>
                    • Using Read Aloud (+5 stars)<br>
                    • Sharing stories (+10 stars/day)<br>
                    • Referring friends (+50 stars)
                </p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: linear-gradient(135deg, #667eea, #764ba2);
                               color: white;
                               border: none;
                               padding: 10px 30px;
                               border-radius: 25px;
                               cursor: pointer;
                               font-weight: bold;">
                    Got it!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Show daily limit message
     */
    showDailyLimitMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FF9800;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
        `;
        notification.innerHTML = `
            <div style="font-weight: bold;">Daily Share Limit Reached</div>
            <div style="font-size: 12px;">Come back tomorrow for more stars!</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    /**
     * Show star info modal
     */
    showStarInfoModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px;">
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">
                    ⭐ Your Star Balance: ${this.userStars} ⭐
                </h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">How to Earn Stars:</h3>
                    <ul style="color: #666; line-height: 1.8;">
                        <li>📖 Create a story: <strong>+1 star</strong></li>
                        <li>🔊 Use Read Aloud: <strong>+5 stars</strong></li>
                        <li>📱 Share with #StoryStarMoments: <strong>+10 stars</strong> (once daily)</li>
                        <li>👥 Refer a friend: <strong>+50 stars</strong></li>
                    </ul>
                </div>
                
                <div style="background: #fff3e0; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="color: #ff9800; margin-bottom: 15px;">Coming Soon - Redeem Stars For:</h3>
                    <ul style="color: #666; line-height: 1.8;">
                        <li>🎨 Premium illustrations</li>
                        <li>🎙️ Professional narration voices</li>
                        <li>📚 Bonus story credits</li>
                        <li>✨ Special story themes</li>
                    </ul>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: linear-gradient(135deg, #667eea, #764ba2);
                               color: white;
                               border: none;
                               padding: 12px 40px;
                               border-radius: 25px;
                               cursor: pointer;
                               font-weight: bold;
                               width: 100%;">
                    Awesome!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Placeholder for database operations
     */
    async fetchUserStarsFromDatabase() {
        // This would be implemented with your backend
        // For now, return localStorage data
        const localData = localStorage.getItem('starPointsData');
        if (localData) {
            return JSON.parse(localData);
        }
        return { stars: 0 };
    }

    async saveUserStarsToDatabase(stars) {
        // This would be implemented with your backend
        // For now, just log
        console.log('Would save to database:', { stars });
    }
}

// Create global instance
window.starPointsService = new StarPointsService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarPointsService;
}