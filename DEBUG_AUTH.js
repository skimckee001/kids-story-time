// DEBUGGING SCRIPT - Run this in browser console at http://localhost:3001

console.log('=== AUTH DEBUG ===');
console.log('1. Current localStorage:');
console.log('   mockUser:', localStorage.getItem('mockUser'));
console.log('   subscriptionTier:', localStorage.getItem('subscriptionTier'));
console.log('   devMode:', localStorage.getItem('devMode'));

// Force set everything
console.log('\n2. Setting up test environment...');

// Clear first
localStorage.clear();

// Set mock user with all required fields
const testUser = {
  id: 'mock-123',
  email: 'test@kidsstorytime.ai',
  user_metadata: {
    full_name: 'Test User'
  },
  app_metadata: {
    provider: 'email'
  },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString()
};

localStorage.setItem('mockUser', JSON.stringify(testUser));
localStorage.setItem('subscriptionTier', 'story-pro');
localStorage.setItem('devMode', 'true');

console.log('\n3. Mock user created:');
console.log(testUser);

console.log('\n4. Reloading in 2 seconds...');
console.log('   You should see:');
console.log('   ✅ Profile icon instead of "Sign In"');
console.log('   ✅ Purple test button (🧪) in bottom-right');

setTimeout(() => {
  window.location.reload();
}, 2000);