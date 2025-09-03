/**
 * Story Length Validation and Correction
 * Ensures stories meet exact word count targets
 */

import { storygenConfig } from '../config/storygen.config.js';

/**
 * Validate story length against target
 */
export function validateLength(text, targetWords, tolerance = null) {
  const actualWords = countWords(text);
  const tolerancePercent = tolerance || storygenConfig.tolerance.target;
  
  const minWords = Math.floor(targetWords * (1 - tolerancePercent / 100));
  const maxWords = Math.ceil(targetWords * (1 + tolerancePercent / 100));
  
  const isValid = actualWords >= minWords && actualWords <= maxWords;
  const percentDiff = ((actualWords - targetWords) / targetWords) * 100;
  
  return {
    valid: isValid,
    actualWords,
    targetWords,
    minWords,
    maxWords,
    difference: actualWords - targetWords,
    percentDiff: Math.round(percentDiff * 10) / 10,
    action: actualWords < minWords ? 'expand' : actualWords > maxWords ? 'trim' : 'none'
  };
}

/**
 * Count words accurately
 */
export function countWords(text) {
  if (!text) return 0;
  
  // Remove extra whitespace and count
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Generate correction instructions
 */
export function getCorrectionInstructions(text, validation) {
  const { actualWords, targetWords, action, difference } = validation;
  
  if (action === 'none') {
    return null;
  }
  
  const absDifference = Math.abs(difference);
  const percentChange = Math.abs(validation.percentDiff);
  
  const instructions = {
    action,
    difference: absDifference,
    percentChange,
    techniques: []
  };
  
  if (action === 'expand') {
    instructions.techniques = getExpansionTechniques(text, absDifference);
    instructions.prompt = generateExpansionPrompt(text, targetWords, actualWords);
  } else {
    instructions.techniques = getTrimmingTechniques(text, absDifference);
    instructions.prompt = generateTrimmingPrompt(text, targetWords, actualWords);
  }
  
  return instructions;
}

/**
 * Get expansion techniques based on difference
 */
function getExpansionTechniques(text, wordDifference) {
  const techniques = [];
  
  if (wordDifference <= 50) {
    // Small expansion
    techniques.push({
      method: 'add_descriptions',
      description: 'Add sensory details and descriptions',
      example: 'The cat → The fluffy orange cat with bright green eyes'
    });
    techniques.push({
      method: 'expand_actions',
      description: 'Elaborate on character actions',
      example: 'She walked → She walked slowly, careful not to make a sound'
    });
  } else if (wordDifference <= 150) {
    // Medium expansion
    techniques.push({
      method: 'add_dialogue',
      description: 'Add character dialogue or thoughts',
      example: 'Add: "I wonder what\'s behind that door," she thought.'
    });
    techniques.push({
      method: 'add_minor_scene',
      description: 'Add a small transitional scene',
      example: 'Add a brief moment of reflection or observation'
    });
  } else {
    // Large expansion
    techniques.push({
      method: 'add_subplot',
      description: 'Add a minor subplot or character',
      example: 'Introduce a helpful companion or minor challenge'
    });
    techniques.push({
      method: 'expand_resolution',
      description: 'Elaborate on the story resolution',
      example: 'Add celebration, reflection, or aftermath details'
    });
  }
  
  return techniques;
}

/**
 * Get trimming techniques based on difference
 */
function getTrimmingTechniques(text, wordDifference) {
  const techniques = [];
  
  if (wordDifference <= 50) {
    // Small trim
    techniques.push({
      method: 'remove_adjectives',
      description: 'Remove unnecessary adjectives and adverbs',
      example: 'The very large, old tree → The old tree'
    });
    techniques.push({
      method: 'combine_sentences',
      description: 'Combine short related sentences',
      example: 'He ran. He was fast. → He ran fast.'
    });
  } else if (wordDifference <= 150) {
    // Medium trim
    techniques.push({
      method: 'remove_repetition',
      description: 'Remove repetitive descriptions or actions',
      example: 'Cut repeated explanations or redundant scenes'
    });
    techniques.push({
      method: 'simplify_descriptions',
      description: 'Simplify lengthy descriptions',
      example: 'Long description → Essential details only'
    });
  } else {
    // Large trim
    techniques.push({
      method: 'remove_subplot',
      description: 'Remove minor subplots or tangents',
      example: 'Cut side stories that don\'t affect main plot'
    });
    techniques.push({
      method: 'condense_scenes',
      description: 'Combine or remove entire scenes',
      example: 'Merge similar scenes or cut transitional ones'
    });
  }
  
  return techniques;
}

/**
 * Generate expansion prompt for LLM
 */
function generateExpansionPrompt(text, targetWords, actualWords) {
  const difference = targetWords - actualWords;
  
  return `EXPAND this story to EXACTLY ${targetWords} words (currently ${actualWords} words).
ADD ${difference} words using these techniques:

1. Add sensory details (colors, sounds, textures, smells)
2. Expand character thoughts and feelings
3. Add brief dialogue where appropriate
4. Elaborate on important actions
5. Include environmental descriptions

RULES:
- Do NOT add new plot points or characters
- Do NOT change the story's meaning or ending
- Keep the same paragraph structure
- Maintain age-appropriate language
- Expand evenly throughout, not just at the end

CURRENT STORY:
${text}

Return ONLY the expanded story at EXACTLY ${targetWords} words.`;
}

/**
 * Generate trimming prompt for LLM
 */
function generateTrimmingPrompt(text, targetWords, actualWords) {
  const difference = actualWords - targetWords;
  
  return `TRIM this story to EXACTLY ${targetWords} words (currently ${actualWords} words).
REMOVE ${difference} words using these techniques:

1. Remove unnecessary adjectives and adverbs
2. Simplify verbose phrases
3. Combine related short sentences
4. Cut redundant descriptions
5. Remove filler words (very, really, just, etc.)

RULES:
- Do NOT remove plot points or important actions
- Do NOT change the story's meaning or ending
- Keep all character names and key events
- Maintain story coherence and flow
- Trim evenly throughout, not just from the end

CURRENT STORY:
${text}

Return ONLY the trimmed story at EXACTLY ${targetWords} words.`;
}

/**
 * Analyze paragraph distribution
 */
export function analyzeParagraphDistribution(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const paragraphWords = paragraphs.map(p => countWords(p));
  
  const totalWords = paragraphWords.reduce((sum, w) => sum + w, 0);
  const avgWordsPerParagraph = totalWords / paragraphs.length;
  const minWords = Math.min(...paragraphWords);
  const maxWords = Math.max(...paragraphWords);
  
  // Calculate standard deviation
  const variance = paragraphWords.reduce((sum, w) => {
    return sum + Math.pow(w - avgWordsPerParagraph, 2);
  }, 0) / paragraphs.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    paragraphCount: paragraphs.length,
    totalWords,
    avgWordsPerParagraph: Math.round(avgWordsPerParagraph),
    minWords,
    maxWords,
    stdDev: Math.round(stdDev),
    distribution: paragraphWords,
    balanced: stdDev < avgWordsPerParagraph * 0.3  // Good if variation < 30% of average
  };
}

/**
 * Suggest optimal paragraph count for word target
 */
export function suggestParagraphCount(targetWords, ageGroup) {
  // Base calculation
  let idealWordsPerParagraph;
  
  switch (ageGroup) {
    case 'pre-reader':
      idealWordsPerParagraph = 60;  // Shorter paragraphs
      break;
    case 'early-reader':
      idealWordsPerParagraph = 80;
      break;
    case 'independent':
      idealWordsPerParagraph = 100;
      break;
    case 'middle-grade':
      idealWordsPerParagraph = 120;
      break;
    case 'young-adult':
      idealWordsPerParagraph = 140;  // Longer paragraphs
      break;
    default:
      idealWordsPerParagraph = 100;
  }
  
  const suggestedCount = Math.round(targetWords / idealWordsPerParagraph);
  const minCount = Math.max(3, Math.floor(targetWords / (idealWordsPerParagraph * 1.5)));
  const maxCount = Math.ceil(targetWords / (idealWordsPerParagraph * 0.7));
  
  return {
    suggested: suggestedCount,
    minimum: minCount,
    maximum: maxCount,
    idealWordsPerParagraph
  };
}

/**
 * Validate and fix paragraph structure
 */
export function validateParagraphStructure(text, targetWords, ageGroup) {
  const analysis = analyzeParagraphDistribution(text);
  const suggestion = suggestParagraphCount(targetWords, ageGroup);
  
  const issues = [];
  const fixes = [];
  
  // Check paragraph count
  if (analysis.paragraphCount < suggestion.minimum) {
    issues.push('Too few paragraphs');
    fixes.push('Split longer paragraphs at natural break points');
  } else if (analysis.paragraphCount > suggestion.maximum) {
    issues.push('Too many paragraphs');
    fixes.push('Combine related short paragraphs');
  }
  
  // Check balance
  if (!analysis.balanced) {
    issues.push('Unbalanced paragraph lengths');
    fixes.push('Redistribute content for more even paragraphs');
  }
  
  // Check extremes
  if (analysis.minWords < 20) {
    issues.push('Paragraph too short');
    fixes.push('Expand or merge very short paragraphs');
  }
  
  if (analysis.maxWords > suggestion.idealWordsPerParagraph * 2) {
    issues.push('Paragraph too long');
    fixes.push('Split overly long paragraphs');
  }
  
  return {
    valid: issues.length === 0,
    analysis,
    suggestion,
    issues,
    fixes
  };
}