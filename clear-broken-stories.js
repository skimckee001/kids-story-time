// Script to clean up stories with broken placeholder.com URLs
// Run this in browser console to remove old stories with broken images

console.log('=== CLEANING BROKEN STORIES ===');

const libraryStories = localStorage.getItem('libraryStories');
if (libraryStories) {
  const stories = JSON.parse(libraryStories);
  console.log('Current stories:', stories.length);
  
  // Filter out stories with broken placeholder URLs
  const cleanedStories = stories.filter(story => {
    const imageUrl = story.image_url || story.imageUrl;
    if (imageUrl && imageUrl.includes('via.placeholder.com')) {
      console.log('Removing story with broken placeholder image:', story.title);
      return false;
    }
    return true;
  });
  
  console.log('Stories after cleanup:', cleanedStories.length);
  console.log('Removed:', stories.length - cleanedStories.length, 'stories');
  
  // Save cleaned stories back
  localStorage.setItem('libraryStories', JSON.stringify(cleanedStories));
  
  console.log('\n✅ Cleanup complete!');
  console.log('Generate new stories to test with working images.');
} else {
  console.log('No library stories found');
}

console.log('\nTo completely reset, run: localStorage.removeItem("libraryStories")');