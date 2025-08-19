// Subscription Manager for Premium Features
// File: js/subscription-manager.js

class SubscriptionManager {
    constructor() {
        this.init();
    }

    async init() {
        // Initialize subscription checking
        if (window.authManager) {
            this.setupAuthListener();
        }
    }

    setupAuthListener() {
        window.authManager.onAuthStateChange((isAuthenticated, user) => {
            if (isAuthenticated) {
                this.updateUIForSubscription();
            }
        });
    }

    // Check if feature is available for current user
    async isFeatureAvailable(featureName) {
        if (!window.authManager.isUserAuthenticated()) {
            return this.getFreeFeatures().includes(featureName);
        }

        const subscriptionType = await window.authManager.getSubscriptionStatus();
        const limits = window.authManager.getUsageLimits(subscriptionType);
        
        return limits[featureName] === true;
    }

    // Get list of features available to free users
    getFreeFeatures() {
        return ['basicStoryGeneration', 'basicReadAloud', 'basicThemes'];
    }

    // Get premium features list
    getPremiumFeatures() {
        return ['storyHistory', 'storyRating', 'premiumVoices', 'customPrompts', 'storyExport'];
    }

    // Show upgrade modal for premium features
    showUpgradeModal(featureName = null) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-8 max-w-md w-full">
                <div class="text-center">
                    <div class="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
                        <span class="text-white text-3xl">✨</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Unlock Premium Features</h3>
                    <p class="text-gray-600 mb-6">
                        ${featureName ? `The ${featureName} feature` : 'This feature'} is available with our Premium plan!
                    </p>
                    
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                        <h4 class="font-bold text-gray-800 mb-3">Premium (£4.99/mo) includes:</h4>
                        <ul class="text-left space-y-2 text-gray-600 text-sm">
                            <li class="flex items-center space-x-2">
                                <span class="text-green-500">✓</span>
                                <span>Unlimited text stories (up to 3000 words)</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-500">✓</span>
                                <span>Story history & favorites</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-500">✓</span>
                                <span>3 AI read-aloud stories per month</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-500">✓</span>
                                <span>Images with stories</span>
                            </li>
                            <li class="flex items-center space-x-2">
                                <span class="text-green-500">✓</span>
                                <span>Export stories (PDF/Print)</span>
                            </li>
                        </ul>
                        
                        <div class="mt-4 pt-3 border-t border-purple-200">
                            <h5 class="font-bold text-gray-800 mb-2">Family (£9.99/mo) adds:</h5>
                            <ul class="text-left space-y-1 text-gray-600 text-sm">
                                <li class="flex items-center space-x-2">
                                    <span class="text-blue-500">✓</span>
                                    <span>Up to 6 child profiles</span>
                                </li>
                                <li class="flex items-center space-x-2">
                                    <span class="text-blue-500">✓</span>
                                    <span>30 AI read-aloud stories/month</span>
                                </li>
                                <li class="flex items-center space-x-2">
                                    <span class="text-blue-500">✓</span>
                                    <span>Custom AI-generated images</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="flex gap-4">
                        <button id="cancelUpgrade" class="flex-1 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200">
                            Maybe Later
                        </button>
                        <button id="upgradeNow" class="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200">
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#cancelUpgrade').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#upgradeNow').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.redirectToUpgrade();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Show usage limit warning
    showUsageLimitModal(limitType = 'daily', remainingDaily = 0, remainingMonthly = 0) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        const limitMessage = limitType === 'daily' 
            ? `You've reached your daily limit of 3 stories. Come back tomorrow for more!`
            : `You've reached your monthly limit of 10 stories.`;
            
        const upgradeMessage = limitType === 'daily'
            ? `Upgrade to Premium for unlimited daily stories!`
            : `Upgrade to Premium for unlimited stories every month!`;

        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-8 max-w-md w-full">
                <div class="text-center">
                    <div class="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <span class="text-orange-600 text-3xl">⚠️</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">${limitType === 'daily' ? 'Daily' : 'Monthly'} Limit Reached</h3>
                    <p class="text-gray-600 mb-6">
                        ${limitMessage}
                    </p>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-6">
                        <p class="text-sm text-gray-600 mb-2">
                            📊 <strong>Free Plan Limits:</strong>
                        </p>
                        <p class="text-sm text-gray-600 mb-2">
                            • 3 stories per day
                        </p>
                        <p class="text-sm text-gray-600 mb-3">
                            • 10 stories per month
                        </p>
                        <p class="text-sm text-gray-600">
                            ✨ ${upgradeMessage}
                        </p>
                    </div>
                    
                    <div class="flex gap-4">
                        <button id="cancelLimit" class="flex-1 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200">
                            OK
                        </button>
                        <button id="upgradeFromLimit" class="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200">
                            Upgrade
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#cancelLimit').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#upgradeFromLimit').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.redirectToUpgrade();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Redirect to upgrade page/process
    redirectToUpgrade() {
        // In a real app, this would redirect to your subscription/payment page
        alert('Redirecting to upgrade page... (This would integrate with Stripe, PayPal, etc.)');
        
        // For demo purposes, you could simulate upgrading the user
        // this.simulateUpgrade();
    }

    // Demo function to simulate upgrading a user (for testing)
    async simulateUpgrade() {
        if (window.authManager.isUserAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            
            // Update user profile with premium subscription
            const result = await window.dbManager.updateUserProfile(user.id, {
                subscription_type: 'premium'
            });

            if (result.success) {
                alert('Demo: Account upgraded to Premium! 🎉');
                // Refresh the page to update UI
                window.location.reload();
            }
        }
    }

    // Update UI elements based on subscription status
    async updateUIForSubscription() {
        if (!window.authManager.isUserAuthenticated()) return;

        const hasPremium = await window.authManager.hasPremiumAccess();
        const subscriptionType = await window.authManager.getSubscriptionStatus();
        
        // Update navigation/header with subscription status
        this.updateHeaderSubscriptionStatus(subscriptionType);
        
        // Update form elements based on subscription
        this.updateFormElementsForSubscription(hasPremium);
    }

    updateHeaderSubscriptionStatus(subscriptionType) {
        // Add subscription badge to header if premium
        if (subscriptionType !== 'free') {
            const headers = document.querySelectorAll('header');
            headers.forEach(header => {
                const existingBadge = header.querySelector('.subscription-badge');
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'subscription-badge premium-badge';
                    badge.textContent = `✨ ${subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)}`;
                    
                    // Find the right place to insert the badge
                    const rightSection = header.querySelector('.flex.items-center.space-x-4');
                    if (rightSection) {
                        rightSection.insertBefore(badge, rightSection.firstChild);
                    }
                }
            });
        }
    }

    updateFormElementsForSubscription(hasPremium) {
        // Show/hide custom prompt field based on subscription
        const customPromptField = document.getElementById('customPrompt');
        if (customPromptField) {
            if (!hasPremium) {
                customPromptField.disabled = true;
                customPromptField.placeholder = 'Upgrade to Premium for custom prompts';
                
                // Add upgrade click listener
                customPromptField.addEventListener('click', () => {
                    this.showUpgradeModal('Custom Prompts');
                });
            }
        }
    }

    // Check if user can perform an action, show modal if not
    async checkFeatureAccessOrShow(featureName, actionCallback) {
        const hasAccess = await this.isFeatureAvailable(featureName);
        
        if (hasAccess) {
            actionCallback();
        } else {
            this.showUpgradeModal(featureName);
        }
    }

    // Check story generation limits before allowing story creation
    async checkStoryGenerationLimits() {
        if (!window.authManager.isUserAuthenticated()) {
            // Anonymous users get basic free access
            return { canGenerate: true, remaining: 3 };
        }

        const subscriptionType = await window.authManager.getSubscriptionStatus();
        const limits = window.authManager.getUsageLimits(subscriptionType);

        // Premium and family users have unlimited stories
        if (subscriptionType === 'premium' || subscriptionType === 'family') {
            return { canGenerate: true, remaining: 999 };
        }

        try {
            // Check both daily and monthly usage for free users
            const monthlyResult = await window.dbManager.getUserUsageStats(window.authManager.getCurrentUser().id);
            const dailyResult = await window.dbManager.getUserDailyUsageStats(window.authManager.getCurrentUser().id);
            
            if (monthlyResult.success && dailyResult.success) {
                const todayUsage = dailyResult.data.length;
                const monthlyUsage = monthlyResult.data.length;
                
                const remainingDaily = Math.max(0, limits.storiesPerDay - todayUsage);
                const remainingMonthly = Math.max(0, limits.storiesPerMonth - monthlyUsage);

                // Check if limits are exceeded
                if (todayUsage >= limits.storiesPerDay) {
                    this.showUsageLimitModal('daily', remainingDaily, remainingMonthly);
                    return { canGenerate: false, remaining: 0 };
                }
                
                if (monthlyUsage >= limits.storiesPerMonth) {
                    this.showUsageLimitModal('monthly', remainingDaily, remainingMonthly);
                    return { canGenerate: false, remaining: 0 };
                }

                return { 
                    canGenerate: true, 
                    remaining: Math.min(remainingDaily, remainingMonthly),
                    dailyRemaining: remainingDaily,
                    monthlyRemaining: remainingMonthly
                };
            }
        } catch (error) {
            console.error('Error checking story generation limits:', error);
        }

        // Default fallback for free users
        return { canGenerate: true, remaining: 3 };
    }
}

// Create global subscription manager instance
window.subscriptionManager = new SubscriptionManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionManager;
}