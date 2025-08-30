import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Check, X, Sparkles, Zap, Crown, Star, Gift, Shield, Rocket, Heart } from 'lucide-react';

export function EnhancedPricingTiers({ currentTier = 'free', onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly

  const TIERS = {
    free: {
      name: 'Free Forever',
      price: 0,
      yearlyPrice: 0,
      icon: Sparkles,
      color: 'slate',
      gradient: 'from-slate-50 to-gray-50',
      borderColor: 'border-slate-300',
      features: [
        '1 story per day',
        'Basic themes (5 options)',
        'Standard voice narration',
        'Story library (up to 10 stories)',
        '1 child profile',
        'Community support',
      ],
      limitations: [
        'Contains advertisements',
        'No custom illustrations',
        'No PDF export',
        'No offline access',
        'Basic reading levels only',
      ],
      badge: null,
      description: 'Perfect for trying out our magical stories',
    },
    premium: {
      name: 'Premium',
      price: 9.99,
      yearlyPrice: 99.99, // Save $20/year
      icon: Zap,
      color: 'blue',
      gradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-500',
      features: [
        '10 stories per day',
        'All 50+ themes unlocked',
        'Premium voice selection (5 voices)',
        'Unlimited story library',
        'Stock photo illustrations',
        'PDF export & printing',
        'Ad-free experience',
        '3 child profiles',
        'Priority email support',
        'Early access to new features',
      ],
      limitations: [
        'No AI-generated illustrations',
        'No offline mode',
        'No family sharing',
      ],
      badge: 'MOST POPULAR',
      badgeColor: 'bg-blue-500',
      description: 'Great for regular bedtime stories',
      savings: billingCycle === 'yearly' ? 'Save $20/year' : null,
    },
    family: {
      name: 'Family Plus',
      price: 19.99,
      yearlyPrice: 199.99, // Save $40/year
      icon: Crown,
      color: 'purple',
      gradient: 'from-purple-50 via-pink-50 to-indigo-50',
      borderColor: 'border-purple-500',
      features: [
        'Unlimited stories',
        'All premium features included',
        'AI-generated custom illustrations',
        'Premium voice library (10+ voices)',
        'Up to 6 child profiles',
        'Offline story access',
        'Family sharing & collaboration',
        'Educational progress reports',
        'Parental dashboard',
        'Custom story series',
        'White-glove support',
        'API access for developers',
      ],
      limitations: [],
      badge: 'BEST VALUE',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Unlimited magic for the whole family',
      savings: billingCycle === 'yearly' ? 'Save $40/year' : null,
    },
  };

  // New feature suggestions to highlight
  const NEW_FEATURES = {
    premium: [
      { icon: '🎨', text: 'NEW: Story Coloring Pages' },
      { icon: '🎵', text: 'NEW: Background Music' },
      { icon: '📊', text: 'NEW: Reading Progress Tracking' },
    ],
    family: [
      { icon: '🤖', text: 'NEW: AI Story Coach' },
      { icon: '🌍', text: 'NEW: Multi-language Support' },
      { icon: '🎭', text: 'NEW: Interactive Story Mode' },
      { icon: '📚', text: 'NEW: Curriculum Alignment' },
    ],
  };

  const handleSelectPlan = (tier) => {
    setSelectedPlan(tier);
    if (onUpgrade) {
      onUpgrade(tier, billingCycle);
    }
  };

  const getPrice = (tier) => {
    if (billingCycle === 'yearly') {
      return tier.yearlyPrice;
    }
    return tier.price;
  };

  const getMonthlyEquivalent = (tier) => {
    if (billingCycle === 'yearly' && tier.yearlyPrice > 0) {
      return (tier.yearlyPrice / 12).toFixed(2);
    }
    return tier.price;
  };

  return (
    <div className="py-12 px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
          <Gift className="w-4 h-4 mr-2" />
          LIMITED TIME: First Month FREE on All Plans!
        </Badge>
        
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Choose Your Story Adventure
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          Join 50,000+ parents creating magical bedtime stories
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-md text-gray-900 font-semibold'
                : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-md text-gray-900 font-semibold'
                : 'text-gray-600'
            }`}
          >
            Yearly
            <Badge className="ml-2 bg-green-500 text-white text-xs">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        <div className="flex items-center gap-2 text-gray-600">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm">100% Safe for Kids</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-sm">4.9/5 Parent Rating</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Heart className="w-5 h-5 text-red-500" />
          <span className="text-sm">2M+ Stories Created</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {Object.entries(TIERS).map(([key, tier]) => {
          const Icon = tier.icon;
          const isCurrentTier = currentTier === key;
          const isPopular = key === 'premium';
          const isBestValue = key === 'family';
          
          return (
            <Card 
              key={key}
              className={`relative transform transition-all duration-300 hover:scale-105 ${
                isPopular ? 'lg:scale-105 shadow-2xl' : 'shadow-lg'
              } ${isCurrentTier ? 'ring-2 ring-green-500' : ''} ${
                selectedPlan === key ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedPlan(key)}
            >
              {/* Badges */}
              {tier.badge && (
                <Badge 
                  className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${tier.badgeColor} text-white px-4 py-1 text-xs font-bold`}
                >
                  {tier.badge}
                </Badge>
              )}
              
              {isCurrentTier && (
                <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                  Current Plan
                </Badge>
              )}

              <CardHeader className={`bg-gradient-to-br ${tier.gradient} rounded-t-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-white shadow-md`}>
                    <Icon className={`h-6 w-6 text-${tier.color}-500`} />
                  </div>
                  
                  {/* Pricing */}
                  <div className="text-right">
                    {tier.price === 0 ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">
                          ${billingCycle === 'yearly' ? getMonthlyEquivalent(tier) : tier.price}
                        </div>
                        <div className="text-sm text-gray-600">
                          {billingCycle === 'yearly' ? '/month billed yearly' : '/month'}
                        </div>
                        {tier.savings && (
                          <Badge className="mt-1 bg-green-100 text-green-700 text-xs">
                            {tier.savings}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900">{tier.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Main Features */}
                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* New Features Badge */}
                {NEW_FEATURES[key] && (
                  <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xs font-semibold text-yellow-800 mb-2">Coming Soon:</div>
                    {NEW_FEATURES[key].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-yellow-700">
                        <span>{feature.icon}</span>
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Not included:</p>
                    <div className="space-y-2">
                      {tier.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {isCurrentTier ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    Your Current Plan
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${
                      isPopular 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600' 
                        : isBestValue
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gray-800 hover:bg-gray-900'
                    } text-white`}
                    onClick={() => handleSelectPlan(key)}
                    disabled={loading || tier.price === 0}
                  >
                    {tier.price === 0 ? (
                      'Current Plan'
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table (Optional Enhancement) */}
      <div className="mt-16 text-center">
        <button className="text-blue-600 underline text-sm hover:text-blue-800">
          View detailed feature comparison →
        </button>
      </div>

      {/* Footer Trust Elements */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Badge variant="outline" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            SSL Secured
          </Badge>
          <Badge variant="outline" className="text-xs">
            30-Day Money Back
          </Badge>
          <Badge variant="outline" className="text-xs">
            Cancel Anytime
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600">
          Join our community of storytellers • Questions? Email support@kidsstorytime.org
        </p>
        
        <div className="mt-4 flex items-center justify-center space-x-6">
          <img src="/stripe-badge.png" alt="Powered by Stripe" className="h-8 opacity-50" />
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>🔒</span>
            <span>Your payment info is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}