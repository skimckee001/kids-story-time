// Netlify function for story generation using OpenAI
// File: netlify/functions/generate-story.js

exports.handler = async (event, context) => {
    // Set CORS headers for browser requests
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { 
            childName, 
            childAge, 
            storyLength, 
            theme, 
            themes = [], 
            gender = '',
            customPrompt = '',
            includeNameInStory = true,
            imageStyle = 'age-appropriate',
            imagePrompt = '',
            enhancedPrompt = null,
            wordTarget = null,
            contentGuidelines = null
        } = JSON.parse(event.body);

        // Validate required parameters
        if (!childName || !childAge || !storyLength) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required parameters: childName, childAge, storyLength' 
                })
            };
        }

        // Check for OpenAI API key
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('API Key check:', apiKey ? 'Key found' : 'Key not found');
        console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
        
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'OpenAI API key not configured',
                    fallbackAvailable: true,
                    debug: {
                        hasKey: !!apiKey,
                        envVars: Object.keys(process.env).length
                    }
                })
            };
        }

        // Use enhanced prompt if provided, otherwise build standard prompt
        const prompt = enhancedPrompt || buildStoryPrompt(childName, childAge, storyLength, theme, themes, gender, customPrompt, includeNameInStory);
        
        // Choose model based on reading level complexity
        const useGPT4 = ['fluent-reader', 'insightful-reader'].includes(childAge) && 
                       ['extended', 'long-extended'].includes(storyLength);
        const model = useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: enhancedPrompt ? 
                            `You are an expert storyteller. Create stories exactly as specified in the prompt. CRITICAL: Follow word count requirements precisely.` :
                            getSystemPromptForAge(childAge)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: getMaxTokensForLength(storyLength),
                temperature: 0.8,
                presence_penalty: 0.3,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI API Error:', errorData);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `OpenAI API request failed: ${response.status}`,
                    fallbackAvailable: true
                })
            };
        }

        const data = await response.json();
        const storyText = data.choices[0].message.content;

        // Extract title and content
        const title = extractTitle(storyText);
        const content = cleanStoryContent(storyText);

        // Return the generated story
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                story: {
                    title,
                    content,
                    metadata: {
                        childName,
                        childAge,
                        storyLength,
                        theme: themes.length > 0 ? themes.join(', ') : theme,
                        generatedAt: new Date().toISOString(),
                        type: 'ai-generated',
                        model: model,
                        wordCount: content.split(/\s+/).length,
                        targetWords: wordTarget?.target || null
                    }
                }
            })
        };

    } catch (error) {
        console.error('Story generation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                fallbackAvailable: true
            })
        };
    }
};

// Helper functions (same as in frontend service)
function getSystemPromptForAge(age) {
    const basePrompt = "You are an expert children's story writer. Format your response with 'TITLE: [Story Title]' followed by the story content.";
    
    const agePrompts = {
        'pre-reader': `${basePrompt} You specialize in stories for ages 3-6. Use:
- Very simple vocabulary (max 100 unique words)
- Short sentences (3-5 words)
- Lots of repetition and rhythm
- Focus on colors, shapes, animals, emotions
- Include sound effects (Whoosh! Boom! Meow!)
- Simple moral lessons (sharing, kindness, bravery)`,
        
        'early-phonics': `${basePrompt} You write for early readers ages 4-7. Use:
- Simple phonetic words
- Sentences of 5-7 words
- Clear cause and effect
- Familiar settings (home, school, playground)
- Basic problem-solving
- Gentle humor and silly situations`,
        
        'beginning-reader': `${basePrompt} You create stories for beginning readers ages 5-8. Use:
- Mix of sight words and phonetic words
- Sentences up to 10 words
- Character emotions and motivations
- Simple plot twists
- Friendship themes
- Light adventure and mystery`,
        
        'developing-reader': `${basePrompt} You write for developing readers ages 6-10. Use:
- Varied vocabulary with context clues
- Complex sentences (10-15 words)
- Character development arcs
- Multiple plot points
- Themes of courage, friendship, discovery
- Mild suspense and excitement`,
        
        'fluent-reader': `${basePrompt} You craft stories for fluent readers ages 8-13. Use:
- Rich descriptive language
- Complex sentence structures
- Multiple characters with distinct voices
- Subplots and character relationships
- Themes of identity, belonging, achievement
- Age-appropriate challenges and conflicts`,
        
        'insightful-reader': `${basePrompt} You write sophisticated stories for ages 10-16. Use:
- Advanced vocabulary
- Literary devices (metaphor, foreshadowing)
- Complex character psychology
- Moral ambiguity and ethical dilemmas
- Coming-of-age themes
- Thought-provoking endings`
    };
    
    return agePrompts[age] || agePrompts['beginning-reader'];
}

function buildStoryPrompt(childName, childAge, storyLength, theme, themes = [], gender, customPrompt, includeNameInStory = true) {
    // Word counts based on average reading speed of 150 words per minute for children
    const lengthInstructions = {
        short: 'Write a short story (300-450 words, 2-3 minutes reading time)',
        medium: 'Write a medium-length story (750-1050 words, 5-7 minutes reading time)', 
        long: 'Write a longer story (1500-2250 words, 10-15 minutes reading time)',
        extended: 'Write an extended story (3000-4000 words, 20+ minutes reading time)',
        'long-extended': 'Write a long extended story (2500-3000 words, 30 minutes reading time)',
        'extra-long': 'Write an extra long story (3500-4000 words, 45 minutes reading time)'
    };

    const readingLevelGuidelines = {
        'pre-reader': 'Use very simple vocabulary, short sentences (3-5 words), repetitive phrases, focus on basic concepts like colors, shapes, emotions, and simple actions. Include lots of sound effects and interactive elements.',
        'early-phonics': 'Use simple vocabulary with some phonics patterns, short sentences (5-7 words), repetitive story structure, focus on basic problem-solving and familiar experiences.',
        'beginning-reader': 'Use sight words and simple phonetic words, sentences up to 8-10 words, clear story structure with beginning/middle/end, include basic character emotions and simple conflicts.',
        'developing-reader': 'Use more varied vocabulary including some challenging words, longer sentences (10-15 words), include character development, cause-and-effect relationships, and moral lessons.',
        'fluent-reader': 'Use rich vocabulary with descriptive language, complex sentence structures, detailed character development, multiple plot threads, and meaningful themes.',
        'insightful-reader': 'Use sophisticated vocabulary, complex narrative structures, deep character psychology, nuanced themes, and thought-provoking concepts that encourage critical thinking.'
    };

    // Determine the character name to use in the story
    const characterName = includeNameInStory ? childName : getGenericCharacterName(gender, childAge);
    
    // Handle multiple themes or single theme
    let storyThemes = [];
    if (themes && themes.length > 0) {
        storyThemes = themes;
    } else if (theme) {
        storyThemes = [theme];
    } else {
        storyThemes = ['adventure']; // Default theme
    }
    
    const themeDescription = storyThemes.length === 1 
        ? `a ${storyThemes[0]} story` 
        : `a story combining ${storyThemes.slice(0, -1).join(', ')} and ${storyThemes[storyThemes.length - 1]} themes`;
    
    let prompt = `${lengthInstructions[storyLength] || lengthInstructions.medium}.

Create ${themeDescription} ${includeNameInStory ? `for ${characterName}` : 'for a child'}, who is at the ${getReadingLevelDisplay(childAge)} reading level.

Reading Level Guidelines: ${readingLevelGuidelines[childAge] || readingLevelGuidelines['beginning-reader']}

Story Requirements:
- Feature ${characterName} as the main character
- Include age-appropriate vocabulary and themes for ${getReadingLevelDisplay(childAge)} level
- Have a clear beginning, middle, and end
- Include a positive message or lesson
- Be engaging and imaginative
- Safe and appropriate for children
${gender ? `- Use ${gender === 'boy' ? 'he/him' : 'she/her'} pronouns for ${characterName}` : ''}

${customPrompt ? `Additional requirements: ${customPrompt}` : ''}

Please format the response with:
TITLE: [Story Title]

[Story content here]

Make it magical and engaging${includeNameInStory ? ` for ${characterName}` : ''}!`;

    return prompt;
}

function getGenericCharacterName(gender, childAge) {
    const boyNames = ['Alex', 'Sam', 'Jordan', 'Riley', 'Quinn', 'Casey', 'Jamie', 'Avery'];
    const girlNames = ['Taylor', 'Morgan', 'Sydney', 'Robin', 'Blake', 'Sage', 'River', 'Luna'];
    const heroNames = ['the brave adventurer', 'the young hero', 'the clever explorer', 'the kind friend'];
    
    // For older readers, use more sophisticated character names
    const olderBoyNames = ['the brave young knight', 'the clever inventor', 'the curious explorer'];
    const olderGirlNames = ['the wise young scholar', 'the adventurous explorer', 'the creative artist'];
    
    if (childAge === 'insightful-reader' || childAge === 'fluent-reader') {
        if (gender === 'boy') {
            return olderBoyNames[Math.floor(Math.random() * olderBoyNames.length)];
        } else if (gender === 'girl') {
            return olderGirlNames[Math.floor(Math.random() * olderGirlNames.length)];
        } else {
            return heroNames[Math.floor(Math.random() * heroNames.length)];
        }
    }
    
    if (gender === 'boy') {
        return boyNames[Math.floor(Math.random() * boyNames.length)];
    } else if (gender === 'girl') {
        return girlNames[Math.floor(Math.random() * girlNames.length)];
    } else {
        return heroNames[Math.floor(Math.random() * heroNames.length)];
    }
}

function getMaxTokensForLength(length) {
    // Adjusted token limits for proper word counts (1 token ≈ 0.75 words)
    const tokenLimits = {
        short: 600,      // ~450 words
        medium: 1400,    // ~1050 words
        long: 3000,      // ~2250 words
        extended: 5300,  // ~4000 words
        'long-extended': 3500,
        'extra-long': 4500
    };
    return tokenLimits[length] || tokenLimits.medium;
}

function getReadingLevelDisplay(readingLevel) {
    const displays = {
        'pre-reader': 'Pre-Reader',
        'early-phonics': 'Early Phonics Reader',
        'beginning-reader': 'Beginning Reader',
        'developing-reader': 'Developing Reader',
        'fluent-reader': 'Fluent Reader',
        'insightful-reader': 'Insightful Reader'
    };
    return displays[readingLevel] || 'Beginning Reader';
}

function extractTitle(storyText) {
    const titleMatch = storyText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    if (titleMatch) {
        return titleMatch[1].trim();
    }
    // Fallback to first line if no title format found
    return storyText.split('\n')[0].replace(/^#\s*/, '').trim();
}

function cleanStoryContent(storyText) {
    // Remove title line and clean up formatting
    return storyText
        .replace(/^TITLE:\s*.+?(?:\n|$)/i, '')
        .trim()
        .replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines
}