// Stripe integration for Kids Story Time
import { loadStripe } from '@stripe/stripe-js';
import { supabase, auth } from './supabase';

// Initialize Stripe (will use public key from env)
let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      console.error('Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY');
      return null;
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null, // No Stripe price ID for free tier
    features: [
      'Basic story generation',
      'Placeholder images',
      '3 stories per day',
      'Basic themes'
    ],
    limits: {
      storiesPerDay: 3,
      imageQuality: 'placeholder',
      themes: ['adventure', 'fairytale', 'educational', 'bedtime']
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'Enhanced story generation',
      'Stock photo images',
      '10 stories per day',
      'All themes',
      'Story library',
      'Export to PDF'
    ],
    limits: {
      storiesPerDay: 10,
      imageQuality: 'stock',
      themes: 'all'
    }
  },
  family: {
    id: 'family',
    name: 'Family',
    price: 19.99,
    priceId: 'price_family_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited story generation',
      'AI-generated images',
      'Multiple child profiles',
      'All themes',
      'Story library',
      'Export to PDF',
      'Audio narration',
      'Priority support'
    ],
    limits: {
      storiesPerDay: 999,
      imageQuality: 'ai',
      themes: 'all',
      maxChildren: 10
    }
  }
};

// Stripe checkout session
export const createCheckoutSession = async (tier) => {
  try {
    const user = await auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to subscribe');
    }

    const priceId = SUBSCRIPTION_TIERS[tier]?.priceId;
    if (!priceId) {
      throw new Error('Invalid subscription tier');
    }

    // Call Netlify function to create checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        userEmail: user.email,
        tier
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (tier) => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const sessionId = await createCheckoutSession(tier);
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
};

// Create customer portal session for managing subscriptions
export const createPortalSession = async () => {
  try {
    const user = await auth.getUser();
    if (!user) {
      throw new Error('User must be logged in');
    }

    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const user = await auth.getUser();
    if (!user) {
      return { tier: 'free', status: 'active' };
    }

    // Check Supabase for subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { tier: 'free', status: 'active' };
    }

    return {
      tier: data.tier || 'free',
      status: data.status || 'active',
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { tier: 'free', status: 'active' };
  }
};

// Update subscription in database (called by webhook)
export const updateSubscription = async (userId, subscriptionData) => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionData.id,
        stripe_customer_id: subscriptionData.customer,
        tier: subscriptionData.metadata?.tier || 'premium',
        status: subscriptionData.status,
        current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export default {
  getStripe,
  SUBSCRIPTION_TIERS,
  createCheckoutSession,
  redirectToCheckout,
  createPortalSession,
  checkSubscriptionStatus,
  updateSubscription
};