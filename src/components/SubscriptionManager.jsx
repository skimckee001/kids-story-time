import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { 
  Crown, Star, Zap, Lock, Check, X, Gift, 
  Calendar, CreditCard, Sparkles, Users, BookOpen,
  Volume2, Image, Globe, Shield
} from 'lucide-react';
import { useSessionId } from '../hooks/useLocalStorage';

export function SubscriptionManager({ onUpgrade, currentUsage = {} }) {
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const [usageStats, setUsageStats] = useState({
    storiesGenerated: 0,
    audioGenerated: 0,
    illustrationsGenerated: 0,
    seriesCreated: 0
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const sessionId = useSessionId();

  useEffect(() => {
    loadSubscriptionData();
    loadUsageStats();
  }, []);

  const loadSubscriptionData = () => {
    const saved = localStorage.getItem(`subscription_${sessionId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setSubscriptionPlan(data.plan || 'free');
    }
  };

  const loadUsageStats = () => {
    const saved = localStorage.getItem(`usage_stats_${sessionId}`);
    if (saved) {
      setUsageStats(JSON.parse(saved));
    }
  };

  const updateUsage = (type, increment = 1) => {
    const newStats = {
      ...usageStats,
      [type]: (usageStats[type] || 0) + increment
    };
    setUsageStats(newStats);
    localStorage.setItem(`usage_stats_${sessionId}`, JSON.stringify(newStats));
  };

  const subscriptionPlans = {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      color: 'gray',
      icon: Gift,
      features: [
        { name: '3 stories per day', included: true },
        { name: 'Basic themes', included: true },
        { name: 'Text-only stories', included: true },
        { name: 'Audio narration', included: false },
        { name: 'Story illustrations', included: false },
        { name: 'Story series', included: false },
        { name: 'Multiple languages', included: false },
        { name: 'Offline mode', included: false },
        { name: 'Parental dashboard', included: false }
      ],
      limits: {
        storiesPerDay: 3,
        audioGeneration: 0,
        illustrations: 0,
        series: 0,
        languages: 1
      }
    },
    premium: {
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      color: 'blue',
      icon: Star,
      features: [
        { name: 'Unlimited stories', included: true },
        { name: 'All themes & genres', included: true },
        { name: 'Audio narration', included: true },
        { name: 'Story illustrations', included: true },
        { name: 'Story series', included: true },
        { name: 'Multiple languages', included: true },
        { name: 'Offline mode', included: true },
        { name: 'Parental dashboard', included: true },
        { name: 'Priority support', included: true }
      ],
      limits: {
        storiesPerDay: -1, // unlimited
        audioGeneration: -1,
        illustrations: -1,
        series: -1,
        languages: -1
      }
    },
    family: {
      name: 'Family',
      price: '$19.99',
      period: 'month',
      color: 'purple',
      icon: Crown,
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Up to 6 child profiles', included: true },
        { name: 'Advanced parental controls', included: true },
        { name: 'Family sharing', included: true },
        { name: 'Custom character creation', included: true },
        { name: 'Export stories as books', included: true },
        { name: 'Priority customer support', included: true },
        { name: 'Early access to new features', included: true }
      ],
      limits: {
        storiesPerDay: -1,
        audioGeneration: -1,
        illustrations: -1,
        series: -1,
        languages: -1,
        childProfiles: 6
      }
    }
  };

  const getCurrentPlan = () => subscriptionPlans[subscriptionPlan];

  const checkFeatureAccess = (feature) => {
    const plan = getCurrentPlan();
    
    switch (feature) {
      case 'audio':
        return plan.limits.audioGeneration === -1 || usageStats.audioGenerated < plan.limits.audioGeneration;
      case 'illustrations':
        return plan.limits.illustrations === -1 || usageStats.illustrationsGenerated < plan.limits.illustrations;
      case 'series':
        return plan.limits.series === -1 || usageStats.seriesCreated < plan.limits.series;
      case 'unlimited_stories':
        return plan.limits.storiesPerDay === -1;
      case 'multiple_languages':
        return plan.limits.languages === -1 || plan.limits.languages > 1;
      default:
        return subscriptionPlan !== 'free';
    }
  };

  const getUsagePercentage = (type) => {
    const plan = getCurrentPlan();
    const limit = plan.limits[type];
    
    if (limit === -1) return 0; // unlimited
    if (limit === 0) return 100; // not allowed
    
    const usage = usageStats[type] || 0;
    return Math.min((usage / limit) * 100, 100);
  };

  const handleUpgrade = (planKey) => {
    // In a real app, this would integrate with a payment processor
    setSubscriptionPlan(planKey);
    localStorage.setItem(`subscription_${sessionId}`, JSON.stringify({ 
      plan: planKey,
      upgraded_at: new Date().toISOString()
    }));
    
    if (onUpgrade) {
      onUpgrade(planKey);
    }
    
    setShowUpgradeModal(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            <span>Subscription & Usage</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and track feature usage
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <CurrentPlanCard 
            plan={getCurrentPlan()} 
            planKey={subscriptionPlan}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
          
          <FeatureAccessCard 
            plan={getCurrentPlan()}
            checkAccess={checkFeatureAccess}
          />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageStatsCard 
            stats={usageStats}
            plan={getCurrentPlan()}
            getPercentage={getUsagePercentage}
          />
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(subscriptionPlans).map(([key, plan]) => (
              <PlanCard
                key={key}
                planKey={key}
                plan={plan}
                isCurrentPlan={key === subscriptionPlan}
                onSelect={() => handleUpgrade(key)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Gate Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
          plans={subscriptionPlans}
          currentPlan={subscriptionPlan}
        />
      )}
    </div>
  );
}

function CurrentPlanCard({ plan, planKey, onUpgrade }) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const IconComponent = plan.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${colorClasses[plan.color]}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{plan.name} Plan</CardTitle>
              <CardDescription>
                {plan.price}/{plan.period}
              </CardDescription>
            </div>
          </div>
          
          {planKey === 'free' && (
            <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {plan.features.slice(0, 6).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span className={feature.included ? 'text-gray-800' : 'text-gray-500'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureAccessCard({ plan, checkAccess }) {
  const features = [
    { key: 'audio', name: 'Audio Narration', icon: Volume2 },
    { key: 'illustrations', name: 'Story Illustrations', icon: Image },
    { key: 'series', name: 'Story Series', icon: BookOpen },
    { key: 'multiple_languages', name: 'Multiple Languages', icon: Globe },
    { key: 'unlimited_stories', name: 'Unlimited Stories', icon: Zap }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {features.map((feature) => {
            const hasAccess = checkAccess(feature.key);
            const IconComponent = feature.icon;
            
            return (
              <div key={feature.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <span>{feature.name}</span>
                </div>
                
                {hasAccess ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function UsageStatsCard({ stats, plan, getPercentage }) {
  const usageItems = [
    { key: 'storiesGenerated', name: 'Stories Generated', icon: BookOpen, limit: plan.limits.storiesPerDay },
    { key: 'audioGenerated', name: 'Audio Generated', icon: Volume2, limit: plan.limits.audioGeneration },
    { key: 'illustrationsGenerated', name: 'Illustrations', icon: Image, limit: plan.limits.illustrations },
    { key: 'seriesCreated', name: 'Series Created', icon: Users, limit: plan.limits.series }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <CardDescription>Track your feature usage this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageItems.map((item) => {
          const IconComponent = item.icon;
          const usage = stats[item.key] || 0;
          const limit = item.limit;
          const percentage = getPercentage(item.key);
          
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage} {limit === -1 ? '/ unlimited' : `/ ${limit}`}
                </span>
              </div>
              
              {limit !== -1 && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${percentage >= 90 ? 'bg-red-100' : 'bg-gray-100'}`}
                />
              )}
              
              {limit !== -1 && percentage >= 90 && (
                <p className="text-xs text-red-600">
                  You're approaching your limit. Consider upgrading for unlimited access.
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PlanCard({ planKey, plan, isCurrentPlan, onSelect }) {
  const colorClasses = {
    gray: 'border-gray-200',
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const IconComponent = plan.icon;

  return (
    <Card className={`${colorClasses[plan.color]} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className={`p-3 rounded-full ${
            plan.color === 'gray' ? 'bg-gray-100' : 
            plan.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
          }`}>
            <IconComponent className={`h-6 w-6 ${
              plan.color === 'gray' ? 'text-gray-600' : 
              plan.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
            }`} />
          </div>
        </div>
        
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          {plan.price}
          <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {feature.included ? (
                <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
              <span className={feature.included ? 'text-gray-800' : 'text-gray-500'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
        
        <Button
          onClick={() => onSelect(planKey)}
          disabled={isCurrentPlan}
          className={`w-full ${
            isCurrentPlan 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : plan.color === 'purple' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}

function UpgradeModal({ onClose, onUpgrade, plans, currentPlan }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Unlock premium features and unlimited access to create amazing stories for your children
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(plans).filter(([key]) => key !== 'free').map(([key, plan]) => (
              <PlanCard
                key={key}
                planKey={key}
                plan={plan}
                isCurrentPlan={key === currentPlan}
                onSelect={() => onUpgrade(key)}
              />
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Why Upgrade?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create unlimited personalized stories for your children</li>
              <li>• Add professional voice narration to bring stories to life</li>
              <li>• Generate beautiful illustrations for each story</li>
              <li>• Create ongoing story series with your child as the hero</li>
              <li>• Access stories in multiple languages</li>
              <li>• Save stories for offline reading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Gate Hook
export function useFeatureGate() {
  const sessionId = useSessionId();
  
  const checkFeatureAccess = (feature) => {
    const subscriptionData = localStorage.getItem(`subscription_${sessionId}`);
    const plan = subscriptionData ? JSON.parse(subscriptionData).plan : 'free';
    
    // Simple feature gating logic
    if (plan === 'free') {
      return ['basic_stories'].includes(feature);
    }
    
    return true; // Premium and Family have access to all features
  };
  
  const trackUsage = (feature) => {
    const usageKey = `usage_stats_${sessionId}`;
    const currentUsage = JSON.parse(localStorage.getItem(usageKey) || '{}');
    
    const featureMap = {
      'story_generation': 'storiesGenerated',
      'audio_generation': 'audioGenerated',
      'illustration_generation': 'illustrationsGenerated',
      'series_creation': 'seriesCreated'
    };
    
    const usageKey2 = featureMap[feature];
    if (usageKey2) {
      currentUsage[usageKey2] = (currentUsage[usageKey2] || 0) + 1;
      localStorage.setItem(usageKey, JSON.stringify(currentUsage));
    }
  };
  
  return { checkFeatureAccess, trackUsage };
}

