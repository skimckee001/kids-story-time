// MOCK STORY TESTING - Run this in browser console at http://localhost:3000
// This creates mock stories for testing without needing the API

console.log('=== MOCK STORY TESTING MODE ===');

// 1. Set up Pro tier
localStorage.setItem('mockUser', JSON.stringify({
  id: 'pro-user-123',
  email: 'pro@kidsstorytime.ai'
}));
localStorage.setItem('subscriptionTier', 'story-pro');
localStorage.setItem('devMode', 'true');

// 2. Create test profile
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

// 3. Create mock stories for library
const mockStories = [
  {
    id: 'story-1',
    title: "The Magical Adventure",
    story: "Once upon a time, there was a brave child named Test Child who loved adventures. One sunny morning, they discovered a mysterious map hidden in their backyard. The map led to a magical forest where talking animals lived. Test Child befriended a wise owl and a playful rabbit who helped them find a hidden treasure. The treasure wasn't gold or jewels, but something even better - a book of endless stories that could take them on new adventures every day. Test Child learned that the greatest treasures are the friends we make along the way.",
    imageUrl: "https://via.placeholder.com/400x300/9333ea/ffffff?text=Magical+Adventure",
    themes: ['adventure', 'friendship'],
    savedAt: new Date().toISOString(),
    childName: 'Test Child'
  },
  {
    id: 'story-2',
    title: "The Dinosaur in Space",
    story: "Test Child always dreamed of going to space. One night, while looking at the stars, a friendly dinosaur named Rex appeared with a spaceship! Rex was from a planet where dinosaurs never went extinct. Together, they flew through the galaxy, visited the rings of Saturn, and had a picnic on the moon. They met alien friends who taught them about different planets. Test Child learned that the universe is full of wonders and that dreams can come true in the most unexpected ways.",
    imageUrl: "https://via.placeholder.com/400x300/3b82f6/ffffff?text=Dinosaur+Space",
    themes: ['space', 'dinosaur'],
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    childName: 'Test Child'
  },
  {
    id: 'story-3',
    title: "The Friendship Garden",
    story: "In a small town, Test Child discovered a forgotten garden behind the library. With the help of new friends from the neighborhood, they decided to bring it back to life. Each friend planted something special - flowers, vegetables, and even a friendship tree. As the garden grew, so did their friendships. They learned to work together, share responsibilities, and celebrate each small success. The garden became a magical place where all the children in town could play and learn together.",
    imageUrl: "https://via.placeholder.com/400x300/10b981/ffffff?text=Friendship+Garden",
    themes: ['friendship', 'nature'],
    savedAt: new Date(Date.now() - 172800000).toISOString(),
    childName: 'Test Child'
  }
];

// Save stories to localStorage
localStorage.setItem('stories', JSON.stringify(mockStories));
localStorage.setItem('currentStory', JSON.stringify(mockStories[0]));

// 4. Set mock usage stats
localStorage.setItem('dailyStoriesUsed', '3');
localStorage.setItem('monthlyStoriesUsed', '25');
localStorage.setItem('aiIllustrationsUsed', '15');
localStorage.setItem('narrationsUsed', '5');

// 5. Add mock achievements
const mockAchievements = [
  { id: 'first-story', name: 'First Story', description: 'Read your first story', unlockedAt: new Date().toISOString() },
  { id: 'week-streak', name: 'Week Warrior', description: '7 day reading streak', unlockedAt: new Date().toISOString() }
];
localStorage.setItem('achievements_profile-1', JSON.stringify(mockAchievements));

console.log('✅ Mock data created!');
console.log('📚 3 stories added to library');
console.log('👤 Pro tier activated');
console.log('🏆 2 achievements unlocked');
console.log('');
console.log('Reloading in 2 seconds...');

// Function to intercept story generation
window.mockStoryGeneration = true;
window.generateMockStory = function() {
  const titles = [
    "The Secret of the Hidden Cave",
    "Journey to the Cloud Kingdom", 
    "The Talking Animals' Party",
    "Mystery of the Missing Cookies",
    "The Superhero Training Academy"
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  
  return {
    title: randomTitle,
    story: `This is a wonderful story about Test Child and their amazing adventure. ${randomTitle} begins when Test Child discovers something extraordinary in their backyard. With courage and creativity, they embark on an incredible journey filled with surprises, new friends, and valuable lessons. Through challenges and triumphs, Test Child learns about friendship, bravery, and the power of imagination. The adventure concludes with Test Child returning home, changed for the better and ready for the next adventure.`,
    imageUrl: `https://via.placeholder.com/400x300/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(randomTitle)}`,
    themes: ['adventure', 'friendship'],
    savedAt: new Date().toISOString()
  };
};

setTimeout(() => {
  window.location.reload();
}, 2000);