/**
 * Mock Story Generator for Local Development
 * Generates sample stories without requiring API keys
 */

const storyTemplates = [
  {
    theme: 'adventure',
    templates: [
      "{{name}} discovered a magical map hidden in the attic. The map glowed with golden light and showed a path to a secret treasure. With courage in their heart, {{name}} packed a backpack and set off on an incredible adventure. Along the way, {{name}} met a friendly talking {{animal}} who offered to help. Together, they crossed the sparkling river, climbed the tall mountain, and finally found the treasure chest. Inside wasn't gold, but something even better - a magic compass that would always point toward new adventures!",
      "One sunny morning, {{name}} found a mysterious key in the garden. The key was silver and had strange symbols on it. {{name}} searched everywhere to find what it might open. After looking high and low, {{name}} discovered a hidden door behind the old oak tree. The key fit perfectly! Behind the door was a fantastic world full of flying boats and rainbow bridges. {{name}} spent the whole day exploring this magical place and made friends with the cloud creatures who lived there."
    ]
  },
  {
    theme: 'fairytale',
    templates: [
      "Once upon a time, {{name}} lived in a cozy cottage near an enchanted forest. One day, while picking berries, {{name}} heard a tiny voice calling for help. It was a {{animal}} stuck under a fallen branch! {{name}} quickly helped free the creature. To say thank you, the magical {{animal}} granted {{name}} three wishes. {{name}} wished for happiness for their family, help for all the forest animals, and the ability to understand what animals were saying. From that day on, {{name}} became the guardian of the enchanted forest.",
      "In a kingdom far away, {{name}} discovered they had a special gift - the ability to make flowers bloom with just a touch. The kingdom's gardens had been grey and sad for many years. {{name}} traveled from village to village, bringing color and joy back to the land. The grateful king and queen invited {{name}} to live in the castle and be the Royal Gardener. {{name}} accepted and filled the entire kingdom with the most beautiful flowers anyone had ever seen."
    ]
  },
  {
    theme: 'educational',
    templates: [
      "{{name}} loved learning about space and the stars. One night, {{name}} set up a telescope in the backyard and saw something amazing - Saturn's rings! {{name}} learned that Saturn has over 80 moons and its rings are made of ice and rock. The next day at school, {{name}} shared this exciting discovery with the class. The teacher was so impressed that they made {{name}} the Space Expert of the week. {{name}} continued studying the planets and dreamed of becoming an astronaut one day.",
      "{{name}} was curious about why leaves change color in fall. After reading many books and asking the science teacher, {{name}} learned that leaves are actually always yellow and orange, but the green chlorophyll covers these colors in summer. When autumn comes and trees stop making chlorophyll, the hidden colors appear! {{name}} collected different colored leaves and made a beautiful science project that won first place at the school science fair."
    ]
  },
  {
    theme: 'bedtime',
    templates: [
      "As the stars began to twinkle in the night sky, {{name}} snuggled into bed for a peaceful journey to dreamland. The moonbeam fairy visited {{name}}'s window, sprinkling silver dust that created beautiful dreams. In the dream, {{name}} floated on a soft cloud, visiting the sleepy animals in the forest. The owl hooted a gentle lullaby, the rabbits yawned in their burrows, and even the trees seemed to whisper 'goodnight'. {{name}} smiled, feeling warm and safe, drifting into the sweetest dreams.",
      "{{name}} lay in bed listening to the gentle rain outside. Each raindrop played a soft note on the window, creating a soothing melody. {{name}} imagined each drop was a tiny friend saying goodnight. The teddy bear beside {{name}} seemed extra cuddly tonight, and the nightlight painted gentle shadows that looked like sleeping butterflies on the wall. With a happy sigh, {{name}}'s eyes grew heavy, and soon they were sailing away on a boat made of dreams to the land of peaceful sleep."
    ]
  }
];

const animals = ['rabbit', 'fox', 'owl', 'deer', 'squirrel', 'butterfly', 'cat', 'dog', 'bird', 'turtle'];
const imageStyles = [
  'watercolor painting, soft pastel colors, dreamy atmosphere',
  'vibrant cartoon style, bright colors, cheerful mood',
  'storybook illustration, warm colors, detailed background',
  'digital art, colorful, child-friendly, whimsical'
];

// Mock images - using various placeholder services for better reliability
const mockImages = {
  adventure: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
    'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Adventure+Story',
    'https://via.placeholder.com/800x600/7B68EE/FFFFFF?text=Magical+Journey'
  ],
  fairytale: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=600&fit=crop',
    'https://via.placeholder.com/800x600/FF69B4/FFFFFF?text=Fairy+Tale',
    'https://via.placeholder.com/800x600/DA70D6/FFFFFF?text=Magic+Kingdom'
  ],
  educational: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581078426770-6d336e5de7bf?w=800&h=600&fit=crop',
    'https://via.placeholder.com/800x600/32CD32/FFFFFF?text=Learning+Fun',
    'https://via.placeholder.com/800x600/20B2AA/FFFFFF?text=Educational'
  ],
  bedtime: [
    'https://images.unsplash.com/photo-1489710020360-66e504159b43?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495001258031-d1b407bc1776?w=800&h=600&fit=crop',
    'https://via.placeholder.com/800x600/6495ED/FFFFFF?text=Sweet+Dreams',
    'https://via.placeholder.com/800x600/9370DB/FFFFFF?text=Bedtime+Story'
  ],
  default: [
    'https://via.placeholder.com/800x600/8A2BE2/FFFFFF?text=Story+Image+1',
    'https://via.placeholder.com/800x600/5F9EA0/FFFFFF?text=Story+Image+2',
    'https://via.placeholder.com/800x600/6495ED/FFFFFF?text=Story+Image+3',
    'https://via.placeholder.com/800x600/4682B4/FFFFFF?text=Story+Image+4'
  ]
};

/**
 * Generate a mock story for testing
 */
export function generateMockStory({
  childName = 'Alex',
  themes = ['adventure'],
  gender = 'neutral',
  readingLevel = 'early-phonics',
  storyLength = 'medium'
}) {
  // Select a theme and template
  const theme = themes[0] || 'adventure';
  const themeTemplates = storyTemplates.find(t => t.theme === theme) || storyTemplates[0];
  const template = themeTemplates.templates[Math.floor(Math.random() * themeTemplates.templates.length)];
  
  // Replace placeholders
  const animal = animals[Math.floor(Math.random() * animals.length)];
  let story = template
    .replace(/{{name}}/g, childName)
    .replace(/{{animal}}/g, animal);
  
  // Adjust for reading level
  if (readingLevel === 'pre-reader') {
    // Simplify the story for pre-readers
    story = story
      .replace(/\. [A-Z]/g, (match) => '.\n\n' + match.slice(2))
      .split(' ')
      .map(word => word.length > 6 ? word.slice(0, 6) : word)
      .join(' ');
  }
  
  // Generate mock title
  const titles = [
    `${childName}'s Amazing ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
    `The ${theme.charAt(0).toUpperCase() + theme.slice(1)} of ${childName}`,
    `${childName} and the Magical Day`,
    `A Special Story for ${childName}`
  ];
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  // Generate mock metadata
  const imagePrompt = `${childName} in a ${theme} scene, ${imageStyles[Math.floor(Math.random() * imageStyles.length)]}`;
  
  // Select appropriate mock images based on theme
  const themeImages = mockImages[theme] || mockImages.default;
  const selectedImage = themeImages[Math.floor(Math.random() * themeImages.length)];
  
  // Generate multiple images for the story (3-4 images)
  const numImages = 3 + Math.floor(Math.random() * 2); // 3 or 4 images
  const storyImages = [];
  for (let i = 0; i < numImages; i++) {
    const imageIndex = (Math.floor(Math.random() * themeImages.length) + i) % themeImages.length;
    storyImages.push(themeImages[imageIndex]);
  }
  
  return {
    story: {
      title,
      content: story,
      themes: themes,
      readingLevel,
      metadata: {
        wordCount: story.split(' ').length,
        readingTime: Math.ceil(story.split(' ').length / 200),
        generatedAt: new Date().toISOString(),
        isDemo: true
      }
    },
    imagePrompt,
    imageUrl: selectedImage, // Main image
    images: storyImages, // Multiple images for the story
    success: true,
    message: 'Story generated successfully (mock data for testing)'
  };
}

/**
 * Simulate API delay
 */
export async function generateMockStoryWithDelay(params) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return generateMockStory(params);
}

/**
 * Check if we should use mock generator
 */
export function shouldUseMockGenerator() {
  // Use mock generator if:
  // 1. We're on localhost AND
  // 2. No OpenAI API key is set OR
  // 3. Mock mode is explicitly enabled
  return (
    window.location.hostname === 'localhost' &&
    (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_USE_MOCK_STORIES === 'true')
  );
}

export default {
  generateMockStory,
  generateMockStoryWithDelay,
  shouldUseMockGenerator
};