/**
 * Story Generation Configuration
 * Controls quality, length, and age-appropriateness settings
 */

export const storygenConfig = {
  // Feature flag for v2 generation system
  version: process.env.VITE_STORYGEN_VERSION || "v1",
  v2Enabled: process.env.VITE_STORYGEN_V2_ENABLED === 'true' || false,
  
  // Exact word count targets (no more ranges!)
  lengths: {
    short: {
      words: 350,
      readTime: '2-3 min',
      description: 'Quick bedtime story',
      tokens: 470  // Approximate tokens for API limits
    },
    medium: {
      words: 900,
      readTime: '5-7 min',
      description: 'Standard story length',
      tokens: 1200
    },
    long: {
      words: 1400,
      readTime: '8-10 min',
      description: 'Detailed adventure',
      tokens: 1900
    },
    extended: {
      words: 2000,
      readTime: '12-15 min',
      description: 'Chapter-length story',
      tokens: 2700
    }
  },
  
  // Word count tolerance percentage
  tolerance: {
    target: 6,    // ±6% is acceptable
    max: 10       // ±10% absolute maximum
  },
  
  // Age bands with model assignments
  ageBands: {
    'pre-reader': {
      ages: '3-4',
      minAge: 3,
      maxAge: 4,
      model: {
        plan: 'gpt-3.5-turbo',
        draft: 'gpt-4o-mini',
        fix: 'gpt-3.5-turbo'
      },
      readingLevel: {
        fleschKincaid: 90,  // Very easy
        avgSentenceLength: 8,
        syllablesPerWord: 1.2
      }
    },
    'early-reader': {
      ages: '5-7',
      minAge: 5,
      maxAge: 7,
      model: {
        plan: 'gpt-3.5-turbo',
        draft: 'gpt-4o-mini',
        fix: 'gpt-3.5-turbo'
      },
      readingLevel: {
        fleschKincaid: 80,  // Easy
        avgSentenceLength: 12,
        syllablesPerWord: 1.3
      }
    },
    'independent': {
      ages: '8-10',
      minAge: 8,
      maxAge: 10,
      model: {
        plan: 'gpt-4o-mini',
        draft: 'gpt-4o',
        fix: 'gpt-4o-mini'
      },
      readingLevel: {
        fleschKincaid: 70,  // Fairly easy
        avgSentenceLength: 15,
        syllablesPerWord: 1.5
      }
    },
    'middle-grade': {
      ages: '11-13',
      minAge: 11,
      maxAge: 13,
      model: {
        plan: 'gpt-4o',
        draft: 'gpt-4o',
        fix: 'gpt-4o-mini'
      },
      readingLevel: {
        fleschKincaid: 60,  // Standard
        avgSentenceLength: 18,
        syllablesPerWord: 1.7
      }
    },
    'young-adult': {
      ages: '14-16',
      minAge: 14,
      maxAge: 16,
      model: {
        plan: 'gpt-4o',
        draft: 'gpt-4o',
        fix: 'gpt-4o-mini'
      },
      readingLevel: {
        fleschKincaid: 50,  // Fairly difficult
        avgSentenceLength: 22,
        syllablesPerWord: 1.9
      }
    }
  },
  
  // Visual styles by age group
  visualStyles: {
    'pre-reader': {
      default: 'watercolor',
      options: ['watercolor', 'pastel', 'cartoon', 'soft-illustration']
    },
    'early-reader': {
      default: 'storybook',
      options: ['storybook', 'watercolor', 'bright-cartoon', 'whimsical']
    },
    'independent': {
      default: 'adventure-illustration',
      options: ['adventure-illustration', 'comic-book', 'storybook', 'fantasy-art']
    },
    'middle-grade': {
      default: 'cinematic',
      options: ['cinematic', 'semi-realistic', 'fantasy-art', 'graphic-novel']
    },
    'young-adult': {
      default: 'anime',
      options: ['anime', 'graphic-novel', 'realistic', 'cinematic', 'dark-fantasy']
    }
  },
  
  // Themes by age group
  themes: {
    'pre-reader': [
      'animals', 'colors', 'family', 'friendship', 'bedtime',
      'seasons', 'helping', 'sharing', 'feelings'
    ],
    'early-reader': [
      'adventure', 'friendship', 'school', 'pets', 'nature',
      'problem-solving', 'imagination', 'fairytales', 'dinosaurs'
    ],
    'independent': [
      'mystery', 'adventure', 'fantasy', 'science', 'sports',
      'friendship', 'courage', 'teamwork', 'discovery'
    ],
    'middle-grade': [
      'coming-of-age', 'identity', 'ethics', 'dystopia', 'mystery',
      'sci-fi', 'historical', 'mythology', 'survival'
    ],
    'young-adult': [
      'identity', 'philosophy', 'dystopia', 'romance', 'society',
      'rebellion', 'ethics', 'future', 'psychology', 'existential'
    ]
  },
  
  // Quality thresholds
  quality: {
    minScore: 75,           // Minimum acceptable quality score
    targetScore: 95,        // Target quality score
    autoRegenerateBelow: 70, // Auto-regenerate if below this
    maxRegenerations: 2     // Maximum regeneration attempts
  },
  
  // API settings
  api: {
    temperature: {
      plan: 0.7,      // More creative for planning
      draft: 0.8,     // Balanced creativity for writing
      fix: 0.3        // Low creativity for fixes
    },
    maxTokens: {
      plan: 500,
      draft: 3000,
      fix: 1000
    },
    timeout: {
      plan: 10000,    // 10 seconds
      draft: 30000,   // 30 seconds
      fix: 10000      // 10 seconds
    }
  },
  
  // Cost tracking (in cents)
  costs: {
    'gpt-3.5-turbo': {
      input: 0.0005,   // per 1K tokens
      output: 0.0015   // per 1K tokens
    },
    'gpt-4o-mini': {
      input: 0.015,
      output: 0.06
    },
    'gpt-4o': {
      input: 0.05,
      output: 0.15
    }
  },
  
  // Content safety filters
  safety: {
    'pre-reader': {
      forbidden: ['death', 'violence', 'scary', 'monster', 'blood', 'hurt'],
      warnings: ['dark', 'alone', 'lost', 'cry']
    },
    'early-reader': {
      forbidden: ['death', 'violence', 'blood', 'weapon', 'kill'],
      warnings: ['scary', 'monster', 'fight', 'angry']
    },
    'independent': {
      forbidden: ['graphic violence', 'death detail', 'romance', 'drugs'],
      warnings: ['violence', 'scary', 'death mention']
    },
    'middle-grade': {
      forbidden: ['graphic content', 'explicit romance', 'drugs', 'self-harm'],
      warnings: ['violence', 'death', 'mild romance']
    },
    'young-adult': {
      forbidden: ['explicit content', 'graphic violence', 'self-harm detail'],
      warnings: ['violence', 'death', 'romance', 'mature themes']
    }
  }
};

/**
 * Helper function to get age band from numeric age
 */
export function getAgeBand(age) {
  const ageNum = parseInt(age);
  
  for (const [band, config] of Object.entries(storygenConfig.ageBands)) {
    if (ageNum >= config.minAge && ageNum <= config.maxAge) {
      return band;
    }
  }
  
  // Default to early-reader if age not found
  return 'early-reader';
}

/**
 * Helper function to get model for specific age and task
 */
export function getModel(age, task = 'draft') {
  const band = getAgeBand(age);
  return storygenConfig.ageBands[band].model[task];
}

/**
 * Helper function to get visual style options for age
 */
export function getVisualStyles(age) {
  const band = getAgeBand(age);
  return storygenConfig.visualStyles[band];
}

/**
 * Helper function to get appropriate themes for age
 */
export function getThemes(age) {
  const band = getAgeBand(age);
  return storygenConfig.themes[band];
}

/**
 * Calculate estimated cost for a story
 */
export function estimateCost(age, length) {
  const band = getAgeBand(age);
  const models = storygenConfig.ageBands[band].model;
  const tokens = storygenConfig.lengths[length].tokens;
  
  // Rough estimation (plan: 300 tokens, fix: 200 tokens average)
  const planCost = (300 * storygenConfig.costs[models.plan].input + 
                    300 * storygenConfig.costs[models.plan].output) / 1000;
  
  const draftCost = (tokens * storygenConfig.costs[models.draft].input + 
                     tokens * storygenConfig.costs[models.draft].output) / 1000;
  
  const fixCost = (200 * storygenConfig.costs[models.fix].input + 
                   200 * storygenConfig.costs[models.fix].output) / 1000;
  
  return {
    cents: Math.round((planCost + draftCost + fixCost) * 100),
    breakdown: {
      plan: Math.round(planCost * 100),
      draft: Math.round(draftCost * 100),
      fix: Math.round(fixCost * 100)
    }
  };
}