// AI Story Generation Service for Kids Story Time
// File: js/ai-story-service.js

class AIStoryService {
    constructor() {
        // You'll need to add your OpenAI API key here or use a backend service
        this.apiKey = null; // Set this in production or use a backend
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // Generate story using AI (OpenAI GPT)
    async generateStory(params) {
        const { 
            childName, 
            childAge, 
            storyLength, 
            theme, 
            interests = [],
            customPrompt = '' 
        } = params;

        try {
            // For demo purposes, we'll use a mock response
            // In production, you'd want to use a backend service for API calls
            if (!this.apiKey) {
                return this.generateMockStory(params);
            }

            const prompt = this.buildStoryPrompt(childName, childAge, storyLength, theme, interests, customPrompt);
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a creative children\'s story writer who creates age-appropriate, engaging, and educational stories. Always include positive messages and age-appropriate content.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.getMaxTokensForLength(storyLength),
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const storyText = data.choices[0].message.content;

            return {
                success: true,
                story: {
                    title: this.extractTitle(storyText),
                    content: this.cleanStoryContent(storyText),
                    metadata: {
                        childName,
                        childAge,
                        storyLength,
                        theme,
                        generatedAt: new Date().toISOString()
                    }
                }
            };
        } catch (error) {
            console.error('Story generation error:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.generateMockStory(params)
            };
        }
    }

    // Build the AI prompt for story generation
    buildStoryPrompt(childName, childAge, storyLength, theme, interests, customPrompt) {
        const lengthInstructions = {
            short: 'Write a short story (200-300 words, 2-3 minutes reading time)',
            medium: 'Write a medium-length story (400-600 words, 5-7 minutes reading time)', 
            long: 'Write a longer story (800-1200 words, 10-15 minutes reading time)'
        };

        const ageGuidelines = {
            '3-5': 'Use simple vocabulary, short sentences, and focus on basic concepts like colors, shapes, and emotions',
            '6-8': 'Use slightly more complex vocabulary, include simple problem-solving, and basic moral lessons',
            '9-12': 'Use age-appropriate vocabulary, include character development and more complex themes'
        };

        let prompt = `${lengthInstructions[storyLength] || lengthInstructions.medium}.

Create a ${theme} story for ${childName}, who is ${childAge} years old.

Age Guidelines: ${ageGuidelines[this.getAgeGroup(childAge)] || ageGuidelines['6-8']}

Story Requirements:
- Feature ${childName} as the main character
- Include age-appropriate vocabulary and themes
- Have a clear beginning, middle, and end
- Include a positive message or lesson
- Be engaging and imaginative
- Safe and appropriate for children

${interests.length > 0 ? `Include these interests: ${interests.join(', ')}` : ''}

${customPrompt ? `Additional requirements: ${customPrompt}` : ''}

Please format the response with:
TITLE: [Story Title]

[Story content here]

Make it magical and engaging for ${childName}!`;

        return prompt;
    }

    // Generate mock story for demo/fallback
    async generateMockStory(params) {
        const { childName, childAge, storyLength, theme } = params;
        
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const stories = {
            adventure: {
                short: {
                    title: `${childName} and the Magic Forest`,
                    content: `Once upon a time, ${childName} discovered a magical forest behind their house. The trees sparkled with golden leaves, and friendly forest animals came to greet them.

"Welcome, ${childName}!" chirped a wise old owl. "We need your help to find the lost rainbow crystal!"

${childName} bravely ventured deeper into the forest, following a trail of glittering breadcrumbs. Along the way, they helped a lost bunny find its family and shared their snacks with hungry squirrels.

Finally, ${childName} found the rainbow crystal hidden under a mushroom. As they picked it up, the entire forest burst into beautiful colors!

"Thank you, ${childName}!" said all the animals together. "Your kindness and bravery saved our forest!"

${childName} returned home with a heart full of joy and a pocket full of magical forest memories.

The End.`
                },
                medium: {
                    title: `${childName}'s Incredible Space Adventure`,
                    content: `${childName} was gazing at the stars one night when suddenly, a friendly alien spaceship landed in their backyard! Out stepped Zorp, a purple alien with three eyes and a big smile.

"Greetings, ${childName}! I'm Zorp from planet Zephyr. We need your help to save our planet's music!" Zorp explained that their planet's special music crystals had been scattered across the galaxy by a cosmic storm.

Without hesitation, ${childName} climbed aboard the spaceship. They zoomed past glittering asteroids and dancing comets. Their first stop was the Moon, where they found a crystal hidden in a crater, humming a beautiful lullaby.

Next, they visited Mars, where the red sand revealed a crystal that played cheerful marching tunes. The crystal was guarded by friendly Martian robots who loved to dance.

On Jupiter's moons, ${childName} discovered crystals that created the most amazing symphony when played together. Each moon had a different musical note!

Finally, they found the last crystal on a tiny asteroid, singing the most beautiful song ${childName} had ever heard. When all the crystals were reunited, they created music so wonderful that it could be heard across the entire galaxy.

"Thank you, ${childName}!" said Zorp, tears of joy in all three eyes. "You've saved our planet's music and brought happiness to the galaxy!"

As a reward, Zorp gave ${childName} a small crystal that would always play their favorite song. ${childName} returned home with an amazing story and a magical gift that reminded them that helping others creates the most beautiful music of all.

The End.`
                }
            },
            friendship: {
                short: {
                    title: `${childName} and the Lonely Dragon`,
                    content: `In a valley near ${childName}'s home lived a sad dragon named Ember. All the other dragons had friends, but Ember felt different because instead of breathing fire, they breathed beautiful flowers.

One day, ${childName} heard Ember crying and decided to investigate. They found the lonely dragon sitting by a stream, looking very sad.

"Why are you crying?" asked ${childName} kindly.

"I'm different from all the other dragons," sniffled Ember. "I can't breathe fire like they can."

${childName} smiled. "But look how beautiful these flowers are! You create something wonderful and peaceful."

Together, they planted a magnificent garden with Ember's flower breath. Soon, butterflies, bees, and birds came to visit. Other dragons came to see the beautiful garden too.

"Your gift is amazing, Ember!" they said. "We wish we could create such beauty!"

From that day on, Ember was never lonely again. ${childName} had helped them see that being different was actually a wonderful gift.

The End.`
                },
                medium: {
                    title: `${childName} and the School of Magical Creatures`,
                    content: `${childName} was walking through the woods when they stumbled upon a hidden school for magical creatures. There were baby unicorns learning to fly, young phoenixes practicing their songs, and little dragons learning to control their powers.

But ${childName} noticed one small creature sitting alone - a tiny griffin named Pip who couldn't fly like the others.

"I don't belong here," Pip said sadly. "All the other griffins can soar through the sky, but my wings are too small."

${childName} sat down next to Pip. "Maybe your wings aren't meant for flying yet. What else can you do really well?"

Pip thought for a moment. "Well, I can run really fast, and I have excellent eyesight. I can spot things from very far away."

"Those sound like amazing abilities!" said ${childName}. "Let's show everyone!"

Together, they organized a treasure hunt for all the young magical creatures. Pip's sharp eyes spotted all the hidden treasures that others missed, and their speedy running helped everyone find the clues.

Soon, all the creatures realized that Pip's unique talents were just as valuable as flying. The school's wise headmaster, an ancient owl, explained that every creature develops their abilities at their own pace.

"Flying will come when you're ready, Pip," she hooted gently. "But your other gifts are already perfect."

A few weeks later, ${childName} received a magical letter delivered by a flying griffin - it was Pip! Their wings had grown strong through confidence and friendship.

"Thank you for helping me believe in myself!" wrote Pip. "${childName}, you taught me that everyone is special in their own way!"

The End.`
                }
            }
        };

        const selectedTheme = stories[theme] || stories.adventure;
        const selectedLength = selectedTheme[storyLength] || selectedTheme.short;

        return {
            success: true,
            story: {
                title: selectedLength.title,
                content: selectedLength.content,
                metadata: {
                    childName,
                    childAge,
                    storyLength,
                    theme,
                    generatedAt: new Date().toISOString(),
                    type: 'demo'
                }
            }
        };
    }

    // Helper methods
    getMaxTokensForLength(length) {
        const tokenLimits = {
            short: 400,
            medium: 800,
            long: 1500
        };
        return tokenLimits[length] || tokenLimits.medium;
    }

    getAgeGroup(age) {
        const numAge = parseInt(age);
        if (numAge <= 5) return '3-5';
        if (numAge <= 8) return '6-8';
        return '9-12';
    }

    extractTitle(storyText) {
        const titleMatch = storyText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        // Fallback to first line if no title format found
        return storyText.split('\n')[0].replace(/^#\s*/, '').trim();
    }

    cleanStoryContent(storyText) {
        // Remove title line and clean up formatting
        return storyText
            .replace(/^TITLE:\s*.+?(?:\n|$)/i, '')
            .trim()
            .replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines
    }

    // Set API key (in production, this should be handled by backend)
    setApiKey(key) {
        this.apiKey = key;
    }
}

// Create global AI service instance
window.aiStoryService = new AIStoryService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIStoryService;
}