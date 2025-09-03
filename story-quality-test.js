// Story Quality Investigation Test
// This script tests the current story generation system to identify quality issues

const testStoryGeneration = async () => {
    console.log('🔍 STORY QUALITY INVESTIGATION');
    console.log('=====================================\n');

    // Test scenarios that parents commonly use
    const testCases = [
        {
            name: 'Young Child - Short Story',
            params: {
                childName: 'Emma',
                childAge: 'pre-reader',
                storyLength: 'short',
                theme: 'animals',
                themes: ['animals'],
                gender: 'girl'
            },
            expectations: {
                minWords: 300,
                maxWords: 450,
                targetWords: 375,
                vocabulary: 'very simple',
                readingTime: '2-3 minutes'
            }
        },
        {
            name: 'Elementary Kid - Medium Story',
            params: {
                childName: 'Alex',
                childAge: 'beginning-reader',
                storyLength: 'medium',
                theme: 'adventure',
                themes: ['adventure'],
                gender: 'boy'
            },
            expectations: {
                minWords: 750,
                maxWords: 1050,
                targetWords: 900,
                vocabulary: 'expanding',
                readingTime: '5-7 minutes'
            }
        },
        {
            name: 'Teen - Extended Story',
            params: {
                childName: 'Maya',
                childAge: 'insightful-reader',
                storyLength: 'extended',
                theme: 'mystery',
                themes: ['mystery', 'coming-of-age'],
                gender: 'girl'
            },
            expectations: {
                minWords: 2500,
                maxWords: 3500,
                targetWords: 3000,
                vocabulary: 'sophisticated',
                readingTime: '20+ minutes'
            }
        }
    ];

    // Analyze current system capabilities
    const results = [];

    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`Parameters:`, testCase.params);
        console.log(`Expected: ${testCase.expectations.targetWords} words`);

        try {
            // Simulate the current system's prompt building
            const prompt = simulateCurrentPrompt(testCase.params);
            const analysis = analyzePromptQuality(prompt, testCase.expectations);
            
            console.log(`📝 Prompt Quality Score: ${analysis.score}/100`);
            console.log(`🎯 Length Control: ${analysis.lengthControl}`);
            console.log(`👶 Age Appropriateness: ${analysis.ageAppropriateness}`);
            console.log(`🎨 Theme Integration: ${analysis.themeIntegration}`);
            
            results.push({
                testCase: testCase.name,
                score: analysis.score,
                issues: analysis.issues,
                improvements: analysis.improvements
            });

        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
        }
    }

    // Overall assessment
    console.log('\n📊 OVERALL ASSESSMENT');
    console.log('====================================');
    
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    console.log(`Average Quality Score: ${averageScore.toFixed(1)}/100`);
    
    // Identify key issues
    const allIssues = results.flatMap(r => r.issues);
    const issueFrequency = {};
    allIssues.forEach(issue => {
        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });

    console.log('\n🚨 Most Common Issues:');
    Object.entries(issueFrequency)
        .sort(([,a], [,b]) => b - a)
        .forEach(([issue, count]) => {
            console.log(`  ${count}x - ${issue}`);
        });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('====================================');
    
    if (averageScore < 60) {
        console.log('🔴 CRITICAL: Story quality needs immediate improvement');
    } else if (averageScore < 80) {
        console.log('🟡 MODERATE: Some quality issues need addressing');
    } else {
        console.log('🟢 GOOD: Story quality is acceptable');
    }

    return results;
};

// Simulate the current prompt building logic
function simulateCurrentPrompt(params) {
    const { childName, childAge, storyLength, themes, gender } = params;
    
    // Current length instructions (from the actual code)
    const lengthInstructions = {
        short: 'Write a short story (300-450 words, 2-3 minutes reading time)',
        medium: 'Write a medium-length story (750-1050 words, 5-7 minutes reading time)', 
        long: 'Write a longer story (1500-2250 words, 10-15 minutes reading time)',
        extended: 'Write an extended story (3000-4000 words, 20+ minutes reading time)'
    };

    const readingLevelGuidelines = {
        'pre-reader': 'Use very simple vocabulary, short sentences (3-5 words), repetitive phrases, focus on basic concepts like colors, shapes, emotions, and simple actions.',
        'beginning-reader': 'Use sight words and simple phonetic words, sentences up to 8-10 words, clear story structure with beginning/middle/end, include basic character emotions and simple conflicts.',
        'insightful-reader': 'Use sophisticated vocabulary, complex narrative structures, deep character psychology, nuanced themes, and thought-provoking concepts that encourage critical thinking.'
    };

    const themeDescription = themes.length === 1 
        ? `a ${themes[0]} story` 
        : `a story combining ${themes.slice(0, -1).join(', ')} and ${themes[themes.length - 1]} themes`;

    return `${lengthInstructions[storyLength] || lengthInstructions.medium}.

Create ${themeDescription} for ${childName}, who is at the ${childAge} reading level.

Reading Level Guidelines: ${readingLevelGuidelines[childAge] || readingLevelGuidelines['beginning-reader']}

Story Requirements:
- Feature ${childName} as the main character
- Include age-appropriate vocabulary and themes for ${childAge} level
- Have a clear beginning, middle, and end
- Include a positive message or lesson
- Be engaging and imaginative
- Safe and appropriate for children
${gender ? `- Use ${gender === 'boy' ? 'he/him' : 'she/her'} pronouns for ${childName}` : ''}`;
}

// Analyze prompt quality for story generation
function analyzePromptQuality(prompt, expectations) {
    let score = 0;
    const issues = [];
    const improvements = [];

    // Length Control Analysis (30 points)
    const hasSpecificWordCount = prompt.includes(`${expectations.targetWords} words`);
    const hasWordRange = prompt.includes(`${expectations.minWords}-${expectations.maxWords}`);
    const hasReadingTime = prompt.includes(expectations.readingTime);

    if (hasSpecificWordCount) {
        score += 30;
    } else if (hasWordRange) {
        score += 20;
        issues.push('No specific target word count');
        improvements.push('Add exact target word count requirement');
    } else if (hasReadingTime) {
        score += 10;
        issues.push('Only reading time specified, no word count');
        improvements.push('Add specific word count targets');
    } else {
        issues.push('No clear length specification');
        improvements.push('Add precise word count requirements');
    }

    // Age Appropriateness Analysis (25 points)
    const vocabularyLevels = {
        'pre-reader': ['very simple', 'basic', '100 words'],
        'beginning-reader': ['sight words', 'simple', '500 words'],
        'insightful-reader': ['sophisticated', 'advanced', 'complex']
    };

    const expectedVocab = vocabularyLevels[expectations.vocabulary] || [];
    const hasAgeAppropriateVocab = expectedVocab.some(term => 
        prompt.toLowerCase().includes(term.toLowerCase())
    );

    if (hasAgeAppropriateVocab) {
        score += 25;
    } else {
        score += 10;
        issues.push('Weak age-appropriate vocabulary guidance');
        improvements.push('Add specific vocabulary complexity requirements');
    }

    // Theme Integration Analysis (20 points)
    const hasThemeGuidance = prompt.includes('theme') || prompt.includes('combining');
    if (hasThemeGuidance) {
        score += 20;
    } else {
        score += 5;
        issues.push('Minimal theme integration guidance');
        improvements.push('Add detailed theme development requirements');
    }

    // Quality Control Analysis (15 points)
    const hasQualityRequirements = prompt.includes('engaging') && prompt.includes('structure');
    if (hasQualityRequirements) {
        score += 15;
    } else {
        score += 5;
        issues.push('Basic quality requirements');
        improvements.push('Add specific quality and structure requirements');
    }

    // Model Selection Analysis (10 points)
    // This would need to be checked against actual model selection logic
    const isComplexStory = expectations.targetWords > 1500;
    const shouldUseGPT4 = isComplexStory;
    
    if (shouldUseGPT4) {
        score += 10;
    } else {
        score += 8;
    }

    return {
        score: Math.min(100, score),
        lengthControl: hasSpecificWordCount ? 'Strong' : hasWordRange ? 'Moderate' : 'Weak',
        ageAppropriateness: hasAgeAppropriateVocab ? 'Good' : 'Needs improvement',
        themeIntegration: hasThemeGuidance ? 'Present' : 'Missing',
        issues,
        improvements
    };
}

// Check current system status
function checkCurrentSystemStatus() {
    console.log('\n🔧 CURRENT SYSTEM STATUS');
    console.log('====================================');
    
    // Model usage analysis
    const gpt4Conditions = "['fluent-reader', 'insightful-reader'].includes(childAge) && ['extended', 'long-extended'].includes(storyLength)";
    console.log(`GPT-4 Usage Conditions: ${gpt4Conditions}`);
    console.log('❌ Issue: GPT-4 only used for extended stories by older kids');
    console.log('💡 Recommendation: Use GPT-4 for all complex age groups');

    // Token limits analysis
    const tokenLimits = {
        short: 600,      // ~450 words
        medium: 1400,    // ~1050 words  
        long: 3000,      // ~2250 words
        extended: 5300   // ~4000 words
    };
    
    console.log('\nToken Limits:');
    Object.entries(tokenLimits).forEach(([length, tokens]) => {
        const estimatedWords = Math.floor(tokens * 0.75);
        console.log(`  ${length}: ${tokens} tokens (~${estimatedWords} words)`);
    });

    // Prompt analysis
    console.log('\n📝 Prompt Quality:');
    console.log('✅ Has age-specific guidelines');
    console.log('✅ Has basic word count ranges');
    console.log('❌ No strict word count enforcement');
    console.log('❌ No quality validation system');
    console.log('❌ No regeneration for poor quality');

    // Image system analysis  
    console.log('\n🎨 Image System:');
    console.log('❌ Basic age-appropriate logic only');
    console.log('❌ No anime/realistic styles for teens');
    console.log('❌ Limited theme-visual matching');
    
    return {
        modelUsage: 'Limited GPT-4 usage',
        tokenLimits: 'Adequate but not optimized',
        promptQuality: 'Basic with major gaps',
        imageSystem: 'Needs complete overhaul'
    };
}

// Run the investigation
async function runInvestigation() {
    console.log('Starting Story Quality Investigation...\n');
    
    const testResults = await testStoryGeneration();
    const systemStatus = checkCurrentSystemStatus();
    
    console.log('\n🎯 FINAL VERDICT');
    console.log('====================================');
    
    const averageScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;
    
    if (averageScore < 60) {
        console.log('🔴 STORY QUALITY: POOR - Immediate action required');
        console.log('Parents are likely experiencing significant quality issues');
    } else if (averageScore < 80) {
        console.log('🟡 STORY QUALITY: MODERATE - Improvements needed');
        console.log('Some parents may be disappointed with story quality');
    } else {
        console.log('🟢 STORY QUALITY: GOOD - Minor optimizations possible');
    }

    console.log('\n📋 PRIORITY ACTIONS:');
    console.log('1. Implement enhanced story generation function');
    console.log('2. Add strict word count validation');
    console.log('3. Upgrade to GPT-4 for complex stories');
    console.log('4. Deploy age-appropriate image styles');
    console.log('5. Add quality scoring and regeneration');

    return {
        overallScore: averageScore,
        testResults,
        systemStatus,
        needsImprovement: averageScore < 80
    };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runInvestigation, testStoryGeneration, checkCurrentSystemStatus };
} else {
    // Browser environment - run investigation
    runInvestigation().then(results => {
        console.log('\n✅ Investigation complete!');
        window.storyQualityResults = results;
    });
}
