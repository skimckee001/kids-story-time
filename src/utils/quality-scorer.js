/**
 * Story Quality Scoring System
 * Comprehensive quality assessment for generated stories
 */

import { storygenConfig, getAgeBand } from '../config/storygen.config.js';

/**
 * Main scoring function
 * Returns score out of 100 with detailed breakdown
 */
export async function scoreStory(story, metadata) {
  const scores = {
    lengthAccuracy: await scoreLengthAccuracy(story, metadata),
    ageAppropriateness: await scoreAgeAppropriateness(story, metadata),
    vocabulary: await scoreVocabulary(story, metadata),
    structure: await scoreStructure(story, metadata),
    engagement: await scoreEngagement(story, metadata),
    theme: await scoreThemeExecution(story, metadata)
  };

  // Weight the scores
  const weights = {
    lengthAccuracy: 20,
    ageAppropriateness: 25,
    vocabulary: 15,
    structure: 15,
    engagement: 10,
    theme: 15
  };

  // Calculate weighted total
  let totalScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    totalScore += (score / 100) * weights[category];
  }

  // Generate recommendations
  const recommendations = generateRecommendations(scores, metadata);

  return {
    totalScore: Math.round(totalScore),
    scores,
    weights,
    recommendations,
    grade: getGrade(totalScore),
    passQuality: totalScore >= storygenConfig.quality.minScore
  };
}

/**
 * Score length accuracy (0-100)
 */
function scoreLengthAccuracy(story, metadata) {
  const { targetWords, actualWords } = metadata;
  if (!targetWords || !actualWords) return 0;

  const difference = Math.abs(actualWords - targetWords);
  const percentDiff = (difference / targetWords) * 100;

  if (percentDiff <= 2) return 100;      // Perfect
  if (percentDiff <= 4) return 95;       // Excellent
  if (percentDiff <= 6) return 85;       // Good (within tolerance)
  if (percentDiff <= 8) return 70;       // Acceptable
  if (percentDiff <= 10) return 50;      // Poor
  if (percentDiff <= 15) return 30;      // Very poor
  return 10;                             // Unacceptable
}

/**
 * Score age appropriateness (0-100)
 */
function scoreAgeAppropriateness(story, metadata) {
  const ageBand = getAgeBand(metadata.age);
  const config = storygenConfig.ageBands[ageBand];
  
  // Calculate readability
  const readability = calculateReadability(story.text || story);
  const targetReadability = config.readingLevel.fleschKincaid;
  
  // Score based on how close to target
  const readabilityDiff = Math.abs(readability.fleschKincaid - targetReadability);
  let readabilityScore = Math.max(0, 100 - readabilityDiff * 2);

  // Check sentence length
  const avgSentenceLength = readability.avgSentenceLength;
  const targetSentLength = config.readingLevel.avgSentenceLength;
  const sentLengthDiff = Math.abs(avgSentenceLength - targetSentLength);
  let sentenceScore = Math.max(0, 100 - sentLengthDiff * 5);

  // Check vocabulary complexity
  const syllablesPerWord = readability.avgSyllablesPerWord;
  const targetSyllables = config.readingLevel.syllablesPerWord;
  const syllableDiff = Math.abs(syllablesPerWord - targetSyllables);
  let syllableScore = Math.max(0, 100 - syllableDiff * 50);

  // Combine scores
  return Math.round((readabilityScore * 0.5 + sentenceScore * 0.25 + syllableScore * 0.25));
}

/**
 * Score vocabulary richness (0-100)
 */
function scoreVocabulary(story, metadata) {
  const text = story.text || story;
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words);
  
  // Type-token ratio (vocabulary diversity)
  const ttr = uniqueWords.size / words.length;
  
  // Expected TTR varies by age
  const ageBand = getAgeBand(metadata.age);
  let expectedTTR;
  
  switch (ageBand) {
    case 'pre-reader':
      expectedTTR = 0.3;  // More repetition
      break;
    case 'early-reader':
      expectedTTR = 0.35;
      break;
    case 'independent':
      expectedTTR = 0.4;
      break;
    case 'middle-grade':
      expectedTTR = 0.45;
      break;
    case 'young-adult':
      expectedTTR = 0.5;  // Most diverse
      break;
    default:
      expectedTTR = 0.4;
  }

  // Score based on how close to expected
  const ttrDiff = Math.abs(ttr - expectedTTR);
  let ttrScore = Math.max(0, 100 - ttrDiff * 200);

  // Check for age-appropriate word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const expectedWordLength = 4 + (metadata.age / 4);  // Grows with age
  const wordLengthDiff = Math.abs(avgWordLength - expectedWordLength);
  let wordLengthScore = Math.max(0, 100 - wordLengthDiff * 20);

  return Math.round((ttrScore * 0.7 + wordLengthScore * 0.3));
}

/**
 * Score story structure (0-100)
 */
function scoreStructure(story, metadata) {
  const text = story.text || story;
  const paragraphs = story.paragraphs || text.split('\n\n').filter(p => p.trim());
  
  let score = 100;

  // Check paragraph count
  const expectedParagraphs = Math.ceil(metadata.targetWords / 120);
  const paragraphDiff = Math.abs(paragraphs.length - expectedParagraphs);
  score -= paragraphDiff * 5;

  // Check paragraph length variation
  const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
  const avgLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;
  const variance = paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / paragraphLengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Good stories have varied paragraph lengths
  if (stdDev < 10) score -= 10;  // Too uniform
  if (stdDev > 50) score -= 10;  // Too varied

  // Check for clear beginning, middle, end
  const hasBeginning = paragraphs[0].length > 50;
  const hasEnd = paragraphs[paragraphs.length - 1].length > 30;
  const hasMiddle = paragraphs.length >= 3;
  
  if (!hasBeginning) score -= 10;
  if (!hasMiddle) score -= 15;
  if (!hasEnd) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Score engagement factors (0-100)
 */
function scoreEngagement(story, metadata) {
  const text = story.text || story;
  let score = 60;  // Base score

  // Check for dialogue
  const hasDialogue = /["'].*["']/.test(text);
  if (hasDialogue) score += 15;

  // Check for sensory details
  const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'touched', 'bright', 'dark', 'loud', 'quiet', 'soft', 'rough', 'sweet', 'sour'];
  const hasSensory = sensoryWords.some(word => text.toLowerCase().includes(word));
  if (hasSensory) score += 10;

  // Check for emotion words
  const emotionWords = ['happy', 'sad', 'excited', 'scared', 'surprised', 'angry', 'worried', 'proud', 'curious', 'confused'];
  const hasEmotion = emotionWords.some(word => text.toLowerCase().includes(word));
  if (hasEmotion) score += 10;

  // Check sentence variety
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const uniqueLengths = new Set(sentenceLengths);
  
  if (uniqueLengths.size > sentences.length * 0.6) score += 5;  // Good variety

  return Math.min(100, score);
}

/**
 * Score theme execution (0-100)
 */
function scoreThemeExecution(story, metadata) {
  const text = story.text || story;
  const theme = metadata.theme || metadata.interests;
  
  if (!theme) return 75;  // Default score if no theme

  let score = 50;  // Base score

  // Check if theme words appear in story
  const themeWords = theme.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  
  let themeMatches = 0;
  for (const word of themeWords) {
    if (textLower.includes(word)) {
      themeMatches++;
    }
  }

  // Score based on theme presence
  score += (themeMatches / themeWords.length) * 30;

  // Check if theme is in title (if available)
  if (story.title) {
    const titleLower = story.title.toLowerCase();
    if (themeWords.some(word => titleLower.includes(word))) {
      score += 10;
    }
  }

  // Check if moral lesson is incorporated (if specified)
  if (metadata.moralLesson) {
    const lessonWords = metadata.moralLesson.toLowerCase().split(/\s+/);
    const lessonMatches = lessonWords.filter(word => textLower.includes(word)).length;
    score += (lessonMatches / lessonWords.length) * 10;
  }

  return Math.min(100, score);
}

/**
 * Calculate readability metrics
 */
function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

  // Flesch-Kincaid Reading Ease
  const fleschKincaid = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Gunning Fog Index (approximation)
  const complexWords = words.filter(word => countSyllables(word) >= 3).length;
  const percentComplex = words.length > 0 ? (complexWords / words.length) * 100 : 0;
  const gunningFog = 0.4 * (avgWordsPerSentence + percentComplex);

  return {
    fleschKincaid: Math.max(0, Math.min(100, fleschKincaid)),
    gunningFog,
    avgSentenceLength: avgWordsPerSentence,
    avgSyllablesPerWord,
    totalWords: words.length,
    totalSentences: sentences.length
  };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e') && count > 1) {
    count--;
  }

  // Ensure at least one syllable
  return Math.max(1, count);
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(scores, metadata) {
  const recommendations = [];

  // Length recommendations
  if (scores.lengthAccuracy < 70) {
    recommendations.push({
      category: 'length',
      severity: 'high',
      message: 'Story length is significantly off target. Implement stricter word count control.',
      action: 'Use length correction prompt to adjust'
    });
  } else if (scores.lengthAccuracy < 85) {
    recommendations.push({
      category: 'length',
      severity: 'medium',
      message: 'Story length could be more accurate.',
      action: 'Fine-tune generation prompts for better length control'
    });
  }

  // Age appropriateness recommendations
  if (scores.ageAppropriateness < 70) {
    recommendations.push({
      category: 'age',
      severity: 'high',
      message: 'Content not well-matched to age group.',
      action: 'Adjust vocabulary and sentence complexity'
    });
  }

  // Vocabulary recommendations
  if (scores.vocabulary < 60) {
    recommendations.push({
      category: 'vocabulary',
      severity: 'medium',
      message: 'Vocabulary diversity needs improvement.',
      action: 'Encourage more varied word choice in prompts'
    });
  }

  // Structure recommendations
  if (scores.structure < 70) {
    recommendations.push({
      category: 'structure',
      severity: 'medium',
      message: 'Story structure could be improved.',
      action: 'Ensure clear beginning, middle, and end'
    });
  }

  // Engagement recommendations
  if (scores.engagement < 60) {
    recommendations.push({
      category: 'engagement',
      severity: 'low',
      message: 'Story could be more engaging.',
      action: 'Add dialogue, sensory details, or emotions'
    });
  }

  // Theme recommendations
  if (scores.theme < 60) {
    recommendations.push({
      category: 'theme',
      severity: 'low',
      message: 'Theme could be better integrated.',
      action: 'Ensure theme is woven throughout the story'
    });
  }

  return recommendations;
}

/**
 * Get letter grade from score
 */
function getGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Quick quality check (for real-time feedback)
 */
export function quickQualityCheck(text, targetWords, age) {
  const actualWords = text.split(/\s+/).filter(w => w.length > 0).length;
  const lengthOk = Math.abs(actualWords - targetWords) / targetWords <= 0.1;
  
  const readability = calculateReadability(text);
  const ageBand = getAgeBand(age);
  const targetReadability = storygenConfig.ageBands[ageBand].readingLevel.fleschKincaid;
  const readabilityOk = Math.abs(readability.fleschKincaid - targetReadability) < 15;

  return {
    pass: lengthOk && readabilityOk,
    actualWords,
    targetWords,
    readability: readability.fleschKincaid,
    targetReadability
  };
}