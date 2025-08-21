// Create Stripe customer portal session for subscription management
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID required' })
      };
    }

    // Find customer by metadata
    const customers = await stripe.customers.list({
      limit: 100 // Search through customers
    });

    const customer = customers.data.find(c => 
      c.metadata.supabase_user_id === userId
    );

    if (!customer) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No subscription found for this user' })
      };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.SITE_URL || 'https://kidsstorytime.org'}/profile`
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        url: session.url 
      })
    };
  } catch (error) {
    console.error('Portal session error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create portal session',
        details: error.message 
      })
    };
  }
};