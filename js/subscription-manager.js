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
                    
                    <!-- Pricing Plans -->
                    <div class="space-y-4 mb-6">
                        <!-- Free Plan -->
                        <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                            <h4 class="font-bold text-gray-800 mb-2">Free (Forever) — £0</h4>
                            <ul class="text-left space-y-1 text-gray-600 text-sm">
                                <li>• 3 text-only stories per day (max 10 per month)</li>
                                <li>• 1 child profile</li>
                                <li style="color: #6b7280; font-style: italic;">Best for: trying it out and building a bedtime routine</li>
                            </ul>
                        </div>
                        
                        <!-- Premium Plan -->
                        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300">
                            <h4 class="font-bold text-gray-800 mb-2">Premium (Individual) — £4.99/mo</h4>
                            <ul class="text-left space-y-1 text-gray-600 text-sm">
                                <li>• Story history (read favourite stories again later)</li>
                                <li>• Unlimited text stories* (up to 3000 words each)</li>
                                <li>• Up to 3 stories read aloud using AI</li>
                                <li>• Images to accompany the stories</li>
                            </ul>
                        </div>
                        
                        <!-- Family Plan -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-300">
                            <h4 class="font-bold text-gray-800 mb-2">Family — £9.99/mo</h4>
                            <ul class="text-left space-y-1 text-gray-600 text-sm">
                                <li>• Everything in Premium</li>
                                <li>• AI Generated Images specifically for each story / your child</li>
                                <li>• Up to 30 stories read aloud using AI</li>
                                <li>• Up to 6 child profiles (great for the family)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-3">
                        <div class="flex gap-3">
                            <button id="upgradePremium" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-full hover:shadow-lg transition-all duration-200 text-sm font-medium">
                                Choose Premium £4.99/mo
                            </button>
                            <button id="upgradeFamily" class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-full hover:shadow-lg transition-all duration-200 text-sm font-medium">
                                Choose Family £9.99/mo
                            </button>
                        </div>
                        <button id="cancelUpgrade" class="w-full px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm">
                            Maybe Later
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

        modal.querySelector('#upgradePremium').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.redirectToUpgrade('premium');
        });

        modal.querySelector('#upgradeFamily').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.redirectToUpgrade('family');
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
    redirectToUpgrade(planType = 'premium') {
        // In a real app, this would redirect to your subscription/payment page
        const planName = planType === 'family' ? 'Family (£9.99/mo)' : 'Premium (£4.99/mo)';
        alert(`Redirecting to upgrade page for ${planName}... (This would integrate with Stripe, PayPal, etc.)`);
        
        // For demo purposes, you could simulate upgrading the user
        this.simulateUpgrade(planType);
    }

    // Demo function to simulate upgrading a user (for testing)
    async simulateUpgrade(planType = 'premium') {
        if (window.authManager.isUserAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            
            // Update user profile with selected subscription
            const result = await window.dbManager.updateUserProfile(user.id, {
                subscription_type: planType
            });

            if (result.success) {
                const planName = planType === 'family' ? 'Family' : 'Premium';
                alert(`Demo: Account upgraded to ${planName}! 🎉`);
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