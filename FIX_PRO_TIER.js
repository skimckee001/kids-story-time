// FIX PRO TIER - Run this in browser console at http://localhost:8888

console.log('=== FIXING PRO TIER ===');

// Clear everything first
localStorage.clear();

// Set up Story Pro tier
const proUser = {
  id: 'pro-user-123',
  email: 'pro@kidsstorytime.ai',
  tier: 'story-pro'
};

localStorage.setItem('mockUser', JSON.stringify(proUser));
localStorage.setItem('subscriptionTier', 'story-pro');
localStorage.setItem('devMode', 'true');

console.log('✅ Set to Story Pro tier');
console.log('✅ Mock user:', proUser);
console.log('✅ Dev mode enabled');

// Set a test profile
const testProfile = {
  id: 'profile-1',
  name: 'Test Child',
  gender: 'either',
  reading_level: 'developing-reader',
  include_name_in_stories: true,
  favorite_themes: ['adventure', 'friendship'],
  favorite_items: ['dinosaurs', 'space']
};

localStorage.setItem('selectedChildProfile', JSON.stringify(testProfile));
console.log('✅ Test profile created:', testProfile.name);

console.log('\n🔄 Reloading page in 2 seconds...');
console.log('You should now have:');
console.log('  - Story Pro tier ($4.99)');
console.log('  - All image styles available');
console.log('  - 10 stories per day');
console.log('  - 30 AI images per month');

setTimeout(() => {
  window.location.reload();
}, 2000);