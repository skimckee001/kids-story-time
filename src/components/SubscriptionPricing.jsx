import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { SUBSCRIPTION_TIERS, redirectToCheckout, checkSubscriptionStatus } from '../lib/stripe';
import { auth } from '../lib/supabase';

export function SubscriptionPricing({ currentTier = 'free', onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadUserAndSubscription();
  }, []);

  const loadUserAndSubscription = async () => {
    const currentUser = await auth.getUser();
    setUser(currentUser);
    
    if (currentUser) {
      const status = await checkSubscriptionStatus();
      setSubscription(status);
    }
  };

  const handleUpgrade = async (tier) => {
    if (!user) {
      // Redirect to login
      if (onUpgrade) {
        onUpgrade('login-required');
      }
      return;
    }

    setLoading(true);
    try {
      await redirectToCheckout(tier);
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'free':
        return <Sparkles className="h-6 w-6" />;
      case 'premium':
        return <Zap className="h-6 w-6" />;
      case 'family':
        return <Crown className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'premium':
        return 'bg-orange-100 text-orange-800';
      case 'family':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose Your Story Adventure
        </h2>
        <p className="text-lg text-gray-600">
          Unlock magical features to create the perfect stories for your children
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isCurrentTier = subscription?.tier === key;
          const isPopular = key === 'premium';
          
          return (
            <Card 
              key={key}
              className={`relative ${isPopular ? 'border-orange-500 shadow-xl scale-105' : ''} ${isCurrentTier ? 'border-green-500' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500">
                  Most Popular
                </Badge>
              )}
              
              {isCurrentTier && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  Current Plan
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-full ${getTierColor(key)}`}>
                    {getTierIcon(key)}
                  </div>
                  {tier.price > 0 && (
                    <div className="text-right">
                      <div className="text-3xl font-bold">${tier.price}</div>
                      <div className="text-sm text-gray-600">/month</div>
                    </div>
                  )}
                  {tier.price === 0 && (
                    <div className="text-3xl font-bold text-green-600">Free</div>
                  )}
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>
                  {key === 'free' && 'Perfect for trying out our stories'}
                  {key === 'premium' && 'Great for regular bedtime stories'}
                  {key === 'family' && 'Unlimited magic for the whole family'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Show what's NOT included in lower tiers */}
                {key === 'free' && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-xs text-gray-500 mb-2">Not included:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-500">AI-generated images</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-500">Audio narration</span>
                      </li>
                    </ul>
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
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(key)}
                    disabled={loading || tier.price === 0}
                  >
                    {tier.price === 0 ? 'Current Plan' : `Upgrade to ${tier.name}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 mb-4">
          All plans include a 7-day free trial • Cancel anytime • 100% safe for kids
        </p>
        <div className="flex items-center justify-center space-x-8">
          <img src="/stripe-badge.png" alt="Powered by Stripe" className="h-8 opacity-50" />
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>🔒</span>
            <span>Secure payment processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}