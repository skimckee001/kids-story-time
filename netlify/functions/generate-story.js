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
            includeNameInStory = true
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
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'OpenAI API key not configured',
                    fallbackAvailable: true
                })
            };
        }

        // Build the story prompt (using the same logic as the frontend)
        const prompt = buildStoryPrompt(childName, childAge, storyLength, theme, themes, gender, customPrompt, includeNameInStory);
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative children\'s story writer who creates age-appropriate, engaging, and educational stories. Always include positive messages and age-appropriate content. Format your response with "TITLE: [Story Title]" followed by the story content.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: getMaxTokensForLength(storyLength),
                temperature: 0.8
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
                        model: 'gpt-3.5-turbo'
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
function buildStoryPrompt(childName, childAge, storyLength, theme, themes = [], gender, customPrompt, includeNameInStory = true) {
    const lengthInstructions = {
        short: 'Write a short story (200-300 words, 2-3 minutes reading time)',
        medium: 'Write a medium-length story (400-600 words, 5-7 minutes reading time)', 
        long: 'Write a longer story (800-1200 words, 10-15 minutes reading time)',
        extended: 'Write an extended story (1500-2000 words, 20 minutes reading time)',
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
    const tokenLimits = {
        short: 400,
        medium: 800,
        long: 1500,
        extended: 2500,
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