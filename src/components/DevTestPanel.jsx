import { useState, useEffect } from 'react';

const DevTestPanel = ({ onTierChange, currentTier }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Test accounts for different tiers (aligned with pricing page)
  const testAccounts = [
    {
      tier: 'try-now',
      name: 'Guest User',
      email: 'guest@test.com',
      description: '1 story trial, no account needed',
      color: '#9ca3af'
    },
    {
      tier: 'reader-free',
      name: 'Infrequent Reader',
      email: 'free@test.com',
      description: 'FREE - 3 stories/day, 10/month',
      color: '#10b981'
    },
    {
      tier: 'story-pro',
      name: 'Story Pro',
      email: 'storypro@test.com',
      description: '$4.99 - 10 stories/day + 30 AI images',
      color: '#3b82f6'
    },
    {
      tier: 'read-to-me-promax',
      name: 'Read to Me ProMax',
      email: 'promax@test.com',
      description: '$6.99 - 20 stories/day + narration',
      color: '#a855f7'
    },
    {
      tier: 'family-plus',
      name: 'Family Plus',
      email: 'familyplus@test.com',
      description: '$7.99 - Unlimited + 4 profiles',
      color: '#f59e0b'
    }
  ];

  // Only show in development builds - no production backdoors
  useEffect(() => {
    // ONLY check build-time flag, ignore URL params and localStorage in production
    const isDev = import.meta.env.DEV;
    setShowPanel(isDev);
    
    // Check for keyboard shortcut (Ctrl+Shift+D or Cmd+Shift+D) to toggle dev mode
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        const currentDevMode = localStorage.getItem('devMode') === 'true';
        localStorage.setItem('devMode', (!currentDevMode).toString());
        window.location.reload();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const switchToTier = (tier, email) => {
    // Create mock user for testing
    const mockUser = {
      id: `test-${tier}`,
      email: email,
      tier: tier,
      created_at: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    localStorage.setItem('subscriptionTier', tier);
    
    // Trigger tier change
    if (onTierChange) {
      onTierChange(tier);
    }
    
    // Reload to apply changes
    window.location.reload();
  };

  const clearTestAccount = () => {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('subscriptionTier');
    window.location.reload();
  };

  // Don't render anything in production
  if (!showPanel) {
    return null;
  }

  return (
    <>
      {/* Floating Dev Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: 9998,
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title="Developer Test Panel"
      >
        🧪
      </button>

      {/* Test Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '350px',
          maxHeight: '500px',
          overflowY: 'auto',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          padding: '20px',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #f3f4f6',
            paddingBottom: '10px'
          }}>
            <h3 style={{ margin: 0, color: '#1f2937' }}>🧪 Test Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              margin: '0 0 10px 0'
            }}>
              Current Tier: <strong style={{ color: '#8b5cf6' }}>{currentTier}</strong>
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '10px' }}>
              Quick Tier Switch:
            </h4>
            
            {testAccounts.map((account) => (
              <button
                key={account.tier}
                onClick={() => switchToTier(account.tier, account.email)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '10px',
                  background: currentTier === account.tier 
                    ? `linear-gradient(135deg, ${account.color}, ${account.color}dd)`
                    : 'white',
                  color: currentTier === account.tier ? 'white' : '#374151',
                  border: `2px solid ${account.color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (currentTier !== account.tier) {
                    e.target.style.background = `${account.color}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTier !== account.tier) {
                    e.target.style.background = 'white';
                  }
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {account.name}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.9
                }}>
                  {account.description}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.7,
                  marginTop: '2px'
                }}>
                  {account.email}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={clearTestAccount}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Clear Test Account
          </button>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#92400e'
          }}>
            ⚠️ Dev Mode Only - Not visible in production
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default DevTestPanel;