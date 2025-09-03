// Enhanced Story Generation System for KidsStoryTime.ai
// This module provides age-appropriate, length-accurate story generation

// Word count targets by story length
export const WORD_COUNT_TARGETS = {
  'short': { min: 300, target: 375, max: 450 },      // 2-3 minutes
  'medium': { min: 625, target: 750, max: 875 },     // 5-7 minutes  
  'long': { min: 1250, target: 1500, max: 1750 },    // 10-15 minutes
  'extended': { min: 2000, target: 2500, max: 3000 }, // 20 minutes
  'long-extended': { min: 3000, target: 3750, max: 4500 } // 30 minutes
};

// Enhanced content guidelines by reading level
export const CONTENT_GUIDELINES = {
  'pre-reader': {
    vocabulary: 'very simple',
    sentenceLength: 'short (5-8 words)',
    themes: 'basic concepts, colors, shapes, simple emotions',
    complexity: 'linear stories, single problem, happy endings',
    examples: 'The bunny was sad. Then bunny found a friend. Now bunny is happy!',
    ageRange: '3-6 years',
    defaultImageStyle: 'cartoon'
  },
  'early-phonics': {
    vocabulary: 'simple with some challenging words',
    sentenceLength: 'short to medium (8-12 words)',
    themes: 'friendship, adventure, simple moral lessons',
    complexity: 'clear beginning-middle-end, one subplot allowed',
    examples: 'The brave little mouse ventured into the dark forest to find the magical cheese.',
    ageRange: '4-7 years',
    defaultImageStyle: 'cartoon'
  },
  'beginning-reader': {
    vocabulary: 'grade-appropriate with context clues',
    sentenceLength: 'medium (10-15 words)',
    themes: 'adventure, mystery, friendship challenges, light fantasy',
    complexity: 'multiple characters, basic plot twists, clear resolution',
    examples: 'Detective Sam followed the mysterious footprints through the haunted mansion, heart pounding with excitement.',
    ageRange: '5-8 years',
    defaultImageStyle: 'storybook'
  },
  'developing-reader': {
    vocabulary: 'rich vocabulary with some advanced words',
    sentenceLength: 'varied (10-20 words)',
    themes: 'complex adventures, moral dilemmas, early teen issues',
    complexity: 'multiple plot lines, character development, suspense',
    examples: 'The ancient prophecy spoke of a chosen one, but Maya never imagined it meant her.',
    ageRange: '6-10 years',
    defaultImageStyle: 'watercolor'
  },
  'fluent-reader': {
    vocabulary: 'sophisticated with literary devices',
    sentenceLength: 'complex and varied (15-25 words)',
    themes: 'dystopian, complex fantasy, social issues, identity',
    complexity: 'layered plots, unreliable narrators, open endings possible',
    examples: 'In a world where memories could be traded like currency, Kai discovered the price of forgetting.',
    ageRange: '8-13 years',
    defaultImageStyle: 'realistic'
  },
  'insightful-reader': {
    vocabulary: 'advanced with nuanced meanings',
    sentenceLength: 'literary quality (varied for effect)',
    themes: 'philosophical questions, complex relationships, societal critique',
    complexity: 'multiple perspectives, moral ambiguity, sophisticated themes',
    examples: 'The revolution began not with weapons, but with a single question: What if we chose differently?',
    ageRange: '10-16+ years',
    defaultImageStyle: 'anime'
  }
};

// Generate enhanced story prompt based on parameters
export function generateEnhancedPrompt(params) {
  const {
    childName,
    genderSelection,
    includeNameInStory,
    readingLevel,
    selectedThemes,
    storyLength,
    customPrompt
  } = params;

  const guidelines = CONTENT_GUIDELINES[readingLevel];
  const wordTarget = WORD_COUNT_TARGETS[storyLength];
  
  // Determine pronoun usage
  let pronouns = 'they/them';
  if (genderSelection.boy && !genderSelection.girl) pronouns = 'he/him';
  if (genderSelection.girl && !genderSelection.boy) pronouns = 'she/her';

  // Build the enhanced prompt
  let prompt = `Create a ${wordTarget.target}-word story for a ${guidelines.ageRange} reader.\n\n`;
  
  prompt += `STRICT REQUIREMENTS:\n`;
  prompt += `1. EXACT word count: ${wordTarget.target} words (tolerance: ${wordTarget.min}-${wordTarget.max})\n`;
  prompt += `2. Reading level: ${readingLevel}\n`;
  prompt += `3. Vocabulary: ${guidelines.vocabulary}\n`;
  prompt += `4. Sentence structure: ${guidelines.sentenceLength}\n`;
  prompt += `5. Appropriate themes: ${guidelines.themes}\n`;
  prompt += `6. Story complexity: ${guidelines.complexity}\n\n`;

  if (includeNameInStory && childName) {
    prompt += `MAIN CHARACTER: ${childName} (${pronouns})\n`;
  }

  if (selectedThemes.length > 0) {
    prompt += `THEMES TO INCLUDE: ${selectedThemes.join(', ')}\n`;
  }

  if (customPrompt) {
    prompt += `STORY CONCEPT: ${customPrompt}\n\n`;
  }

  // Add age-specific instructions
  if (['fluent-reader', 'insightful-reader'].includes(readingLevel)) {
    prompt += `IMPORTANT: This story is for an older reader. Include:\n`;
    prompt += `- Sophisticated vocabulary and complex themes\n`;
    prompt += `- Mature storytelling (NOT childish or simplistic)\n`;
    prompt += `- Literary devices like metaphor, foreshadowing, irony\n`;
    prompt += `- Character depth and realistic dialogue\n`;
    prompt += `- Avoid talking animals unless specifically requested\n\n`;
  } else if (['pre-reader', 'early-phonics'].includes(readingLevel)) {
    prompt += `IMPORTANT: This story is for a young child. Include:\n`;
    prompt += `- Very simple language and short sentences\n`;
    prompt += `- Repetition for learning and engagement\n`;
    prompt += `- Clear moral lessons\n`;
    prompt += `- Happy, reassuring endings\n`;
    prompt += `- Gentle conflict resolution\n\n`;
  }

  prompt += `FORMAT:\n`;
  prompt += `- Title: [Creative, age-appropriate title]\n`;
  prompt += `- Story: [Complete story text]\n`;
  prompt += `- Moral: [Brief lesson or takeaway]\n\n`;
  
  prompt += `Example opening for this age group: "${guidelines.examples}"`;

  return prompt;
}

// Validate story length and quality
export function validateStoryOutput(story, targetLength, readingLevel) {
  // Count words
  const wordCount = story.split(/\s+/).length;
  const target = WORD_COUNT_TARGETS[targetLength];
  
  const validation = {
    valid: true,
    wordCount,
    issues: []
  };

  // Check word count
  if (wordCount < target.min) {
    validation.valid = false;
    validation.issues.push(`Too short: ${wordCount} words (need ${target.min}+)`);
  } else if (wordCount > target.max) {
    validation.valid = false;
    validation.issues.push(`Too long: ${wordCount} words (max ${target.max})`);
  }

  // Check age appropriateness for older readers
  if (['fluent-reader', 'insightful-reader'].includes(readingLevel)) {
    const childishIndicators = [
      'little bunny', 'happy ending', 'learned a lesson',
      'and they all', 'once upon a time', 'happily ever after'
    ];
    
    const hasChildishContent = childishIndicators.some(indicator => 
      story.toLowerCase().includes(indicator)
    );
    
    if (hasChildishContent) {
      validation.valid = false;
      validation.issues.push('Content seems too childish for age group');
    }
  }

  return validation;
}

// Get age-appropriate image style
export function getEnhancedImageStyle(readingLevel, selectedThemes = []) {
  const baseStyle = CONTENT_GUIDELINES[readingLevel].defaultImageStyle;
  
  // Theme-based style overrides
  if (selectedThemes.includes('anime') || selectedThemes.includes('manga')) {
    return 'anime';
  }
  if (selectedThemes.includes('dystopian') || selectedThemes.includes('scifi')) {
    return 'realistic';
  }
  if (selectedThemes.includes('fairytale') || selectedThemes.includes('fantasy')) {
    return 'storybook';
  }
  
  // Age-based recommendations
  const styleMap = {
    'pre-reader': 'cartoon',
    'early-phonics': 'cartoon',
    'beginning-reader': 'storybook',
    'developing-reader': 'watercolor',
    'fluent-reader': Math.random() > 0.5 ? 'realistic' : 'anime',
    'insightful-reader': 'anime'
  };
  
  return styleMap[readingLevel] || baseStyle;
}

// Calculate accurate reading time
export function calculateReadingTime(wordCount, readingLevel) {
  // Words per minute by reading level
  const wpmRates = {
    'pre-reader': 100,        // Parent reading aloud
    'early-phonics': 100,     // Parent reading aloud
    'beginning-reader': 120,  // Shared reading
    'developing-reader': 150, // Child reading
    'fluent-reader': 200,     // Fluent child
    'insightful-reader': 250  // Advanced reader
  };
  
  const wpm = wpmRates[readingLevel] || 150;
  const minutes = Math.ceil(wordCount / wpm);
  
  return {
    minutes,
    displayText: minutes === 1 ? '1 minute' : `${minutes} minutes`
  };
}

// Generate quality score for stories
export function scoreStoryQuality(story, params) {
  let score = 100;
  const issues = [];
  
  // Word count accuracy
  const wordCount = story.split(/\s+/).length;
  const target = WORD_COUNT_TARGETS[params.storyLength];
  const accuracy = Math.abs(wordCount - target.target) / target.target;
  
  if (accuracy > 0.2) {
    score -= 20;
    issues.push('Word count significantly off target');
  } else if (accuracy > 0.1) {
    score -= 10;
    issues.push('Word count slightly off target');
  }
  
  // Age appropriateness
  const guidelines = CONTENT_GUIDELINES[params.readingLevel];
  const avgSentenceLength = story.split(/[.!?]/).map(s => 
    s.trim().split(/\s+/).length
  ).reduce((a, b) => a + b, 0) / story.split(/[.!?]/).length;
  
  const expectedLength = parseInt(guidelines.sentenceLength.match(/\d+/g)?.[1] || 15);
  
  if (Math.abs(avgSentenceLength - expectedLength) > 5) {
    score -= 15;
    issues.push('Sentence complexity doesn\'t match reading level');
  }
  
  // Theme inclusion
  if (params.selectedThemes.length > 0) {
    const themesIncluded = params.selectedThemes.filter(theme =>
      story.toLowerCase().includes(theme.toLowerCase())
    ).length;
    
    if (themesIncluded === 0) {
      score -= 15;
      issues.push('Selected themes not incorporated');
    }
  }
  
  // Character name inclusion
  if (params.includeNameInStory && params.childName) {
    const nameCount = (story.match(new RegExp(params.childName, 'gi')) || []).length;
    if (nameCount < 3) {
      score -= 10;
      issues.push('Character name underutilized');
    }
  }
  
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
    issues,
    wordCount,
    avgSentenceLength: Math.round(avgSentenceLength)
  };
}