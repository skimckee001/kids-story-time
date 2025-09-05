// Stripe integration for Kids Story Time
import { loadStripe } from '@stripe/stripe-js';
import { supabase, auth } from './supabase';

// Initialize Stripe (will use public key from env)
let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY in your environment variables.');
    }
    
    // Warn if using test key in production
    if (!import.meta.env.DEV && publicKey.startsWith('pk_test_')) {
      console.error('WARNING: Using test Stripe key in production environment!');
    }
    
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  'reader-free': {
    id: 'reader-free',
    name: 'Infrequent Reader (Free)',
    price: 0,
    priceId: null, // No Stripe price ID for free tier
    productId: null,
    features: [
      '3 stories per day (10/month)',
      'Stock illustrations',
      '1 AI image per month',
      '1 narration per month',
      'Watermarked PDFs',
      'Last 2 stories only'
    ],
    limits: {
      storiesPerDay: 3,
      storiesPerMonth: 10,
      aiImagesPerMonth: 1,
      narrationsPerMonth: 1,
      imageQuality: 'stock',
      themes: ['adventure', 'fairytale', 'educational', 'bedtime']
    }
  },
  'story-pro': {
    id: 'story-pro',
    name: 'Story Pro',
    price: 4.99,
    priceId: 'price_1S2Bdq0MYOtGjLFhBYSIU8L9', // Story Pro price ID
    productId: 'prod_Sy7tSlrclTh6K0', // Story Pro product ID
    features: [
      '10 stories per day (50/month)',
      '30 AI images per month',
      '3 narrations per month',
      '2 child profiles',
      'Full library access',
      'Non-watermarked PDFs',
      'Ad-free experience'
    ],
    limits: {
      storiesPerDay: 10,
      storiesPerMonth: 50,
      aiImagesPerMonth: 30,
      narrationsPerMonth: 3,
      imageQuality: 'ai',
      themes: 'all',
      maxChildren: 2
    }
  },
  'read-to-me-promax': {
    id: 'read-to-me-promax',
    name: 'Read to Me ProMax',
    price: 6.99,
    priceId: 'price_1S3E8k0MYOtGjLFhbQQ2EKzw', // Read to Me ProMax price ID
    productId: 'prod_SzCXUDassA5zJi', // Read to Me ProMax product ID
    features: [
      '20 stories per day (100/month)',
      '150 AI images per month',
      '30 narrations per month',
      '2 child profiles',
      'Full library access',
      'Audio downloads',
      'Bedtime reminders & streaks',
      'Non-watermarked PDFs',
      'Ad-free experience'
    ],
    limits: {
      storiesPerDay: 20,
      storiesPerMonth: 100,
      aiImagesPerMonth: 150,
      narrationsPerMonth: 30,
      imageQuality: 'ai',
      themes: 'all',
      maxChildren: 2
    }
  },
  'family-plus': {
    id: 'family-plus',
    name: 'Family Plus',
    price: 7.99,
    priceId: 'price_1S2BgM0MYOtGjLFhlBjRzwaV', // Family Plus price ID
    productId: 'prod_Sy7whD8okJo5NO', // Family Plus product ID
    features: [
      'Unlimited stories',
      '250 AI images per month',
      '50 narrations per month',
      '4 child profiles',
      'Full library access',
      'Priority support',
      'Beta features access',
      'Non-watermarked PDFs',
      'Ad-free experience'
    ],
    limits: {
      storiesPerDay: 999,
      storiesPerMonth: 999,
      aiImagesPerMonth: 250,
      narrationsPerMonth: 50,
      imageQuality: 'ai',
      themes: 'all',
      maxChildren: 4
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
      return { tier: 'reader-free', status: 'active' };
    }

    // Check Supabase for subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { tier: 'reader-free', status: 'active' };
    }

    return {
      tier: data.tier || 'reader-free',
      status: data.status || 'active',
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { tier: 'reader-free', status: 'active' };
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
        tier: subscriptionData.metadata?.tier || 'story-maker-basic',
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