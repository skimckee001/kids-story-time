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
    const prompt = `CRITICAL INSTRUCTION: Write a story that is EXACTLY ${adjustedTargetWords} words long. Not shorter, not longer - EXACTLY ${adjustedTargetWords} words.

STORY REQUIREMENTS:
${characterDesc}.
Theme: ${storyTheme}
${customPrompt ? `Additional details: ${customPrompt}` : ''}

WORD COUNT ENFORCEMENT:
• TARGET: ${adjustedTargetWords} words EXACTLY
• Write ${Math.floor(adjustedTargetWords / 100)} paragraphs of ~100 words each
• After EVERY paragraph, mentally count your total words
• If you're at paragraph 5 of 20, you should have ~500 words
• DO NOT STOP until you reach ${adjustedTargetWords} words
• DO NOT GO OVER ${adjustedTargetWords} words

TECHNIQUES TO REACH ${adjustedTargetWords} WORDS:
• Describe settings in rich detail (colors, textures, sounds, smells)
• Show character emotions through actions and internal thoughts
• Include meaningful dialogue between characters
• Add sensory descriptions to every scene
• Expand action sequences with step-by-step detail
• Describe character appearances and mannerisms
• Include atmospheric details (weather, time of day, ambient sounds)

PACING GUIDE:
• Opening (${Math.floor(adjustedTargetWords * 0.15)} words): Set the scene, introduce character
• Rising action (${Math.floor(adjustedTargetWords * 0.35)} words): Build the adventure/conflict
• Climax (${Math.floor(adjustedTargetWords * 0.30)} words): Peak excitement/challenge
• Resolution (${Math.floor(adjustedTargetWords * 0.20)} words): Solve problem, conclude story

Reading level: ${childAge}
Style: Engaging, descriptive, age-appropriate

NOW WRITE EXACTLY ${adjustedTargetWords} WORDS:`;

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
          content: `You are an expert children's story writer. Your MOST IMPORTANT SKILL is writing stories of EXACTLY the requested word count. You NEVER write shorter stories. If asked for 1875 words, you write EXACTLY 1875 words - not 1500, not 1600, but EXACTLY 1875. You count words meticulously as you write and always hit the exact target.`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7  // Lower temperature for more consistent output
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