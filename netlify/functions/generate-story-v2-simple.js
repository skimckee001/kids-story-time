// Simplified v2 story generation for testing
import OpenAI from 'openai';

export async function handler(event) {
  console.log('Generate-story-v2-simple function called - v1.1');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('No API key found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key not configured',
          env: Object.keys(process.env).filter(k => k.includes('OPENAI'))
        })
      };
    }

    // Parse request
    const body = JSON.parse(event.body);
    const { 
      childAge = 8, 
      childName = 'Alex',
      interests = 'adventures',
      storyLength = 'medium'
    } = body;

    console.log('Request:', { childAge, childName, interests, storyLength });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    // Simple word targets
    const wordTargets = {
      'short': 350,
      'medium': 900,
      'long': 1400,
      'extended': 2000
    };
    
    const targetWords = wordTargets[storyLength] || 900;

    // Generate story with single prompt
    const prompt = `Write a ${targetWords}-word children's story for a ${childAge}-year-old named ${childName} about ${interests}.

Requirements:
- EXACTLY ${targetWords} words
- Age-appropriate vocabulary
- Clear beginning, middle, end
- Include ${childName} as the main character

Write ONLY the story text, no titles or notes.`;

    console.log('Calling OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a children\'s story writer.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: Math.floor(targetWords * 1.5),
      temperature: 0.8
    });

    const story = completion.choices[0].message.content;
    const wordCount = story.split(/\s+/).length;

    console.log(`Generated story: ${wordCount} words (target: ${targetWords})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: `${childName}'s ${interests} Adventure`,
        story: story,
        metadata: {
          version: 'v2-simple',
          targetWords,
          actualWords: wordCount,
          accuracy: Math.round((1 - Math.abs(wordCount - targetWords) / targetWords) * 100)
        }
      })
    };

  } catch (error) {
    console.error('Error in generate-story-v2-simple:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Story generation failed',
        message: error.message,
        type: error.constructor.name
      })
    };
  }
}

export default { handler };