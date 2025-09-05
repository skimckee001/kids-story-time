// Debug script to trace image flow
// Run this in browser console to see what's happening

console.log('=== DEBUGGING IMAGE FLOW ===');

// 1. Check what's in localStorage
console.log('\n1. LOCALSTORAGE CONTENTS:');
const libraryStories = localStorage.getItem('libraryStories');
const stories = localStorage.getItem('stories');

if (libraryStories) {
  const parsed = JSON.parse(libraryStories);
  console.log('libraryStories count:', parsed.length);
  parsed.forEach((story, index) => {
    console.log(`  Story ${index}:`, {
      id: story.id,
      title: story.title,
      has_image_url: !!story.image_url,
      has_imageUrl: !!story.imageUrl,
      image_url: story.image_url,
      imageUrl: story.imageUrl
    });
  });
} else {
  console.log('  No libraryStories found');
}

if (stories) {
  const parsed = JSON.parse(stories);
  console.log('stories count:', parsed.length);
} else {
  console.log('  No stories found');
}

// 2. Check mock user
console.log('\n2. MOCK USER:');
const mockUser = localStorage.getItem('mockUser');
if (mockUser) {
  console.log('  Mock user:', JSON.parse(mockUser));
} else {
  console.log('  No mock user');
}

// 3. Check subscription tier
console.log('\n3. SUBSCRIPTION TIER:');
console.log('  Tier:', localStorage.getItem('subscriptionTier'));

// 4. Function to monitor story saves
console.log('\n4. MONITORING INSTRUCTIONS:');
console.log('To monitor story saves in real-time, run:');
console.log(`
// Monitor localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === 'libraryStories') {
    console.log('SAVING TO LIBRARY:', {
      key,
      stories: JSON.parse(value).map(s => ({
        id: s.id,
        title: s.title,
        has_image: !!s.image_url || !!s.imageUrl,
        image_url: s.image_url,
        imageUrl: s.imageUrl
      }))
    });
  }
  return originalSetItem.call(this, key, value);
};
console.log('Monitoring enabled - generate a story to see saves');
`);

// 5. Clear functions
console.log('\n5. CLEANUP FUNCTIONS:');
console.log('To clear library: localStorage.removeItem("libraryStories")');
console.log('To clear all stories: localStorage.removeItem("stories")');
console.log('To clear everything: localStorage.clear()');

console.log('\n=== END DEBUG ===');