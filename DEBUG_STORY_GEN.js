// DEBUG STORY GENERATION
// Run this in browser console at http://localhost:3001

console.log('=== STORY GENERATION DEBUG ===');

// Check environment variables
console.log('\n1. Environment Variables:');
console.log('   VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ MISSING');
console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ MISSING');
console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ MISSING');

// Check localStorage
console.log('\n2. User & Tier:');
const mockUser = localStorage.getItem('mockUser');
const tier = localStorage.getItem('subscriptionTier');
console.log('   Mock User:', mockUser ? '✅ Set' : '❌ Not set');
console.log('   Tier:', tier || 'Not set');

// Check if story generation endpoint exists
console.log('\n3. Testing Story Generation Endpoint:');

async function testStoryGeneration() {
  const testPayload = {
    childName: 'Test',
    age: 5,
    gender: 'neutral',
    theme: 'adventure',
    prompt: 'A fun adventure',
    wordCount: 100,
    readingLevel: 'early-reader',
    imageStyle: 'age-appropriate',
    useV2: true
  };
  
  console.log('   Sending test request...');
  
  try {
    const response = await fetch('/.netlify/functions/generate-story-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    console.log('   Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error response:', errorText);
      
      if (response.status === 404) {
        console.error('   💡 The story generation endpoint not found. Make sure Netlify functions are set up.');
      } else if (errorText.includes('API key')) {
        console.error('   💡 OpenAI API key is missing or invalid. Add it to your .env file.');
      }
    } else {
      const data = await response.json();
      console.log('   ✅ Story generated successfully!');
      console.log('   Story preview:', data.story.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('   ❌ Network error:', error);
    console.log('   💡 This might be because:');
    console.log('      - Netlify functions are not running (use: netlify dev)');
    console.log('      - Or the endpoint is not configured properly');
  }
}

// Run the test
testStoryGeneration();

console.log('\n4. Troubleshooting Tips:');
console.log('   • Make sure you have added your OpenAI API key to .env file');
console.log('   • The key should start with: sk-...');
console.log('   • For local development, you might need to run: netlify dev');
console.log('   • Or the story generation might be using a different endpoint');