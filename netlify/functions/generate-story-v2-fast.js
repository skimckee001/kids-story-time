// Fast single-pass V2 story generation focusing on word count accuracy
const OpenAI = require('openai');

exports.handler = async (event) => {
  console.log('Generate-story-v2-fast function called');
  
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
          error: 'API key not configured'
        })
      };
    }

    // Parse request
    const body = JSON.parse(event.body);
    const { 
      childAge = 8, 
      childName = 'Alex',
      interests = 'adventures',
      storyLength = 'medium',
      themes = [],
      gender = '',
      customPrompt = '',
      includeNameInStory = true
    } = body;

    console.log('Request:', { childAge, childName, interests, storyLength });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    // Exact word targets for each length
    const wordTargets = {
      'short': 350,      // 2-3 minutes
      'medium': 900,     // 5-7 minutes  
      'long': 1400,      // 8-10 minutes
      'extended': 2000   // 12-15 minutes
    };
    
    const targetWords = wordTargets[storyLength] || 900;
    
    // Choose model based on age (simpler approach)
    const model = childAge >= 10 ? 'gpt-4' : 'gpt-3.5-turbo';
    
    // Build the main character description
    const characterDesc = includeNameInStory 
      ? `The main character is ${childName}, a ${childAge}-year-old ${gender || 'child'}`
      : `The main character is a ${childAge}-year-old ${gender || 'child'}`;

    // Combine themes and interests
    const storyTheme = themes.length > 0 ? themes.join(' and ') : interests;
    
    // Create a focused prompt for exact word count
    const prompt = `Write a children's story that is EXACTLY ${targetWords} words long.

${characterDesc}.
Theme: ${storyTheme}
${customPrompt ? `Additional details: ${customPrompt}` : ''}

CRITICAL REQUIREMENTS:
1. The story MUST be EXACTLY ${targetWords} words (count every word!)
2. Age-appropriate for a ${childAge}-year-old reader
3. Clear beginning, middle, and end
4. Engaging and fun to read
5. Include vivid descriptions to reach the word count
6. Add character thoughts, feelings, and dialogue
7. Expand scenes with sensory details

To ensure you reach ${targetWords} words:
- Aim for ${Math.floor(targetWords / 100)} paragraphs of about 100 words each
- Add descriptive language and details
- Include character interactions and dialogue
- DO NOT write a short story and then pad it
- Build a complete narrative that naturally fills ${targetWords} words

Write ONLY the story text. No title, no word count, no notes.`;

    console.log(`Calling ${model} for ${targetWords} word story...`);
    
    // Calculate appropriate max_tokens (words * 1.4 for token estimate)
    const maxTokens = Math.min(4000, Math.floor(targetWords * 1.4));
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: `You are an expert children's story writer who ALWAYS writes stories of the EXACT requested length. You count words carefully as you write.`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8
    });

    const story = completion.choices[0].message.content;
    const wordCount = story.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`Generated story: ${wordCount} words (target: ${targetWords})`);
    
    // Simple title generation based on theme
    const title = includeNameInStory 
      ? `${childName}'s ${storyTheme.split(' ')[0]} Adventure`
      : `The ${storyTheme.split(' ')[0]} Adventure`;

    // Calculate accuracy
    const accuracy = Math.round((1 - Math.abs(wordCount - targetWords) / targetWords) * 100);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: title,
        story: story,
        metadata: {
          version: 'v2-fast',
          model: model,
          targetWords,
          actualWords: wordCount,
          accuracy: accuracy,
          qualityGrade: accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : 'D'
        }
      })
    };

  } catch (error) {
    console.error('Error in generate-story-v2-fast:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Story generation failed',
        message: error.message,
        version: 'v2-fast'
      })
    };
  }
};