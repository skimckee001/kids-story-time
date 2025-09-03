/**
 * Age-Specific Story Prompts
 * Detailed prompts for each age band ensuring appropriate content
 */

export const agePrompts = {
  'pre-reader': {
    vocabulary: {
      description: 'Simple CVC words, repetition for learning',
      examples: ['cat', 'dog', 'run', 'big', 'red', 'happy'],
      avoid: ['complicated', 'mysterious', 'ancient', 'sophisticated'],
      sentenceStructure: 'Subject-verb-object. Max 8 words per sentence.',
      repetition: 'Repeat key phrases 2-3 times for memorization'
    },
    themes: {
      appropriate: [
        'Daily routines (brushing teeth, bedtime)',
        'Colors and shapes',
        'Animal friends',
        'Family love',
        'Simple kindness',
        'Sharing toys',
        'Weather and seasons'
      ],
      avoid: [
        'Death or loss',
        'Complex emotions',
        'Scary situations',
        'Being alone/abandoned',
        'Competition or losing'
      ]
    },
    structure: {
      format: 'Linear story with clear beginning, middle, happy end',
      conflict: 'Very mild (lost toy that is found, friend who shares)',
      resolution: 'Always positive and reassuring',
      length: 'Short attention span - quick progression'
    },
    example: 'The little bear lost his red ball. He looked under the bed. He looked in the toy box. His friend rabbit helped him look. They found the ball in the garden! Bear and rabbit played together. They were very happy.'
  },
  
  'early-reader': {
    vocabulary: {
      description: 'Common sight words, simple phonics patterns',
      examples: ['because', 'together', 'adventure', 'excited', 'careful'],
      avoid: ['philosophical', 'existential', 'metaphorical'],
      sentenceStructure: 'Varied but simple. Max 12 words per sentence.',
      repetition: 'Some repetition for emphasis, not memorization'
    },
    themes: {
      appropriate: [
        'First day of school',
        'Making new friends',
        'Simple adventures',
        'Problem-solving',
        'Imagination games',
        'Helping others',
        'Overcoming small fears'
      ],
      avoid: [
        'Death (except mentioned briefly for pets)',
        'Violence',
        'Complex moral dilemmas',
        'Romance',
        'Scary monsters that don\'t become friendly'
      ]
    },
    structure: {
      format: 'Clear three-act structure',
      conflict: 'Mild challenges (finding a lost pet, solving a puzzle)',
      resolution: 'Positive with simple lesson learned',
      length: 'Can follow longer narrative arc'
    },
    example: 'Emma discovered a secret garden door behind the old oak tree. Inside, colorful flowers danced in the breeze. A wise owl asked her to help find his lost spectacles. Emma searched high and low, finally spotting them on a sleeping turtle! The owl thanked her and taught her the names of all the magical flowers.'
  },
  
  'independent': {
    vocabulary: {
      description: 'Grade-level vocabulary with some challenging words',
      examples: ['mysterious', 'ancient', 'courageous', 'determination', 'discovered'],
      avoid: ['inappropriate slang', 'overly complex technical terms'],
      sentenceStructure: 'Complex sentences allowed. Max 18 words average.',
      repetition: 'Minimal, only for emphasis'
    },
    themes: {
      appropriate: [
        'Mystery solving',
        'Time travel adventures',
        'Friendship challenges',
        'Light fantasy quests',
        'Science experiments',
        'Historical adventures',
        'Environmental awareness',
        'Teamwork and leadership'
      ],
      avoid: [
        'Graphic violence',
        'Romantic relationships',
        'Death as main theme',
        'Adult problems',
        'Hopeless situations'
      ]
    },
    structure: {
      format: 'Can include subplots and multiple characters',
      conflict: 'Real challenges with stakes',
      resolution: 'Earned victory through cleverness/teamwork',
      length: 'Full story arc with character development'
    },
    example: 'The ancient map led Jake and Maya through winding caverns beneath the city. Their flashlights revealed crystalline walls that hummed with mysterious energy. When they reached the central chamber, they discovered the source: a malfunctioning weather machine from a lost civilization. By combining Jake\'s knowledge of mechanics with Maya\'s puzzle-solving skills, they repaired the device, ending the drought that had plagued their town for months.'
  },
  
  'middle-grade': {
    vocabulary: {
      description: 'Rich vocabulary, literary devices, complex ideas',
      examples: ['paradox', 'dystopian', 'allegiance', 'contemplated', 'ramifications'],
      avoid: ['excessive jargon', 'inappropriate content'],
      sentenceStructure: 'Varied and sophisticated. Can use fragments for effect.',
      repetition: 'Only for literary effect'
    },
    themes: {
      appropriate: [
        'Coming of age',
        'Identity and belonging',
        'Ethical dilemmas',
        'Dystopian futures',
        'Complex friendships',
        'Family secrets',
        'Social justice',
        'First crushes (innocent)',
        'Survival stories',
        'Alternate realities'
      ],
      avoid: [
        'Explicit romance',
        'Graphic violence details',
        'Drug/alcohol use',
        'Self-harm',
        'Hopelessness without redemption'
      ]
    },
    structure: {
      format: 'Multiple POV allowed, non-linear timeline possible',
      conflict: 'Complex conflicts with moral ambiguity',
      resolution: 'Can be bittersweet or open-ended',
      length: 'Full narrative with deep character arcs'
    },
    example: 'The Council\'s decision echoed through the underground city. Kira clutched the forbidden book, its pages containing truths about the surface world that contradicted everything she\'d been taught. Her best friend Tam stood with the Enforcers now, his loyalty bought with promises of his sick mother\'s treatment. As sirens wailed, Kira faced an impossible choice: expose the truth and risk her family\'s safety, or remain silent and perpetuate the lies that kept their society in darkness.'
  },
  
  'young-adult': {
    vocabulary: {
      description: 'Sophisticated vocabulary, metaphors, symbolism',
      examples: ['existential', 'dichotomy', 'ephemeral', 'paradigm', 'cathartic'],
      avoid: ['nothing off-limits if age-appropriate context'],
      sentenceStructure: 'Full range of complexity. Stream of consciousness allowed.',
      repetition: 'Advanced literary techniques only'
    },
    themes: {
      appropriate: [
        'Identity and self-discovery',
        'Philosophical questions',
        'Complex relationships',
        'Mental health (sensitively)',
        'Social commentary',
        'Moral ambiguity',
        'Rebellion against systems',
        'Loss and grief',
        'Future careers/dreams',
        'First love (appropriate)',
        'Cultural identity',
        'Environmental collapse'
      ],
      avoid: [
        'Graphic sexual content',
        'Detailed self-harm',
        'Glorifying dangerous behavior',
        'Hopelessness without purpose'
      ]
    },
    structure: {
      format: 'Any narrative structure, unreliable narrators welcome',
      conflict: 'Complex, layered conflicts with no easy answers',
      resolution: 'Can be ambiguous, tragic, or transformative',
      length: 'Full literary complexity'
    },
    example: 'The algorithm had predicted this moment three years ago, down to the autumn leaves scattered across the abandoned train platform where Zoe stood. She\'d spent those years trying to break free from its prophecies, only to realize she\'d been following a script all along. As the train\'s headlight pierced the fog, she wondered if her decision to board was truly hers, or just another calculated probability in the machine\'s grand design. The weight of free will had never felt heavier.'
  }
};

/**
 * Get system prompt for planning phase
 */
export function getPlanPrompt(age, theme, targetWords) {
  const band = getAgeBandFromAge(age);
  const ageConfig = agePrompts[band];
  
  return `You are an expert children's story planner specializing in age-appropriate content.

Age group: ${band} (${age} years old)
Target length: EXACTLY ${targetWords} words (this is critical)
Theme: ${theme}

VOCABULARY REQUIREMENTS:
${ageConfig.vocabulary.description}
Use words like: ${ageConfig.vocabulary.examples.join(', ')}
Avoid words like: ${ageConfig.vocabulary.avoid.join(', ')}

APPROPRIATE THEMES:
Include: ${ageConfig.themes.appropriate.join(', ')}
Never include: ${ageConfig.themes.avoid.join(', ')}

STORY STRUCTURE:
${ageConfig.structure.format}
Conflict type: ${ageConfig.structure.conflict}
Resolution: ${ageConfig.structure.resolution}

Create a detailed story plan that includes:
1. Title (engaging and age-appropriate)
2. One-sentence summary (25 words max)
3. 8-10 story beats (plot points)
4. Character list with traits
5. Vocabulary word bank (20-30 words)
6. Target paragraph count to reach ${targetWords} words

Return as structured JSON. No additional text.`;
}

/**
 * Get system prompt for draft phase
 */
export function getDraftPrompt(plan, age, targetWords) {
  const band = getAgeBandFromAge(age);
  const ageConfig = agePrompts[band];
  
  return `You are an expert children's story writer. Write a story based on this plan.

CRITICAL REQUIREMENT: The story MUST be EXACTLY ${targetWords} words (currently you tend to write too short).

Age group: ${band} (${age} years old)
Sentence structure: ${ageConfig.vocabulary.sentenceStructure}

PLAN TO FOLLOW:
${JSON.stringify(plan, null, 2)}

WRITING RULES:
1. Use ONLY vocabulary appropriate for ${age}-year-olds
2. ${ageConfig.vocabulary.repetition}
3. Make sentences ${ageConfig.vocabulary.sentenceStructure}
4. Include all plot beats from the plan
5. Write ${plan.paragraphCount || 8}-12 paragraphs
6. Each paragraph should be 2-5 sentences
7. MUST reach EXACTLY ${targetWords} words - count as you write

Write ONLY the story text. No titles, no author notes, no word count. Just the story paragraphs separated by blank lines.`;
}

/**
 * Get prompt for length correction
 */
export function getFixLengthPrompt(text, currentWords, targetWords) {
  const difference = targetWords - currentWords;
  const action = difference > 0 ? 'EXPAND' : 'TRIM';
  
  return `${action} this story to EXACTLY ${targetWords} words. Currently ${currentWords} words.

${difference > 0 ? 
  `ADD ${difference} words by:
  - Adding descriptive details
  - Expanding character thoughts
  - Including sensory descriptions
  - Adding a small moment or observation
  Do NOT add new plot points or characters.` :
  `REMOVE ${Math.abs(difference)} words by:
  - Removing redundant adjectives
  - Simplifying sentences
  - Cutting unnecessary details
  - Combining short sentences
  Do NOT remove plot points or character actions.`}

CURRENT STORY:
${text}

Return ONLY the revised story at EXACTLY ${targetWords} words.`;
}

/**
 * Helper function to get age band from numeric age
 */
function getAgeBandFromAge(age) {
  const ageNum = parseInt(age);
  
  if (ageNum <= 4) return 'pre-reader';
  if (ageNum <= 7) return 'early-reader';
  if (ageNum <= 10) return 'independent';
  if (ageNum <= 13) return 'middle-grade';
  return 'young-adult';
}

/**
 * Get safety check prompt
 */
export function getSafetyCheckPrompt(text, age) {
  const band = getAgeBandFromAge(age);
  const ageConfig = agePrompts[band];
  
  return `Review this story for age-appropriateness for a ${age}-year-old.

FORBIDDEN CONTENT for this age:
${ageConfig.themes.avoid.join(', ')}

Check for:
1. Inappropriate themes
2. Too-complex vocabulary  
3. Scary or upsetting content
4. Age-inappropriate situations

STORY:
${text}

Return JSON:
{
  "safe": true/false,
  "issues": ["list", "of", "problems"],
  "suggestions": ["how", "to", "fix"]
}`;
}