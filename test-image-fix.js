// Test script to verify image display fix
// Run this in browser console after generating a story

console.log('=== TESTING IMAGE FIX ===');

// 1. Check current localStorage
const libraryStories = localStorage.getItem('libraryStories');
if (libraryStories) {
  const stories = JSON.parse(libraryStories);
  console.log('\nStories in library:', stories.length);
  
  stories.forEach((story, idx) => {
    console.log(`\nStory ${idx + 1}: ${story.title}`);
    console.log('  Has image_url:', !!story.image_url);
    console.log('  Has imageUrl:', !!story.imageUrl);
    console.log('  image_url value:', story.image_url);
    console.log('  imageUrl value:', story.imageUrl);
    
    // Check if they're the same
    if (story.image_url || story.imageUrl) {
      const areEqual = story.image_url === story.imageUrl;
      console.log('  Properties match:', areEqual);
      
      // Test if URL is valid
      if (story.image_url || story.imageUrl) {
        const url = story.image_url || story.imageUrl;
        console.log('  URL starts with http:', url.startsWith('http'));
        console.log('  Is placeholder:', url.includes('placeholder'));
        console.log('  Is Unsplash:', url.includes('unsplash'));
      }
    }
  });
} else {
  console.log('No stories in library');
}

console.log('\n=== TEST COMPLETE ===');
console.log('Generate a new story and run this script again to verify images are saved correctly');