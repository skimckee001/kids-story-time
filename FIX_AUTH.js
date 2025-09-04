// RUN THIS IN YOUR BROWSER CONSOLE AT http://localhost:3000
// This will fix the authentication and show the dev panel

// Option 1: Enable Dev Mode and Mock User (Recommended)
function fixAuth() {
  console.log('🔧 Fixing authentication...');
  
  // Enable dev mode
  localStorage.setItem('devMode', 'true');
  console.log('✅ Dev mode enabled');
  
  // Create a mock user
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    tier: 'story-pro',
    created_at: new Date().toISOString()
  };
  
  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  localStorage.setItem('subscriptionTier', 'story-pro');
  console.log('✅ Mock user created:', mockUser.email);
  console.log('✅ Tier set to:', mockUser.tier);
  
  console.log('🔄 Reloading page...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Option 2: Just enable dev panel without login
function showDevPanel() {
  localStorage.setItem('devMode', 'true');
  console.log('✅ Dev mode enabled - reloading...');
  window.location.reload();
}

// Option 3: Clear everything and start fresh
function clearAll() {
  console.log('🧹 Clearing all test data...');
  localStorage.clear();
  console.log('✅ All data cleared - reloading...');
  window.location.reload();
}

// Option 4: Check current status
function checkStatus() {
  console.log('📊 Current Status:');
  console.log('Dev Mode:', localStorage.getItem('devMode'));
  console.log('Mock User:', localStorage.getItem('mockUser'));
  console.log('Subscription Tier:', localStorage.getItem('subscriptionTier'));
  
  const mockUser = localStorage.getItem('mockUser');
  if (mockUser) {
    console.log('User Details:', JSON.parse(mockUser));
  }
}

console.log(`
╔════════════════════════════════════════╗
║   🎯 KIDSSTORYTIME AUTH FIX TOOL       ║
╚════════════════════════════════════════╝

Run one of these commands:

1️⃣  fixAuth()     - Set up mock user & enable dev panel
2️⃣  showDevPanel() - Just show the dev panel  
3️⃣  clearAll()     - Clear everything and start fresh
4️⃣  checkStatus()  - Check current auth status

Example: Type fixAuth() and press Enter
`);

// Auto-run fix if nothing is set up
if (!localStorage.getItem('mockUser') && !localStorage.getItem('devMode')) {
  console.log('🚀 Auto-fixing authentication...');
  fixAuth();
}