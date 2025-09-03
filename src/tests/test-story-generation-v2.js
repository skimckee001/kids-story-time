/**
 * Test Story Generation v2
 * Validates the enhanced story generation system
 */

import { storygenConfig, getAgeBand } from '../config/storygen.config.js';
import { scoreStory } from '../utils/quality-scorer.js';
import { validateLength } from '../utils/length-validator.js';

/**
 * Test configuration for different scenarios
 */
const testScenarios = [
  {
    name: 'Pre-reader Short Story',
    params: {
      childAge: 4,
      childName: 'Emma',
      interests: 'puppies and rainbows',
      storyLength: 'short',
      gender: 'girl',
      useV2: true
    },
    expectations: {
      targetWords: 350,
      minQuality: 75,
      ageBand: 'pre-reader'
    }
  },
  {
    name: 'Early Reader Medium Story',
    params: {
      childAge: 6,
      childName: 'Lucas',
      interests: 'dinosaurs and space',
      storyLength: 'medium',
      gender: 'boy',
      useV2: true
    },
    expectations: {
      targetWords: 900,
      minQuality: 75,
      ageBand: 'early-reader'
    }
  },
  {
    name: 'Independent Reader Long Story',
    params: {
      childAge: 9,
      childName: 'Sofia',
      interests: 'mystery and adventure',
      storyLength: 'long',
      gender: 'girl',
      moralLesson: 'teamwork makes the dream work',
      useV2: true
    },
    expectations: {
      targetWords: 1400,
      minQuality: 80,
      ageBand: 'independent'
    }
  },
  {
    name: 'Middle Grade Extended Story',
    params: {
      childAge: 12,
      childName: 'Alex',
      interests: 'dystopian future and robots',
      storyLength: 'extended',
      gender: 'non-binary',
      additionalCharacters: 'best friend named Jordan',
      useV2: true
    },
    expectations: {
      targetWords: 2000,
      minQuality: 85,
      ageBand: 'middle-grade'
    }
  },
  {
    name: 'Young Adult Complex Story',
    params: {
      childAge: 15,
      childName: 'Maya',
      interests: 'identity and philosophy',
      storyLength: 'extended',
      gender: 'girl',
      moralLesson: 'questioning authority',
      useV2: true
    },
    expectations: {
      targetWords: 2000,
      minQuality: 90,
      ageBand: 'young-adult'
    }
  }
];

/**
 * Run a single test scenario
 */
async function runTestScenario(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${scenario.name}`);
  console.log('='.repeat(60));
  
  const results = {
    scenario: scenario.name,
    passed: true,
    errors: [],
    warnings: [],
    metrics: {}
  };
  
  try {
    // Call the API (or mock it for testing)
    const startTime = Date.now();
    const response = await callGenerateStoryV2(scenario.params);
    const generationTime = Date.now() - startTime;
    
    results.metrics.generationTime = generationTime;
    
    // Validate response structure
    if (!response.story || !response.title) {
      results.errors.push('Missing story or title in response');
      results.passed = false;
    }
    
    // Test 1: Length Validation
    console.log('\n📏 Testing Length Control...');
    const lengthValidation = validateLength(
      response.story,
      scenario.expectations.targetWords
    );
    
    results.metrics.wordCount = lengthValidation.actualWords;
    results.metrics.targetWords = lengthValidation.targetWords;
    results.metrics.lengthAccuracy = 100 - Math.abs(lengthValidation.percentDiff);
    
    if (!lengthValidation.valid) {
      results.errors.push(
        `Length validation failed: ${lengthValidation.actualWords} words ` +
        `(target: ${lengthValidation.targetWords}, diff: ${lengthValidation.percentDiff}%)`
      );
      results.passed = false;
    } else {
      console.log(`✅ Length OK: ${lengthValidation.actualWords} words (${lengthValidation.percentDiff}% diff)`);
    }
    
    // Test 2: Quality Scoring
    console.log('\n⭐ Testing Quality Score...');
    const qualityScore = await scoreStory(response.story, {
      age: scenario.params.childAge,
      targetWords: scenario.expectations.targetWords,
      actualWords: lengthValidation.actualWords,
      theme: scenario.params.interests,
      moralLesson: scenario.params.moralLesson
    });
    
    results.metrics.qualityScore = qualityScore.totalScore;
    results.metrics.qualityBreakdown = qualityScore.scores;
    results.metrics.grade = qualityScore.grade;
    
    if (qualityScore.totalScore < scenario.expectations.minQuality) {
      results.errors.push(
        `Quality score too low: ${qualityScore.totalScore}/100 ` +
        `(minimum: ${scenario.expectations.minQuality})`
      );
      results.passed = false;
    } else {
      console.log(`✅ Quality OK: ${qualityScore.totalScore}/100 (Grade: ${qualityScore.grade})`);
    }
    
    // Test 3: Age Appropriateness
    console.log('\n👶 Testing Age Appropriateness...');
    const ageBand = getAgeBand(scenario.params.childAge);
    
    if (ageBand !== scenario.expectations.ageBand) {
      results.errors.push(
        `Age band mismatch: got ${ageBand}, expected ${scenario.expectations.ageBand}`
      );
      results.passed = false;
    } else {
      console.log(`✅ Age band correct: ${ageBand}`);
    }
    
    // Test 4: Content Safety
    console.log('\n🛡️ Testing Content Safety...');
    const safetyCheck = checkContentSafety(response.story, scenario.params.childAge);
    
    if (!safetyCheck.safe) {
      results.errors.push(`Content safety issues: ${safetyCheck.issues.join(', ')}`);
      results.passed = false;
    } else {
      console.log('✅ Content safety check passed');
    }
    
    // Test 5: Performance
    if (generationTime > 30000) {
      results.warnings.push(`Slow generation: ${generationTime}ms`);
    }
    
    // Print quality breakdown
    console.log('\n📊 Quality Breakdown:');
    for (const [category, score] of Object.entries(qualityScore.scores)) {
      const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      console.log(`  ${emoji} ${category}: ${Math.round(score)}/100`);
    }
    
    // Print recommendations
    if (qualityScore.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      qualityScore.recommendations.forEach(rec => {
        console.log(`  - [${rec.severity}] ${rec.message}`);
      });
    }
    
  } catch (error) {
    results.errors.push(`Test failed with error: ${error.message}`);
    results.passed = false;
    console.error('❌ Test error:', error);
  }
  
  // Final result
  console.log(`\n${results.passed ? '✅ PASSED' : '❌ FAILED'}: ${scenario.name}`);
  
  return results;
}

/**
 * Mock API call (replace with actual API call)
 */
async function callGenerateStoryV2(params) {
  // For testing, return a mock response
  // In production, this would call the actual API
  
  const mockStories = {
    'short': generateMockStory(350),
    'medium': generateMockStory(900),
    'long': generateMockStory(1400),
    'extended': generateMockStory(2000)
  };
  
  return {
    title: `${params.childName}'s ${params.interests} Adventure`,
    story: mockStories[params.storyLength],
    metadata: {
      version: 'v2',
      ageBand: getAgeBand(params.childAge),
      qualityScore: 85
    }
  };
}

/**
 * Generate mock story of specific length
 */
function generateMockStory(targetWords) {
  const sentences = [
    'Once upon a time, in a magical land far away, there lived a brave young hero.',
    'Every day brought new adventures and exciting discoveries to explore.',
    'The hero faced many challenges but never gave up on their dreams.',
    'Friends joined the journey, each bringing unique skills and perspectives.',
    'Together they solved puzzles and overcame obstacles with creativity.',
    'The wise mentor appeared at just the right moment with helpful advice.',
    'A mysterious map revealed the location of the hidden treasure.',
    'The journey through the enchanted forest was full of wonder.',
    'Strange creatures appeared, some friendly and some not so much.',
    'The team worked together using each person\'s special talents.',
    'At the climax, they faced their biggest challenge yet.',
    'With courage and determination, they found a clever solution.',
    'The adventure taught them valuable lessons about friendship.',
    'They returned home with treasure and memories to last a lifetime.',
    'The end of this journey was just the beginning of the next.'
  ];
  
  let story = '';
  let wordCount = 0;
  let paragraphs = [];
  let currentParagraph = '';
  
  while (wordCount < targetWords) {
    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    const sentenceWords = sentence.split(' ').length;
    
    if (wordCount + sentenceWords <= targetWords * 1.05) {
      currentParagraph += sentence + ' ';
      wordCount += sentenceWords;
      
      // Create new paragraph every 80-120 words
      if (currentParagraph.split(' ').length > 80 && wordCount < targetWords - 50) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    } else {
      break;
    }
  }
  
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }
  
  return paragraphs.join('\n\n');
}

/**
 * Basic content safety check
 */
function checkContentSafety(story, age) {
  const ageBand = getAgeBand(age);
  const safetyConfig = storygenConfig.safety[ageBand];
  
  const issues = [];
  const storyLower = story.toLowerCase();
  
  for (const word of safetyConfig.forbidden) {
    if (storyLower.includes(word)) {
      issues.push(`Forbidden word: ${word}`);
    }
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * Run all test scenarios
 */
export async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 STORY GENERATION V2 TEST SUITE');
  console.log('='.repeat(60));
  
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const scenario of testScenarios) {
    const result = await runTestScenario(scenario);
    results.push(result);
    
    if (result.passed) {
      totalPassed++;
    } else {
      totalFailed++;
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${totalPassed}/${testScenarios.length}`);
  console.log(`❌ Failed: ${totalFailed}/${testScenarios.length}`);
  
  // Print failed tests
  if (totalFailed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.scenario}`);
      r.errors.forEach(e => console.log(`    • ${e}`));
    });
  }
  
  // Print warnings
  const warnings = results.flatMap(r => r.warnings);
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  // Print average metrics
  console.log('\n📊 Average Metrics:');
  const avgQuality = results.reduce((sum, r) => sum + (r.metrics.qualityScore || 0), 0) / results.length;
  const avgAccuracy = results.reduce((sum, r) => sum + (r.metrics.lengthAccuracy || 0), 0) / results.length;
  
  console.log(`  Quality Score: ${Math.round(avgQuality)}/100`);
  console.log(`  Length Accuracy: ${Math.round(avgAccuracy)}%`);
  
  return {
    passed: totalFailed === 0,
    results,
    summary: {
      totalPassed,
      totalFailed,
      avgQuality,
      avgAccuracy
    }
  };
}

// Export for use in other modules
export { testScenarios, runTestScenario };