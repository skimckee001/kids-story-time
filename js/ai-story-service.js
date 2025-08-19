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
            themes = [], // Support for multiple themes
            gender = '',
            customPrompt = '',
            includeNameInStory = true
        } = params;

        try {
            // For demo purposes, we'll use a mock response
            // In production, you'd want to use a backend service for API calls
            if (!this.apiKey) {
                return this.generateMockStory(params);
            }

            const prompt = this.buildStoryPrompt(childName, childAge, storyLength, theme, themes, gender, customPrompt, includeNameInStory);
            
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
    buildStoryPrompt(childName, childAge, storyLength, theme, themes = [], gender, customPrompt, includeNameInStory = true) {
        const lengthInstructions = {
            short: 'Write a short story (200-300 words, 2-3 minutes reading time)',
            medium: 'Write a medium-length story (400-600 words, 5-7 minutes reading time)', 
            long: 'Write a longer story (800-1200 words, 10-15 minutes reading time)'
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
        const characterName = includeNameInStory ? childName : this.getGenericCharacterName(gender, childAge);
        
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

Create ${themeDescription} ${includeNameInStory ? `for ${characterName}` : 'for a child'}, who is at the ${this.getReadingLevelDisplay(childAge)} reading level.

Reading Level Guidelines: ${readingLevelGuidelines[childAge] || readingLevelGuidelines['beginning-reader']}

Story Requirements:
- Feature ${characterName} as the main character
- Include age-appropriate vocabulary and themes for ${this.getReadingLevelDisplay(childAge)} level
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
    
    // Get a generic character name based on gender and age
    getGenericCharacterName(gender, childAge) {
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

    // Generate mock story for demo/fallback
    async generateMockStory(params) {
        const { childName, childAge, storyLength, theme, themes = [], gender = '', includeNameInStory = true } = params;
        
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Determine the character name to use in the story
        const characterName = includeNameInStory ? childName : this.getGenericCharacterName(gender, childAge);
        
        // Handle multiple themes or single theme for mock story selection
        let selectedTheme = 'adventure'; // Default
        if (themes && themes.length > 0) {
            // For mock stories, pick the first theme or a random one
            selectedTheme = themes[0];
        } else if (theme) {
            selectedTheme = theme;
        }

        const stories = {
            adventure: {
                short: {
                    title: `${characterName} and the Magic Forest`,
                    content: `Once upon a time, ${characterName} discovered a magical forest behind their house. The trees sparkled with golden leaves, and friendly forest animals came to greet them.

"Welcome, ${characterName}!" chirped a wise old owl. "We need your help to find the lost rainbow crystal!"

${characterName} bravely ventured deeper into the forest, following a trail of glittering breadcrumbs. Along the way, they helped a lost bunny find its family and shared their snacks with hungry squirrels.

Finally, ${characterName} found the rainbow crystal hidden under a mushroom. As they picked it up, the entire forest burst into beautiful colors!

"Thank you, ${characterName}!" said all the animals together. "Your kindness and bravery saved our forest!"

${characterName} returned home with a heart full of joy and a pocket full of magical forest memories.

The End.`
                },
                medium: {
                    title: `${characterName}'s Incredible Space Adventure`,
                    content: `${characterName} was gazing at the stars one night when suddenly, a friendly alien spaceship landed in their backyard! Out stepped Zorp, a purple alien with three eyes and a big smile.

"Greetings, ${characterName}! I'm Zorp from planet Zephyr. We need your help to save our planet's music!" Zorp explained that their planet's special music crystals had been scattered across the galaxy by a cosmic storm.

Without hesitation, ${characterName} climbed aboard the spaceship. They zoomed past glittering asteroids and dancing comets. Their first stop was the Moon, where they found a crystal hidden in a crater, humming a beautiful lullaby.

Next, they visited Mars, where the red sand revealed a crystal that played cheerful marching tunes. The crystal was guarded by friendly Martian robots who loved to dance.

On Jupiter's moons, ${characterName} discovered crystals that created the most amazing symphony when played together. Each moon had a different musical note!

Finally, they found the last crystal on a tiny asteroid, singing the most beautiful song ${characterName} had ever heard. When all the crystals were reunited, they created music so wonderful that it could be heard across the entire galaxy.

"Thank you, ${characterName}!" said Zorp, tears of joy in all three eyes. "You've saved our planet's music and brought happiness to the galaxy!"

As a reward, Zorp gave ${characterName} a small crystal that would always play their favorite song. ${characterName} returned home with an amazing story and a magical gift that reminded them that helping others creates the most beautiful music of all.

The End.`
                }
            },
            friendship: {
                short: {
                    title: `${characterName} and the Lonely Dragon`,
                    content: `In a valley near ${characterName}'s home lived a sad dragon named Ember. All the other dragons had friends, but Ember felt different because instead of breathing fire, they breathed beautiful flowers.

One day, ${characterName} heard Ember crying and decided to investigate. They found the lonely dragon sitting by a stream, looking very sad.

"Why are you crying?" asked ${characterName} kindly.

"I'm different from all the other dragons," sniffled Ember. "I can't breathe fire like they can."

${characterName} smiled. "But look how beautiful these flowers are! You create something wonderful and peaceful."

Together, they planted a magnificent garden with Ember's flower breath. Soon, butterflies, bees, and birds came to visit. Other dragons came to see the beautiful garden too.

"Your gift is amazing, Ember!" they said. "We wish we could create such beauty!"

From that day on, Ember was never lonely again. ${characterName} had helped them see that being different was actually a wonderful gift.

The End.`
                },
                medium: {
                    title: `${characterName} and the School of Magical Creatures`,
                    content: `${characterName} was walking through the woods when they stumbled upon a hidden school for magical creatures. There were baby unicorns learning to fly, young phoenixes practicing their songs, and little dragons learning to control their powers.

But ${characterName} noticed one small creature sitting alone - a tiny griffin named Pip who couldn't fly like the others.

"I don't belong here," Pip said sadly. "All the other griffins can soar through the sky, but my wings are too small."

${characterName} sat down next to Pip. "Maybe your wings aren't meant for flying yet. What else can you do really well?"

Pip thought for a moment. "Well, I can run really fast, and I have excellent eyesight. I can spot things from very far away."

"Those sound like amazing abilities!" said ${characterName}. "Let's show everyone!"

Together, they organized a treasure hunt for all the young magical creatures. Pip's sharp eyes spotted all the hidden treasures that others missed, and their speedy running helped everyone find the clues.

Soon, all the creatures realized that Pip's unique talents were just as valuable as flying. The school's wise headmaster, an ancient owl, explained that every creature develops their abilities at their own pace.

"Flying will come when you're ready, Pip," she hooted gently. "But your other gifts are already perfect."

A few weeks later, ${characterName} received a magical letter delivered by a flying griffin - it was Pip! Their wings had grown strong through confidence and friendship.

"Thank you for helping me believe in myself!" wrote Pip. "${characterName}, you taught me that everyone is special in their own way!"

The End.`
                },
                funny: {
                    short: {
                        title: `${characterName}'s Silly Day`,
                        content: `${characterName} woke up one morning and everything seemed backwards! ${characterName} put on shoes before socks, tried to brush teeth with a fork, and the cat was barking while the dog was meowing!

"What a silly day!" laughed ${characterName}. At breakfast, the cereal was floating in the air and the milk was jumping around like popcorn.

Even funnier, when ${characterName} went outside, all the neighbors were walking their goldfish and riding bicycles backwards. The mail carrier was delivering letters by throwing them like paper airplanes!

${characterName} decided to join the silliness and spent the whole day walking on hands, talking in rhymes, and wearing a banana as a hat.

By evening, everything went back to normal, but ${characterName} had learned that sometimes being silly makes the world a lot more fun!

The End.`
                    },
                    medium: {
                        title: `${characterName} and the Giggling Glasses`,
                        content: `${characterName} found a pair of sparkly glasses in Grandpa's attic that had a mysterious note: "Warning: These glasses make everything hilarious!"

Curious, ${characterName} put them on and immediately started giggling. The boring old lamp looked like it was doing a silly dance! The serious family portrait showed everyone making funny faces and sticking out their tongues.

But the real fun started when ${characterName} went downstairs wearing the glasses. Mom appeared to be juggling invisible balls while making breakfast. Dad looked like he was conducting an orchestra of dancing pancakes. Even grumpy old Mr. Peterson next door seemed to be tap-dancing while watering his flowers!

${characterName} couldn't stop laughing! Everything looked so wonderfully ridiculous through the giggling glasses. The school bus looked like a giant yellow banana, and the other kids appeared to be bouncing like silly rubber balls.

At school, even the most serious teacher, Mrs. Thompson, looked like she was performing in a comedy show, using a ruler as a microphone and teaching math by doing the chicken dance.

But when ${characterName} tried to do homework, the numbers and letters kept wobbling and making funny faces back! Realizing that while fun was important, ${characterName} also needed to focus sometimes.

So ${characterName} learned to use the giggling glasses wisely - putting them on when life felt too serious, but taking them off when it was time to work or help others.

From that day on, ${characterName} always remembered that laughter makes everything better, but there's a time and place for both fun and focus!

The End.`
                    }
                },
                unicorns: {
                    short: {
                        title: `${characterName} and the Rainbow Unicorn`,
                        content: `In ${characterName}'s backyard, behind the old oak tree, lived a magical rainbow unicorn named Shimmer. Only ${characterName} could see her because ${characterName} had a pure and kind heart.

Every day after school, ${characterName} would bring Shimmer rainbow-colored flowers and sweet clover. In return, Shimmer would share magical stories and grant one small wish.

One day, ${characterName} found Shimmer looking very sad. "My rainbow colors are fading," Shimmer explained. "I need to help someone who really needs kindness to get my colors back."

${characterName} knew exactly what to do! At school, there was a new student who seemed lonely and had no friends. ${characterName} invited them to play and shared lunch with them.

That afternoon, Shimmer was more colorful than ever! Her horn sparkled like diamonds and her mane flowed like a beautiful rainbow.

"Your kindness brought my colors back," Shimmer said, nuzzling ${characterName}. "True magic comes from caring for others."

From that day on, ${characterName} and the new friend played together every day, and Shimmer's rainbow colors never faded again.

The End.`
                    },
                    medium: {
                        title: `${characterName}'s Unicorn Academy Adventure`,
                        content: `${characterName} received a mysterious letter written in sparkly ink: "You are invited to attend the Secret Unicorn Academy. Follow the rainbow path at sunset."

That evening, ${characterName} discovered a shimmering rainbow path in the woods that led to a magical academy where young unicorns learned to use their powers. The headmaster, a wise old unicorn named Stardust, explained that humans were sometimes invited to learn alongside the unicorns.

${characterName}'s roommate was a young unicorn named Crystal who was struggling with her magic. While other unicorns could create beautiful flowers and heal small wounds, Crystal could only make sparkles that quickly disappeared.

"I'm not good at anything magical," Crystal said sadly.

${characterName} spent every day helping Crystal practice, offering encouragement and celebrating even the smallest improvements. Together, they discovered that Crystal's sparkles weren't useless - they could make anyone who saw them feel happy and hopeful.

During the academy's final exam, a terrible storm threatened to destroy the nearby village's harvest. All the unicorns worked together, using their different magical abilities. The powerful unicorns created barriers against the wind and rain, while the healing unicorns helped damaged plants.

But it was Crystal's sparkles that proved most important. When the villagers saw them dancing through the storm, they felt brave enough to work together to save their crops. The sparkles gave everyone hope and strength to keep trying.

${characterName} learned that every type of magic - and every person - has something special to offer. Sometimes the most important magic isn't the most flashy or obvious.

When it was time to leave the academy, Stardust gave ${characterName} a small crystal that would always sparkle when someone nearby needed encouragement.

${characterName} returned home with not just magical memories, but with the knowledge that kindness and encouragement are the most powerful magic of all.

The End.`
                    }
                }
            }
        };

        const selectedStory = stories[selectedTheme] || stories.adventure;
        const selectedLength = selectedStory[storyLength] || selectedStory.short;

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

    getReadingLevelDisplay(readingLevel) {
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

    getReadingLevelAgeRange(readingLevel) {
        const ageRanges = {
            'pre-reader': '3-6',
            'early-phonics': '4-7',
            'beginning-reader': '5-8',
            'developing-reader': '6-10',
            'fluent-reader': '8-13',
            'insightful-reader': '10-16+'
        };
        return ageRanges[readingLevel] || '5-8';
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