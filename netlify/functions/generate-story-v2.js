import OpenAI from 'openai';

// Inline config and prompts for Netlify function
// (Netlify functions can't import from src directory)

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Story generation configuration
const storygenConfig = {
  v2Enabled: process.env.VITE_STORYGEN_V2_ENABLED === 'true' || process.env.VITE_STORYGEN_V2_ENABLED === 'TRUE',
  
  lengths: {
    short: { words: 350 },
    medium: { words: 900 },
    long: { words: 1400 },
    extended: { words: 2000 }
  },
  
  tolerance: {
    target: 6,
    max: 10
  },
  
  ageBands: {
    'pre-reader': {
      ages: '3-4',
      minAge: 3,
      maxAge: 4,
      model: {
        plan: 'gpt-3.5-turbo',
        draft: 'gpt-3.5-turbo',
        fix: 'gpt-3.5-turbo'
      }
    },
    'early-reader': {
      ages: '5-7',
      minAge: 5,
      maxAge: 7,
      model: {
        plan: 'gpt-3.5-turbo',
        draft: 'gpt-4',
        fix: 'gpt-3.5-turbo'
      }
    },
    'independent': {
      ages: '8-10',
      minAge: 8,
      maxAge: 10,
      model: {
        plan: 'gpt-4',
        draft: 'gpt-4',
        fix: 'gpt-3.5-turbo'
      }
    },
    'middle-grade': {
      ages: '11-13',
      minAge: 11,
      maxAge: 13,
      model: {
        plan: 'gpt-4',
        draft: 'gpt-4',
        fix: 'gpt-4'
      }
    },
    'young-adult': {
      ages: '14-16',
      minAge: 14,
      maxAge: 16,
      model: {
        plan: 'gpt-4',
        draft: 'gpt-4',
        fix: 'gpt-4'
      }
    }
  },
  
  quality: {
    minScore: 75,
    autoRegenerateBelow: 70,
    maxRegenerations: 2
  },
  
  api: {
    temperature: {
      plan: 0.7,
      draft: 0.8,
      fix: 0.3
    },
    maxTokens: {
      plan: 500,
      draft: 3000,
      fix: 1000
    }
  },
  
  safety: {
    'pre-reader': {
      forbidden: ['death', 'violence', 'scary', 'monster', 'blood'],
      warnings: ['dark', 'alone', 'lost']
    },
    'early-reader': {
      forbidden: ['death', 'violence', 'blood', 'weapon'],
      warnings: ['scary', 'monster', 'fight']
    },
    'independent': {
      forbidden: ['graphic violence', 'death detail', 'romance'],
      warnings: ['violence', 'scary']
    },
    'middle-grade': {
      forbidden: ['graphic content', 'explicit romance', 'drugs'],
      warnings: ['violence', 'death']
    },
    'young-adult': {
      forbidden: ['explicit content', 'graphic violence'],
      warnings: ['violence', 'mature themes']
    }
  }
};

// Helper function to get age band
function getAgeBand(age) {
  const ageNum = parseInt(age);
  
  for (const [band, config] of Object.entries(storygenConfig.ageBands)) {
    if (ageNum >= config.minAge && ageNum <= config.maxAge) {
      return band;
    }
  }
  
  return 'early-reader';
}

// Helper function to get model for age and task
function getModel(age, task = 'draft') {
  const band = getAgeBand(age);
  return storygenConfig.ageBands[band].model[task];
}

// Generate planning prompt
function getPlanPrompt(age, theme, targetWords) {
  const band = getAgeBand(age);
  
  const ageGuidance = {
    'pre-reader': 'Simple words, repetition, daily routines, colors, animals',
    'early-reader': 'Basic adventures, friendship, simple problem-solving',
    'independent': 'Mystery, teamwork, light fantasy, science',
    'middle-grade': 'Coming-of-age, identity, ethics, dystopia',
    'young-adult': 'Complex relationships, philosophy, social commentary'
  };
  
  return `Create a children's story plan for a ${age}-year-old.
Theme: ${theme}
Target: EXACTLY ${targetWords} words

Requirements for ${band}:
- Content: ${ageGuidance[band]}
- Vocabulary: Age-appropriate
- Structure: Clear beginning, middle, end

Return JSON with:
1. title
2. summary (25 words max)
3. beats (8-10 plot points)
4. characters (with traits)
5. paragraphCount (to reach ${targetWords} words)`;
}

// Generate draft prompt
function getDraftPrompt(plan, age, targetWords) {
  const band = getAgeBand(age);
  
  return `Write a ${targetWords}-word story based on this plan:
${JSON.stringify(plan, null, 2)}

Age: ${age} (${band})

CRITICAL: Must be EXACTLY ${targetWords} words.
- Use age-appropriate vocabulary
- Write ${plan.paragraphCount || 8} paragraphs
- Each paragraph 2-5 sentences
- Include all plot beats

Write ONLY the story text, no titles or notes.`;
}

// Generate fix length prompt
function getFixLengthPrompt(text, currentWords, targetWords) {
  const action = currentWords > targetWords ? 'TRIM' : 'EXPAND';
  const difference = Math.abs(targetWords - currentWords);
  
  return `${action} this story to EXACTLY ${targetWords} words (currently ${currentWords}).
${action === 'TRIM' ? 'Remove' : 'Add'} ${difference} words.
Keep the same plot and meaning.
Return ONLY the adjusted story.

Story:
${text}`;
}

/**
 * Enhanced Story Generation v2
 * Two-pass generation with quality control
 */
export async function handler(event) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { 
      childAge, 
      interests, 
      storyLength = 'medium',
      gender,
      childName,
      additionalCharacters = '',
      moralLesson = '',
      useV2 = false  // Feature flag check
    } = JSON.parse(event.body);

    // Check if V2 is enabled
    if (!useV2 && !storygenConfig.v2Enabled) {
      // Fall back to v1 behavior
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          error: 'V2 not enabled. Use legacy endpoint.',
          v2Enabled: false 
        }),
      };
    }

    console.log('Starting V2 story generation:', {
      age: childAge,
      length: storyLength,
      interests
    });

    // Get configuration for this age
    const ageBand = getAgeBand(childAge);
    const targetWords = storygenConfig.lengths[storyLength].words;
    const tolerance = storygenConfig.tolerance.target;

    // Track metrics
    const metrics = {
      startTime: Date.now(),
      regenerations: 0,
      modelsUsed: [],
      costs: []
    };

    // Step 1: Generate Story Plan (Cheap Model)
    console.log('Step 1: Generating story plan...');
    const planModel = getModel(childAge, 'plan');
    metrics.modelsUsed.push(planModel);
    
    const planPrompt = getPlanPrompt(childAge, interests, targetWords);
    const planResponse = await openai.chat.completions.create({
      model: planModel,
      messages: [
        { role: 'system', content: 'You are an expert children\'s story planner.' },
        { role: 'user', content: planPrompt }
      ],
      temperature: storygenConfig.api.temperature.plan,
      max_tokens: storygenConfig.api.maxTokens.plan,
    });

    let plan;
    try {
      plan = JSON.parse(planResponse.choices[0].message.content);
    } catch (e) {
      // If JSON parsing fails, create a basic plan
      console.error('Plan parsing failed, using fallback');
      plan = {
        title: `${childName}'s ${interests} Adventure`,
        summary: `A story about ${interests}`,
        beats: Array(8).fill('Story beat'),
        characters: [{ name: childName, traits: ['brave', 'kind'] }],
        vocabulary: [],
        paragraphCount: Math.ceil(targetWords / 100)
      };
    }

    // Step 2: Generate Draft (Quality Model)
    console.log('Step 2: Generating story draft...');
    const draftModel = getModel(childAge, 'draft');
    metrics.modelsUsed.push(draftModel);
    
    const draftPrompt = getDraftPrompt(plan, childAge, targetWords);
    const draftResponse = await openai.chat.completions.create({
      model: draftModel,
      messages: [
        { role: 'system', content: 'You are an expert children\'s story writer.' },
        { role: 'user', content: draftPrompt }
      ],
      temperature: storygenConfig.api.temperature.draft,
      max_tokens: storygenConfig.api.maxTokens.draft,
    });

    let storyText = draftResponse.choices[0].message.content;
    let wordCount = countWords(storyText);

    console.log(`Draft complete: ${wordCount} words (target: ${targetWords})`);

    // Step 3: Validate and Fix Length
    const minWords = targetWords * (1 - tolerance/100);
    const maxWords = targetWords * (1 + tolerance/100);

    if (wordCount < minWords || wordCount > maxWords) {
      console.log('Step 3: Adjusting story length...');
      const fixModel = getModel(childAge, 'fix');
      metrics.modelsUsed.push(fixModel);
      
      const fixPrompt = getFixLengthPrompt(storyText, wordCount, targetWords);
      const fixResponse = await openai.chat.completions.create({
        model: fixModel,
        messages: [
          { role: 'system', content: 'You are a precise editor.' },
          { role: 'user', content: fixPrompt }
        ],
        temperature: storygenConfig.api.temperature.fix,
        max_tokens: storygenConfig.api.maxTokens.fix,
      });

      storyText = fixResponse.choices[0].message.content;
      wordCount = countWords(storyText);
      metrics.regenerations++;
    }

    // Step 4: Quality Scoring
    console.log('Step 4: Scoring story quality...');
    const qualityScore = await scoreStoryQuality(storyText, {
      age: childAge,
      targetWords,
      actualWords: wordCount
    });

    // Step 5: Auto-regenerate if quality is too low
    if (qualityScore.totalScore < storygenConfig.quality.autoRegenerateBelow && 
        metrics.regenerations < storygenConfig.quality.maxRegenerations) {
      console.log('Quality too low, regenerating...');
      // Recursive call with adjusted parameters
      return handler({
        ...event,
        body: JSON.stringify({
          ...JSON.parse(event.body),
          _regeneration: true,
          _previousScore: qualityScore.totalScore
        })
      });
    }

    // Step 6: Safety Check
    console.log('Step 6: Running safety check...');
    const safetyCheck = await checkContentSafety(storyText, childAge);
    
    if (!safetyCheck.safe) {
      console.error('Safety check failed:', safetyCheck.issues);
      // Try to fix or regenerate
      if (metrics.regenerations < storygenConfig.quality.maxRegenerations) {
        return handler({
          ...event,
          body: JSON.stringify({
            ...JSON.parse(event.body),
            _regeneration: true,
            _safetyIssues: safetyCheck.issues
          })
        });
      }
    }

    // Calculate costs
    const estimatedCost = calculateCost(metrics.modelsUsed);
    
    // Prepare final response
    const response = {
      title: plan.title || `${childName}'s ${interests} Adventure`,
      story: storyText,
      paragraphs: storyText.split('\n\n').filter(p => p.trim()),
      metadata: {
        version: 'v2',
        ageBand,
        targetWords,
        actualWords: wordCount,
        accuracy: Math.round((1 - Math.abs(wordCount - targetWords) / targetWords) * 100),
        qualityScore: qualityScore.totalScore,
        qualityBreakdown: qualityScore.breakdown,
        safetyCheck: safetyCheck.safe,
        generationTime: Date.now() - metrics.startTime,
        regenerations: metrics.regenerations,
        estimatedCostCents: estimatedCost,
        models: metrics.modelsUsed
      }
    };

    console.log('Story generation complete:', {
      words: wordCount,
      quality: qualityScore.totalScore,
      time: response.metadata.generationTime
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Story generation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate story',
        details: error.message,
        version: 'v2'
      }),
    };
  }
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Score story quality
 */
async function scoreStoryQuality(text, metadata) {
  const scores = {
    lengthAccuracy: 0,
    readability: 0,
    vocabulary: 0,
    structure: 0,
    engagement: 0
  };

  // Length accuracy (0-20 points)
  const lengthDiff = Math.abs(metadata.actualWords - metadata.targetWords);
  const lengthAccuracy = Math.max(0, 1 - (lengthDiff / metadata.targetWords));
  scores.lengthAccuracy = lengthAccuracy * 20;

  // Readability (0-25 points)
  const readability = calculateFleschKincaid(text);
  const ageBand = getAgeBand(metadata.age);
  const targetReadability = storygenConfig.ageBands[ageBand].readingLevel.fleschKincaid;
  const readabilityDiff = Math.abs(readability - targetReadability);
  scores.readability = Math.max(0, 25 - (readabilityDiff / 2));

  // Vocabulary richness (0-20 points)
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/));
  const vocabRichness = uniqueWords.size / metadata.actualWords;
  scores.vocabulary = Math.min(20, vocabRichness * 40);

  // Structure (0-20 points)
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const avgParagraphLength = metadata.actualWords / paragraphs.length;
  const idealParagraphLength = 100;
  const structureScore = Math.max(0, 1 - Math.abs(avgParagraphLength - idealParagraphLength) / idealParagraphLength);
  scores.structure = structureScore * 20;

  // Engagement (0-15 points)
  const hasDialogue = text.includes('"') || text.includes("'");
  const hasVariedSentences = checkSentenceVariation(text);
  scores.engagement = (hasDialogue ? 8 : 0) + (hasVariedSentences ? 7 : 0);

  // Total score
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    totalScore: Math.round(totalScore),
    breakdown: scores
  };
}

/**
 * Calculate Flesch-Kincaid readability
 */
function calculateFleschKincaid(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 100;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word) {
  word = word.toLowerCase();
  let count = 0;
  const vowels = 'aeiouy';
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }

  // Ensure at least one syllable
  return Math.max(1, count);
}

/**
 * Check sentence length variation
 */
function checkSentenceVariation(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length < 3) return false;

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

  // Good variation if standard deviation is > 3 words
  return Math.sqrt(variance) > 3;
}

/**
 * Check content safety
 */
async function checkContentSafety(text, age) {
  const ageBand = getAgeBand(age);
  const safetyConfig = storygenConfig.safety[ageBand];
  
  const issues = [];
  
  // Check for forbidden words
  const textLower = text.toLowerCase();
  for (const word of safetyConfig.forbidden) {
    if (textLower.includes(word)) {
      issues.push(`Contains forbidden word: ${word}`);
    }
  }
  
  // Check for warning words (less severe)
  const warnings = [];
  for (const word of safetyConfig.warnings) {
    if (textLower.includes(word)) {
      warnings.push(`Contains warning word: ${word}`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Calculate estimated cost
 */
function calculateCost(modelsUsed) {
  // Rough estimation based on average token usage
  let totalCents = 0;
  
  for (const model of modelsUsed) {
    if (storygenConfig.costs[model]) {
      // Estimate 500 input tokens, 1000 output tokens per call
      const inputCost = (500 * storygenConfig.costs[model].input) / 1000;
      const outputCost = (1000 * storygenConfig.costs[model].output) / 1000;
      totalCents += (inputCost + outputCost);
    }
  }
  
  return Math.round(totalCents * 100); // Convert to cents
}

export default { handler };