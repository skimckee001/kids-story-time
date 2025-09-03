// Enhanced Image Style System for Age-Appropriate Visuals
// Provides sophisticated visual styles that match story content and age groups

export const ENHANCED_IMAGE_STYLES = {
  // Styles for younger children (3-8 years)
  'bright-cartoon': {
    id: 'bright-cartoon',
    name: 'Bright Cartoon',
    description: 'Colorful, friendly cartoon style perfect for young children',
    ageGroups: ['pre-reader', 'early-phonics', 'beginning-reader'],
    prompt: 'bright colorful cartoon illustration, simple clean shapes, child-friendly characters, vibrant saturated colors, Disney Pixar style, cheerful atmosphere, soft rounded edges, no scary elements',
    examples: 'Like Bluey, Peppa Pig, or Disney Junior shows',
    themes: ['animals', 'family', 'friendship', 'playground', 'colors']
  },

  // Classic children's book style
  'illustrated-classic': {
    id: 'illustrated-classic',
    name: 'Classic Illustration',
    description: 'Traditional children\'s book illustrations with warm, inviting details',
    ageGroups: ['beginning-reader', 'developing-reader'],
    prompt: 'classic children\'s book illustration, detailed watercolor style, warm inviting colors, storybook aesthetic, reminiscent of classic fairy tales, rich textures, beautiful lighting',
    examples: 'Like Harry Potter illustrations, Roald Dahl books, or Where the Wild Things Are',
    themes: ['adventure', 'fantasy', 'magic', 'mystery', 'friendship']
  },

  // Anime/manga style for older kids
  'anime-adventure': {
    id: 'anime-adventure',
    name: 'Anime Adventure',
    description: 'Dynamic anime-style illustrations with detailed characters and environments',
    ageGroups: ['fluent-reader', 'insightful-reader'],
    prompt: 'high-quality anime illustration, detailed character designs, dynamic poses, vibrant colors with sophisticated shading, Studio Ghibli quality, detailed backgrounds, expressive characters, adventure aesthetic',
    examples: 'Like My Hero Academia, Avatar: The Last Airbender, or Studio Ghibli films',
    themes: ['adventure', 'sci-fi', 'fantasy', 'mystery', 'coming-of-age']
  },

  // Realistic fantasy art
  'fantasy-realistic': {
    id: 'fantasy-realistic',
    name: 'Fantasy Realistic',
    description: 'Detailed fantasy art with realistic elements and epic scope',
    ageGroups: ['developing-reader', 'fluent-reader', 'insightful-reader'],
    prompt: 'high-quality fantasy art illustration, semi-realistic style, detailed environments, dramatic lighting, epic scope, rich colors, detailed character designs, professional concept art quality',
    examples: 'Like Lord of the Rings concept art, D&D illustrations, or video game concept art',
    themes: ['fantasy', 'adventure', 'mystery', 'epic-quests', 'magic']
  },

  // Sci-fi futuristic style
  'sci-fi-modern': {
    id: 'sci-fi-modern',
    name: 'Sci-Fi Modern',
    description: 'Sleek, futuristic illustrations with advanced technology and space themes',
    ageGroups: ['fluent-reader', 'insightful-reader'],
    prompt: 'modern sci-fi illustration, sleek futuristic designs, advanced technology, space themes, cool blue and purple color palette, detailed mechanical elements, cyberpunk aesthetic, high-tech environments',
    examples: 'Like Marvel sci-fi art, Guardians of the Galaxy, or futuristic concept art',
    themes: ['sci-fi', 'space', 'technology', 'future', 'adventure']
  },

  // Minimalist style for thoughtful stories
  'minimalist-thoughtful': {
    id: 'minimalist-thoughtful',
    name: 'Minimalist Thoughtful',
    description: 'Clean, minimalist illustrations that focus on emotion and meaning',
    ageGroups: ['insightful-reader'],
    prompt: 'minimalist illustration, clean simple designs, focus on emotion and mood, muted sophisticated colors, symbolic elements, thoughtful composition, modern artistic style',
    examples: 'Like indie graphic novels, modern literary illustrations, or introspective art',
    themes: ['identity', 'relationships', 'growth', 'introspection', 'ethics']
  },

  // Dark fantasy for mature themes
  'dark-fantasy': {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    description: 'Sophisticated dark fantasy with mature themes (age-appropriate)',
    ageGroups: ['insightful-reader'],
    prompt: 'dark fantasy illustration, sophisticated gothic elements, dramatic shadows, rich deep colors, mysterious atmosphere, detailed environments, mature artistic style, age-appropriate darkness',
    examples: 'Like Tim Burton aesthetic, gothic literature art, or sophisticated dark fantasy',
    themes: ['mystery', 'gothic', 'supernatural', 'complex-emotions', 'dystopian']
  }
};

// Age-specific style recommendations
export const AGE_STYLE_MAPPING = {
  'pre-reader': {
    primary: ['bright-cartoon'],
    secondary: ['illustrated-classic'],
    avoid: ['dark-fantasy', 'minimalist-thoughtful']
  },
  'early-phonics': {
    primary: ['bright-cartoon', 'illustrated-classic'],
    secondary: [],
    avoid: ['dark-fantasy', 'minimalist-thoughtful', 'sci-fi-modern']
  },
  'beginning-reader': {
    primary: ['illustrated-classic', 'bright-cartoon'],
    secondary: ['fantasy-realistic'],
    avoid: ['dark-fantasy', 'minimalist-thoughtful']
  },
  'developing-reader': {
    primary: ['illustrated-classic', 'fantasy-realistic'],
    secondary: ['anime-adventure'],
    avoid: ['dark-fantasy']
  },
  'fluent-reader': {
    primary: ['anime-adventure', 'fantasy-realistic', 'sci-fi-modern'],
    secondary: ['illustrated-classic'],
    avoid: ['bright-cartoon']
  },
  'insightful-reader': {
    primary: ['anime-adventure', 'fantasy-realistic', 'sci-fi-modern', 'minimalist-thoughtful'],
    secondary: ['dark-fantasy'],
    avoid: ['bright-cartoon']
  }
};

// Theme-specific style recommendations
export const THEME_STYLE_MAPPING = {
  'animals': ['bright-cartoon', 'illustrated-classic'],
  'family': ['bright-cartoon', 'illustrated-classic'],
  'friendship': ['bright-cartoon', 'illustrated-classic', 'anime-adventure'],
  'adventure': ['illustrated-classic', 'anime-adventure', 'fantasy-realistic'],
  'mystery': ['illustrated-classic', 'anime-adventure', 'dark-fantasy'],
  'fantasy': ['illustrated-classic', 'fantasy-realistic', 'anime-adventure'],
  'sci-fi': ['sci-fi-modern', 'anime-adventure'],
  'space': ['sci-fi-modern', 'anime-adventure'],
  'identity': ['minimalist-thoughtful', 'anime-adventure'],
  'coming-of-age': ['anime-adventure', 'minimalist-thoughtful'],
  'dystopian': ['sci-fi-modern', 'dark-fantasy', 'minimalist-thoughtful'],
  'supernatural': ['dark-fantasy', 'fantasy-realistic'],
  'ethics': ['minimalist-thoughtful', 'anime-adventure']
};

// Function to get optimal image style based on age and theme
export function getOptimalImageStyle(age, themes = [], userSelectedStyle = null) {
  // If user specifically selected a style, validate it's appropriate
  if (userSelectedStyle && userSelectedStyle !== 'age-appropriate') {
    const style = ENHANCED_IMAGE_STYLES[userSelectedStyle];
    if (style && style.ageGroups.includes(age)) {
      return {
        styleId: userSelectedStyle,
        prompt: style.prompt,
        reasoning: `User selected ${style.name}`
      };
    }
  }

  // Auto-select based on age and themes
  const ageMapping = AGE_STYLE_MAPPING[age];
  if (!ageMapping) {
    return getDefaultStyle(age);
  }

  // Find styles that match both age and themes
  let matchingStyles = ageMapping.primary;
  
  if (themes.length > 0) {
    const themeStyles = themes.flatMap(theme => THEME_STYLE_MAPPING[theme] || []);
    matchingStyles = ageMapping.primary.filter(styleId => 
      themeStyles.includes(styleId)
    );
    
    // If no perfect match, use age-appropriate styles
    if (matchingStyles.length === 0) {
      matchingStyles = ageMapping.primary;
    }
  }

  // Select the best matching style
  const selectedStyleId = matchingStyles[0];
  const selectedStyle = ENHANCED_IMAGE_STYLES[selectedStyleId];

  return {
    styleId: selectedStyleId,
    prompt: selectedStyle.prompt,
    reasoning: `Optimal for ${age} with themes: ${themes.join(', ')}`
  };
}

// Get all available styles for a specific age group
export function getAvailableStylesForAge(age) {
  return Object.values(ENHANCED_IMAGE_STYLES).filter(style => 
    style.ageGroups.includes(age)
  );
}

// Enhanced prompt building for images
export function buildEnhancedImagePrompt(basePrompt, style, storyContext = {}) {
  const { title, themes = [], characters = [], setting = '' } = storyContext;
  
  let enhancedPrompt = style.prompt;
  
  // Add story-specific elements
  if (title) {
    enhancedPrompt += `, inspired by "${title}"`;
  }
  
  if (characters.length > 0) {
    enhancedPrompt += `, featuring ${characters.join(' and ')}`;
  }
  
  if (setting) {
    enhancedPrompt += `, set in ${setting}`;
  }
  
  if (themes.length > 0) {
    enhancedPrompt += `, incorporating ${themes.join(' and ')} elements`;
  }
  
  // Add quality and safety modifiers
  enhancedPrompt += ', high quality digital art, professional illustration, safe for children, positive mood';
  
  return enhancedPrompt;
}

// Default fallback styles
function getDefaultStyle(age) {
  const defaults = {
    'pre-reader': 'bright-cartoon',
    'early-phonics': 'bright-cartoon',
    'beginning-reader': 'illustrated-classic',
    'developing-reader': 'illustrated-classic',
    'fluent-reader': 'anime-adventure',
    'insightful-reader': 'anime-adventure'
  };
  
  const styleId = defaults[age] || 'illustrated-classic';
  const style = ENHANCED_IMAGE_STYLES[styleId];
  
  return {
    styleId,
    prompt: style.prompt,
    reasoning: `Default for ${age}`
  };
}

// Validation function to ensure style is age-appropriate
export function validateStyleForAge(styleId, age) {
  const style = ENHANCED_IMAGE_STYLES[styleId];
  if (!style) return false;
  
  return style.ageGroups.includes(age);
}

// Get style recommendations with explanations
export function getStyleRecommendations(age, themes = []) {
  const ageMapping = AGE_STYLE_MAPPING[age];
  if (!ageMapping) return [];
  
  const recommendations = [];
  
  // Primary recommendations
  ageMapping.primary.forEach(styleId => {
    const style = ENHANCED_IMAGE_STYLES[styleId];
    const isThemeMatch = themes.some(theme => 
      THEME_STYLE_MAPPING[theme]?.includes(styleId)
    );
    
    recommendations.push({
      ...style,
      priority: 'primary',
      themeMatch: isThemeMatch,
      explanation: `Perfect for ${age} readers${isThemeMatch ? ' and matches your themes' : ''}`
    });
  });
  
  // Secondary recommendations
  ageMapping.secondary.forEach(styleId => {
    const style = ENHANCED_IMAGE_STYLES[styleId];
    recommendations.push({
      ...style,
      priority: 'secondary',
      themeMatch: false,
      explanation: `Alternative style for ${age} readers`
    });
  });
  
  return recommendations;
}
