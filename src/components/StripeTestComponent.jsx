import { useState } from 'react';
import { getStripe, SUBSCRIPTION_TIERS, createCheckoutSession } from '../lib/stripe';

function StripeTestComponent() {
  const [testStatus, setTestStatus] = useState({});
  const [loading, setLoading] = useState(false);
  
  const runTests = async () => {
    setLoading(true);
    const results = {};
    
    // Test 1: Check if Stripe loads
    try {
      const stripe = await getStripe();
      results.stripeInit = stripe ? '✅ Stripe initialized' : '❌ Failed to initialize Stripe';
    } catch (error) {
      results.stripeInit = `❌ Error: ${error.message}`;
    }
    
    // Test 2: Verify price IDs exist
    results.priceIds = {};
    Object.entries(SUBSCRIPTION_TIERS).forEach(([key, tier]) => {
      if (tier.priceId) {
        results.priceIds[key] = `✅ ${tier.name}: ${tier.priceId}`;
      } else if (key === 'reader-free') {
        results.priceIds[key] = `✅ ${tier.name}: Free tier (no price ID)`;
      } else {
        results.priceIds[key] = `❌ ${tier.name}: Missing price ID`;
      }
    });
    
    // Test 3: Check environment variables
    const hasPublicKey = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    results.envVars = hasPublicKey 
      ? '✅ Stripe public key found in environment' 
      : '⚠️ Using fallback Stripe public key';
    
    setTestStatus(results);
    setLoading(false);
  };
  
  const testCheckout = async (tier) => {
    try {
      setLoading(true);
      const stripe = await getStripe();
      if (!stripe) {
        alert('Stripe not initialized');
        return;
      }
      
      // Create mock user for testing
      const mockUser = {
        id: 'test-user-123',
        email: 'test@kidsstorytime.ai',
        tier: tier
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      
      // Test creating a checkout session
      alert(`Ready to test ${SUBSCRIPTION_TIERS[tier].name} checkout.\n\nPrice: $${SUBSCRIPTION_TIERS[tier].price}/month\nPrice ID: ${SUBSCRIPTION_TIERS[tier].priceId}\n\nNote: In production, this would redirect to Stripe checkout.`);
      
      // In production, this would call:
      // await redirectToCheckout(tier);
      
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 10000
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>🧪 Stripe Integration Test</h2>
      
      <button 
        onClick={runTests}
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
          fontSize: '16px'
        }}
      >
        {loading ? 'Testing...' : 'Run Integration Tests'}
      </button>
      
      {Object.keys(testStatus).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Test Results:</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>1. Stripe Initialization:</strong>
            <div>{testStatus.stripeInit}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>2. Subscription Tiers:</strong>
            {testStatus.priceIds && Object.entries(testStatus.priceIds).map(([key, value]) => (
              <div key={key} style={{ marginLeft: '20px' }}>{value}</div>
            ))}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>3. Environment:</strong>
            <div>{testStatus.envVars}</div>
          </div>
          
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3>Test Checkout Flow:</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => testCheckout('story-maker-basic')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #48c774, #3ec46d)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Test Story Maker ($4.99)
              </button>
              
              <button
                onClick={() => testCheckout('family-plus')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #3298dc, #2171b5)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Test Family Plan ($7.99)
              </button>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
              <strong>⚠️ Test Mode:</strong>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                The Stripe integration is currently using TEST keys. Use these test cards:
              </p>
              <ul style={{ margin: '5px 0', fontSize: '14px' }}>
                <li>Success: 4242 4242 4242 4242</li>
                <li>Decline: 4000 0000 0000 0002</li>
                <li>Any future date for expiry, any 3 digits for CVC</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => {
          const testComponent = document.getElementById('stripe-test-component');
          if (testComponent) {
            testComponent.remove();
          }
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        ×
      </button>
    </div>
  );
}

export default StripeTestComponent;