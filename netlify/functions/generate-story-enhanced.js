// Enhanced Netlify function for story generation with quality control
// File: netlify/functions/generate-story-enhanced.js

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const params = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'OpenAI API key not configured' })
            };
        }

        // Generate enhanced story with quality control
        const result = await generateEnhancedStory(params, apiKey);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                story: result.story,
                metadata: {
                    ...result.story.metadata,
                    qualityScore: result.quality,
                    generationAttempts: result.attempts,
                    model: result.model,
                    enhancedVersion: true
                }
            })
        };

    } catch (error) {
        console.error('Enhanced story generation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Story generation failed',
                message: error.message
            })
        };
    }
};

// Enhanced story generation with quality control
async function generateEnhancedStory(params, apiKey) {
    const model = selectOptimalModel(params.childAge);
    const contentSpec = getContentSpecification(params.childAge);
    const lengthSpec = getLengthSpecification(params.storyLength);
    
    let attempts = 0;
    let bestStory = null;
    let bestQuality = 0;
    
    while (attempts < 3) {
        attempts++;
        
        try {
            const prompt = buildAdvancedPrompt(params, contentSpec, lengthSpec, attempts);
            const story = await callOpenAI(model, prompt, lengthSpec.tokenLimit, apiKey);
            
            const qualityScore = calculateQualityScore(story, params, lengthSpec);
            
            if (qualityScore > bestQuality) {
                bestStory = story;
                bestQuality = qualityScore;
            }
            
            // If we got a high-quality story, use it
            if (qualityScore >= 85) {
                break;
            }
            
        } catch (error) {
            console.error(`Attempt ${attempts} failed:`, error);
            if (attempts === 3) throw error;
        }
    }
    
    return {
        story: bestStory,
        quality: bestQuality,
        attempts,
        model
    };
}

// Model selection based on age/complexity
function selectOptimalModel(childAge) {
    const modelMap = {
        'pre-reader': 'gpt-3.5-turbo',
        'early-phonics': 'gpt-3.5-turbo', 
        'beginning-reader': 'gpt-4-turbo-preview',
        'developing-reader': 'gpt-4-turbo-preview',
        'fluent-reader': 'gpt-4-turbo-preview',
        'insightful-reader': 'gpt-4-turbo-preview'
    };
    
    return modelMap[childAge] || 'gpt-3.5-turbo';
}

// Enhanced content specifications
function getContentSpecification(childAge) {
    const specs = {
        'pre-reader': {
            vocabulary: 'very simple, max 100 unique words',
            sentenceLength: '3-5 words per sentence',
            concepts: 'basic colors, shapes, emotions, simple actions',
            themes: 'family, animals, friendship, sharing',
            conflicts: 'very mild problems with simple solutions',
            tone: 'cheerful, repetitive, interactive',
            literaryDevices: 'repetition, rhyme, sound effects'
        },
        'early-phonics': {
            vocabulary: 'simple phonetic words, sight words, 300 word limit',
            sentenceLength: '5-8 words per sentence',
            concepts: 'cause and effect, basic emotions, familiar settings',
            themes: 'school, playground, pets, simple adventures',
            conflicts: 'minor challenges, lost toys, making friends',
            tone: 'encouraging, gentle humor',
            literaryDevices: 'simple dialogue, basic descriptive words'
        },
        'beginning-reader': {
            vocabulary: 'expanding vocabulary with context clues, 500 words',
            sentenceLength: '8-12 words per sentence',
            concepts: 'character emotions, simple cause-effect chains',
            themes: 'friendship challenges, basic mystery, mild adventure',
            conflicts: 'social problems, simple moral choices',
            tone: 'engaging, mild suspense, positive resolution',
            literaryDevices: 'character development, simple plot structure'
        },
        'developing-reader': {
            vocabulary: 'varied vocabulary, some challenging words, 800 words',
            sentenceLength: '10-15 words per sentence',
            concepts: 'character growth, multiple perspectives, problem-solving',
            themes: 'courage, teamwork, overcoming fears, discovery',
            conflicts: 'moderate challenges, peer pressure, ethical choices',
            tone: 'inspiring, moderate tension, character growth',
            literaryDevices: 'metaphors, character arcs, subplot development'
        },
        'fluent-reader': {
            vocabulary: 'rich descriptive language, advanced vocabulary, 1200 words',
            sentenceLength: 'varied sentence structures, complex sentences',
            concepts: 'identity, belonging, achievement, relationships',
            themes: 'coming-of-age, mystery, fantasy adventure, sci-fi',
            conflicts: 'internal struggles, moral dilemmas, complex challenges',
            tone: 'sophisticated, layered emotions, meaningful themes',
            literaryDevices: 'foreshadowing, symbolism, multiple plot threads'
        },
        'insightful-reader': {
            vocabulary: 'sophisticated vocabulary, literary language, 1500+ words',
            sentenceLength: 'complex, varied structures with literary flair',
            concepts: 'psychological depth, abstract thinking, philosophical questions',
            themes: 'identity crisis, dystopian futures, complex relationships, ethics',
            conflicts: 'moral ambiguity, societal issues, internal transformation',
            tone: 'thought-provoking, nuanced, intellectually engaging',
            literaryDevices: 'unreliable narrator, irony, complex symbolism, allegory'
        }
    };
    
    return specs[childAge] || specs['beginning-reader'];
}

// Precise length specifications
function getLengthSpecification(storyLength) {
    const specs = {
        'short': {
            minWords: 300,
            maxWords: 450,
            targetWords: 375,
            readingTime: '2-3 minutes',
            tokenLimit: 700,
            paragraphs: '4-6 paragraphs'
        },
        'medium': {
            minWords: 750,
            maxWords: 1050,
            targetWords: 900,
            readingTime: '5-7 minutes',
            tokenLimit: 1500,
            paragraphs: '8-12 paragraphs'
        },
        'long': {
            minWords: 1500,
            maxWords: 2250,
            targetWords: 1875,
            readingTime: '10-15 minutes',
            tokenLimit: 3200,
            paragraphs: '15-20 paragraphs'
        },
        'extended': {
            minWords: 2500,
            maxWords: 3500,
            targetWords: 3000,
            readingTime: '20-25 minutes',
            tokenLimit: 4500,
            paragraphs: '20-25 paragraphs'
        },
        'long-extended': {
            minWords: 3500,
            maxWords: 4500,
            targetWords: 4000,
            readingTime: '30-35 minutes',
            tokenLimit: 5500,
            paragraphs: '25-30 paragraphs'
        },
        'extra-long': {
            minWords: 4500,
            maxWords: 6000,
            targetWords: 5250,
            readingTime: '40-45 minutes',
            tokenLimit: 7000,
            paragraphs: '30-35 paragraphs'
        }
    };
    
    return specs[storyLength] || specs['medium'];
}

// Advanced prompt building
function buildAdvancedPrompt(params, contentSpec, lengthSpec, attempt) {
    const { childName, childAge, themes, gender, customPrompt, includeNameInStory } = params;
    
    const characterName = includeNameInStory ? childName : getContextualCharacterName(gender, childAge);
    const themeDescription = themes && themes.length > 0 ? themes.join(' and ') : 'adventure';
    
    // Add attempt-specific improvements
    let attemptModifiers = '';
    if (attempt === 2) {
        attemptModifiers = `\n\nIMPORTANT: The previous attempt may have been too short or too simple. Please ensure you write a full ${lengthSpec.targetWords}-word story with rich detail and proper pacing.`;
    } else if (attempt === 3) {
        attemptModifiers = `\n\nCRITICAL: This is the final attempt. You MUST write exactly ${lengthSpec.targetWords} words. Count carefully and include sufficient detail, dialogue, and description to reach this target.`;
    }
    
    return `You are a master storyteller specializing in ${getReadingLevelDisplay(childAge)} content. You must create an engaging, age-appropriate story that perfectly matches the specified requirements.

STORY SPECIFICATIONS:
- Target Length: EXACTLY ${lengthSpec.targetWords} words (Range: ${lengthSpec.minWords}-${lengthSpec.maxWords})
- Reading Time: ${lengthSpec.readingTime}
- Structure: ${lengthSpec.paragraphs}
- Character: ${characterName}
- Theme: ${themeDescription}
- Reading Level: ${childAge}

CONTENT GUIDELINES for ${getReadingLevelDisplay(childAge)}:
- Vocabulary: ${contentSpec.vocabulary}
- Sentence Structure: ${contentSpec.sentenceLength}
- Themes: ${contentSpec.themes}
- Conflict Level: ${contentSpec.conflicts}
- Tone: ${contentSpec.tone}
- Literary Devices: ${contentSpec.literaryDevices}

QUALITY REQUIREMENTS:
1. Compelling opening that immediately engages the reader
2. Clear character development and growth for ${characterName}
3. Age-appropriate challenges that create genuine tension
4. Rich sensory details and vivid descriptions
5. Meaningful dialogue that advances the story
6. Satisfying resolution with a positive message
7. Proper story structure: setup, rising action, climax, resolution

STRICT FORMATTING:
TITLE: [Create an engaging, age-appropriate title]

[Write the complete story here - exactly ${lengthSpec.targetWords} words]

WORD COUNT: [State the exact word count]

${gender ? `IMPORTANT: Use ${gender === 'boy' ? 'he/him' : 'she/her'} pronouns for ${characterName}` : ''}

${customPrompt ? `ADDITIONAL REQUIREMENTS: ${customPrompt}` : ''}

${attemptModifiers}

Remember: This story should be perfectly suited for a ${getReadingLevelDisplay(childAge)} and must be exactly ${lengthSpec.targetWords} words long. Quality and word count are both critical.`;
}

// Enhanced character naming
function getContextualCharacterName(gender, childAge) {
    const isOlder = ['fluent-reader', 'insightful-reader'].includes(childAge);
    
    if (isOlder) {
        const olderNames = {
            boy: ['Alex Chen', 'Marcus Rivera', 'Kai Nakamura', 'Devon Walsh'],
            girl: ['Maya Patel', 'Zara Johnson', 'Luna Rodriguez', 'Sage Williams'],
            neutral: ['the young hero', 'the brave adventurer', 'the clever protagonist']
        };
        
        if (gender === 'boy') return olderNames.boy[Math.floor(Math.random() * olderNames.boy.length)];
        if (gender === 'girl') return olderNames.girl[Math.floor(Math.random() * olderNames.girl.length)];
        return olderNames.neutral[Math.floor(Math.random() * olderNames.neutral.length)];
    }
    
    const youngerNames = {
        boy: ['Sam', 'Alex', 'Jamie', 'Riley', 'Quinn'],
        girl: ['Emma', 'Lily', 'Maya', 'Zoe', 'Ava'],
        neutral: ['the little hero', 'the young friend', 'the brave child']
    };
    
    if (gender === 'boy') return youngerNames.boy[Math.floor(Math.random() * youngerNames.boy.length)];
    if (gender === 'girl') return youngerNames.girl[Math.floor(Math.random() * youngerNames.girl.length)];
    return youngerNames.neutral[Math.floor(Math.random() * youngerNames.neutral.length)];
}

// OpenAI API call
async function callOpenAI(model, prompt, maxTokens, apiKey) {
    const systemPrompt = `You are an expert children's story writer with years of experience creating age-appropriate, engaging content. You understand the importance of precise word counts and age-appropriate content. You always format your response with 'TITLE: [Story Title]' followed by the story content, and end with 'WORD COUNT: [number]'.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.8,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const storyText = data.choices[0].message.content;

    return {
        title: extractTitle(storyText),
        content: cleanStoryContent(storyText),
        rawText: storyText,
        metadata: {
            model: model,
            generatedAt: new Date().toISOString()
        }
    };
}

// Quality scoring system
function calculateQualityScore(story, params, lengthSpec) {
    let score = 0;
    const wordCount = story.content.split(' ').length;
    
    // Length accuracy (40% of score)
    const lengthAccuracy = Math.max(0, 100 - Math.abs(wordCount - lengthSpec.targetWords) / lengthSpec.targetWords * 100);
    score += lengthAccuracy * 0.4;
    
    // Content quality indicators (60% of score)
    const hasTitle = story.title && story.title.length > 5;
    const hasGoodStructure = story.content.includes('\n\n'); // Multiple paragraphs
    const hasDialogue = story.content.includes('"') || story.content.includes("'");
    const hasRichDescription = wordCount > lengthSpec.minWords;
    const hasCharacterName = story.content.toLowerCase().includes(params.childName?.toLowerCase() || 'character');
    
    const qualityChecks = [hasTitle, hasGoodStructure, hasDialogue, hasRichDescription, hasCharacterName];
    const qualityScore = qualityChecks.filter(Boolean).length / qualityChecks.length * 100;
    
    score += qualityScore * 0.6;
    
    return Math.round(score);
}

// Helper functions
function getReadingLevelDisplay(readingLevel) {
    const displays = {
        'pre-reader': 'Pre-Reader (Ages 3-6)',
        'early-phonics': 'Early Phonics Reader (Ages 4-7)',
        'beginning-reader': 'Beginning Reader (Ages 5-8)',
        'developing-reader': 'Developing Reader (Ages 6-10)',
        'fluent-reader': 'Fluent Reader (Ages 8-13)',
        'insightful-reader': 'Insightful Reader (Ages 10-16)'
    };
    return displays[readingLevel] || 'Beginning Reader';
}

function extractTitle(storyText) {
    const titleMatch = storyText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    if (titleMatch) {
        return titleMatch[1].trim().replace(/["""]/g, '');
    }
    return storyText.split('\n')[0].replace(/^#\s*/, '').trim();
}

function cleanStoryContent(storyText) {
    return storyText
        .replace(/^TITLE:\s*.+?(?:\n|$)/i, '')
        .replace(/WORD COUNT:\s*\d+.*$/i, '')
        .trim()
        .replace(/\n{3,}/g, '\n\n');
}
