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

    // Exact word targets for each length (150 words per minute reading speed)
    const wordTargets = {
      'short': 375,      // 2-3 minutes (2.5 min avg)
      'medium': 900,     // 5-7 minutes (6 min avg)
      'long': 1875,      // 10-15 minutes (12.5 min avg)
      'extended': 3000,  // 20-25 minutes (20 min avg)
      'long-extended': 4000,  // 25-30 minutes
      'extra-long': 5250      // 35-40 minutes
    };
    
    const targetWords = wordTargets[storyLength] || 900;
    
    // For now, stick with GPT-3.5-turbo for all stories
    // GPT-4 has lower completion token limits than GPT-3.5
    // For stories over 2500 words, we'll need to adjust expectations
    const model = 'gpt-3.5-turbo';
    
    // Adjust target for very long stories to fit within token limits
    const adjustedTargetWords = targetWords > 2500 ? 2500 : targetWords;
    
    // Build the main character description
    const characterDesc = includeNameInStory 
      ? `The main character is ${childName}, a ${childAge}-year-old ${gender || 'child'}`
      : `The main character is a ${childAge}-year-old ${gender || 'child'}`;

    // Combine themes and interests
    const storyTheme = themes.length > 0 ? themes.join(' and ') : interests;
    
    // Create a focused prompt for exact word count
    const prompt = `You MUST write exactly ${adjustedTargetWords} words. This is CRITICAL.

STORY REQUIREMENTS:
${characterDesc}.
Theme: ${storyTheme}
${customPrompt ? `Additional details: ${customPrompt}` : ''}

LENGTH REQUIREMENT - THIS IS MANDATORY:
Write EXACTLY ${adjustedTargetWords} words. Not approximately, not "about" - EXACTLY ${adjustedTargetWords} words.

For a ${adjustedTargetWords}-word story, you need:
- ${Math.floor(adjustedTargetWords / 100)} paragraphs of approximately 100 words each
- If ${adjustedTargetWords} words feels too long, that's correct - make it that long anyway
- Add detailed descriptions of settings, characters, actions
- Include dialogue and character thoughts
- Expand every scene with sensory details (sights, sounds, smells, feelings)
- Describe character emotions and reactions in detail

IMPORTANT: Most AI models write stories that are TOO SHORT. To combat this:
- After every paragraph, count your words so far
- If you're behind pace, add more detail to the next paragraph
- A ${adjustedTargetWords}-word story should feel substantial and complete
- This is a ${Math.round(adjustedTargetWords/150)}-${Math.round(adjustedTargetWords/100)} minute read-aloud story

Age level: ${childAge} years old
Style: Engaging, descriptive, age-appropriate

Begin the story now and write EXACTLY ${adjustedTargetWords} words:`;

    console.log(`Calling ${model} for ${adjustedTargetWords} word story (requested: ${targetWords})...`);
    
    // Calculate appropriate max_tokens 
    // Use 1.5x multiplier for safety (accounts for variations in tokenization)
    // Cap at 4096 for GPT-3.5-turbo model limit
    const maxTokens = Math.min(4096, Math.floor(adjustedTargetWords * 1.5));
    
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