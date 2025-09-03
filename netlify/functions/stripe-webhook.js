// Stripe webhook handler for subscription events
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Map Stripe price IDs to subscription tiers
const PRICE_TO_TIER = {
  'price_1S2Bdq0MYOtGjLFhBYSIU8L9': 'story-pro', // Story Pro - TODO: Update with actual price ID
  'price_1S3E8k0MYOtGjLFhbQQ2EKzw': 'read-to-me-promax', // Read to Me ProMax
  'price_1S2BgM0MYOtGjLFhlBjRzwaV': 'family-plus', // Family Plus - TODO: Update with actual price ID
};

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature or webhook secret' })
    };
  }

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  try {
    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const userId = session.metadata.supabase_user_id;
        const tier = session.metadata.tier || 'premium';

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update user's subscription in Supabase
        await updateSubscription(userId, subscription, tier);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata.supabase_user_id;
        const tier = subscription.metadata.tier || determineTierFromPrice(subscription);
        
        await updateSubscription(userId, subscription, tier);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata.supabase_user_id;
        
        // Set subscription to cancelled
        await cancelSubscription(userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object;
        // Optional: Update payment history
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        // Optional: Send payment failed email
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        details: error.message 
      })
    };
  }
};

// Helper function to update subscription in Supabase
async function updateSubscription(userId, subscription, tier) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        tier: tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    // Also update the user's profile
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    console.log(`Updated subscription for user ${userId} to tier ${tier}`);
  } catch (error) {
    console.error('Error updating subscription in Supabase:', error);
    throw error;
  }
}

// Helper function to cancel subscription
async function cancelSubscription(userId) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Update user profile to free tier
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    console.log(`Cancelled subscription for user ${userId}`);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Helper function to determine tier from price
function determineTierFromPrice(subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  return PRICE_TO_TIER[priceId] || 'premium';
}