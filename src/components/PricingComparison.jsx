import { useState } from 'react';
import { EnhancedPricingTiers } from './EnhancedPricingTiers';
import { SubscriptionPricing } from './SubscriptionPricing';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';

export function PricingComparison() {
  const [currentTier, setCurrentTier] = useState('free');
  const [showComparison, setShowComparison] = useState(true);

  const handleUpgrade = (tier, billingCycle) => {
    console.log(`Upgrading to ${tier} - ${billingCycle || 'monthly'} billing`);
    // Handle upgrade logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Pricing Page Comparison</h1>
          <p className="text-gray-600">
            Compare the current pricing component with the enhanced version
          </p>
        </div>

        <Tabs defaultValue="enhanced" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="current">Current Version</TabsTrigger>
            <TabsTrigger value="enhanced">Enhanced Version</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Current Pricing Component</h2>
              <SubscriptionPricing 
                currentTier={currentTier} 
                onUpgrade={handleUpgrade}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="enhanced">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Enhanced Pricing Component</h2>
              <EnhancedPricingTiers 
                currentTier={currentTier} 
                onUpgrade={handleUpgrade}
              />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Improvements List */}
        <Card className="mt-12 p-6 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Key Improvements in Enhanced Version</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-3 text-blue-600">Visual Enhancements</h4>
              <ul className="space-y-2 text-sm">
                <li>✨ Gradient backgrounds for visual hierarchy</li>
                <li>🎨 Color-coded tiers (slate/blue/purple)</li>
                <li>📊 Better spacing and card hover effects</li>
                <li>🏷️ Eye-catching badges and labels</li>
                <li>🎯 Clear visual focus on popular plan</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-3 text-green-600">Functional Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li>💳 Monthly/Yearly billing toggle</li>
                <li>💰 Automatic savings calculation</li>
                <li>🎁 "Coming Soon" features section</li>
                <li>⭐ Trust indicators (ratings, user count)</li>
                <li>🔒 Security badges and guarantees</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-3 text-purple-600">Content Updates</h4>
              <ul className="space-y-2 text-sm">
                <li>📝 Updated feature lists per tier</li>
                <li>🚫 Clear limitations section</li>
                <li>🎯 Better value propositions</li>
                <li>👨‍👩‍👧‍👦 Family-focused messaging</li>
                <li>🆕 New feature previews</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-3 text-orange-600">Conversion Optimizations</h4>
              <ul className="space-y-2 text-sm">
                <li>🎉 Limited-time offer banner</li>
                <li>📊 Social proof (50k+ parents)</li>
                <li>✅ 30-day money-back guarantee</li>
                <li>🚀 Clear CTAs with icons</li>
                <li>💬 Support email visible</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="mt-8 p-6 max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-2xl font-bold mb-4">Recommendations for Implementation</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">1. A/B Testing Strategy</h4>
              <p className="text-sm text-gray-600">
                Test the enhanced version against the current one with a 50/50 split to measure conversion impact.
                Focus on metrics like upgrade clicks, completed purchases, and time on page.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">2. Progressive Rollout</h4>
              <p className="text-sm text-gray-600">
                Start with the billing toggle and trust indicators, then add "coming soon" features based on development timeline.
                This creates anticipation and shows continuous improvement.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">3. Dynamic Pricing</h4>
              <p className="text-sm text-gray-600">
                Consider regional pricing adjustments and seasonal promotions. The enhanced component supports easy price updates
                through the configuration object.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">4. Mobile Optimization</h4>
              <p className="text-sm text-gray-600">
                The enhanced version includes responsive design, but consider a simplified mobile-specific layout
                with swipeable cards for better mobile UX.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}