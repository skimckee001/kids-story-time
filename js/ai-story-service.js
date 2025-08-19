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
            // Try backend API first for real AI generation
            try {
                const backendUrl = window.location.origin + '/api/generate-story';
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        childName, 
                        childAge, 
                        storyLength, 
                        theme, 
                        themes,
                        gender,
                        customPrompt,
                        includeNameInStory
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Real AI-generated story from backend
                        return {
                            success: true,
                            story: data.story,
                            type: 'ai-generated'
                        };
                    }
                }

                // If backend fails but indicates fallback is available, continue to mock
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.log('Backend API unavailable, using mock stories:', errorData.error);
                }
            } catch (backendError) {
                console.log('Backend not available, using mock stories:', backendError.message);
            }

            // Fallback to mock story if backend is unavailable or API key not configured
            return this.generateMockStory(params);

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
        
        // Create display theme for metadata (for multiple themes, show first one or combination)
        let displayTheme = selectedTheme;
        if (themes && themes.length > 1) {
            displayTheme = themes.slice(0, 2).join(' & '); // Show first 2 themes
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

        // Get age and gender appropriate story content
        const appropriateStories = this.getAgeAppropriateContent(stories, childAge, gender, characterName, selectedTheme);
        const selectedStory = appropriateStories;
        
        // For demo purposes, map extended lengths to available stories
        let effectiveLength = storyLength;
        if (!selectedStory[storyLength]) {
            if (storyLength === 'extended' || storyLength === 'long-extended' || storyLength === 'extra-long') {
                effectiveLength = 'medium'; // Use medium story for longer lengths in demo
            } else {
                effectiveLength = 'short'; // Default fallback
            }
        }
        
        const selectedLength = selectedStory[effectiveLength] || selectedStory.short;
        
        // Adjust content length to match the requested story length
        const adjustedContent = this.adjustStoryLength(selectedLength.content, storyLength, characterName);

        return {
            success: true,
            story: {
                title: selectedLength.title,
                content: adjustedContent,
                metadata: {
                    childName,
                    childAge,
                    storyLength,
                    theme: displayTheme || selectedTheme,
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
            long: 1500,
            extended: 2500,
            'long-extended': 3500,
            'extra-long': 4500
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

    // Adjust story content length to match the requested length
    adjustStoryLength(baseContent, targetLength, characterName) {
        const targetWordCounts = {
            short: 250,        // 2-3 minutes
            medium: 500,       // 5-7 minutes  
            long: 1000,        // 10-15 minutes
            extended: 1750,    // 20 minutes
            'long-extended': 2750,  // 30 minutes
            'extra-long': 4000      // 45 minutes
        };
        
        const targetWords = targetWordCounts[targetLength] || targetWordCounts.medium;
        const currentWords = baseContent.split(/\s+/).length;
        
        if (currentWords >= targetWords * 0.8) {
            // If close enough to target, just return as is
            return baseContent;
        }
        
        // For longer stories, add additional content
        const expansions = [
            `\n\nAs ${characterName} continued the adventure, they discovered even more amazing things. The magical world seemed to grow bigger and more wonderful with each step.`,
            `\n\n${characterName} met new friends along the way who shared their own special talents and wisdom. Each friend taught ${characterName} something valuable about courage, kindness, and believing in yourself.`,
            `\n\nThe journey took ${characterName} through enchanted forests where the trees whispered ancient secrets, across sparkling rivers that sang beautiful melodies, and over rolling hills that seemed to stretch on forever.`,
            `\n\nAlong the path, ${characterName} faced new challenges that tested their bravery and cleverness. But with each obstacle overcome, ${characterName} grew stronger and more confident.`,
            `\n\nThe magical creatures of this special world shared their stories with ${characterName}, tales of friendship, adventure, and the power of believing in yourself even when things seem impossible.`,
            `\n\n${characterName} discovered hidden treasures that weren't made of gold or jewels, but were far more valuable - treasures of friendship, wisdom, and the joy that comes from helping others.`,
            `\n\nAs the sun began to set, painting the sky in brilliant colors of orange, pink, and purple, ${characterName} realized that the greatest adventures are the ones we share with others.`,
            `\n\nThe magical journey taught ${characterName} that being brave doesn't mean not being scared - it means doing the right thing even when you are afraid.`
        ];
        
        let expandedContent = baseContent;
        let expansionIndex = 0;
        
        while (expandedContent.split(/\s+/).length < targetWords && expansionIndex < expansions.length) {
            expandedContent += expansions[expansionIndex];
            expansionIndex++;
        }
        
        // If still not long enough, repeat some expansions with variations
        if (expandedContent.split(/\s+/).length < targetWords && targetLength !== 'short') {
            expandedContent += `\n\n${characterName} spent more time exploring this wonderful world, discovering new places and meeting more amazing friends. Each new experience added to the growing collection of memories that ${characterName} would treasure forever.`;
            
            if (targetLength === 'extra-long') {
                expandedContent += `\n\nThe adventure continued as ${characterName} learned about the history of this magical place, the legends of brave heroes who came before, and the important role that kindness and courage play in making the world a better place for everyone.`;
            }
        }
        
        return expandedContent;
    }

    // Generate age and gender appropriate story content
    getAgeAppropriateContent(baseStories, childAge, gender, characterName, selectedTheme) {
        const isOlderReader = childAge === 'fluent-reader' || childAge === 'insightful-reader';
        const isMaleCharacter = gender === 'boy';
        
        if (isOlderReader) {
            // Create more mature, age-appropriate stories for older readers (8-16+)
            const matureStories = {
                adventure: {
                    short: {
                        title: isMaleCharacter ? `${characterName} and the Hidden Code` : `${characterName}'s Secret Mission`,
                        content: isMaleCharacter ?
                            `${characterName} was always good with puzzles, but the encrypted message he found hidden in his locker was unlike anything he'd seen before. The sequence of numbers and letters seemed random, but ${characterName} suspected there was more to it.

After school, ${characterName} spread the code across his desk and began working. Hours passed as he tried different decryption methods he'd learned online. Finally, a pattern emerged.

The message revealed coordinates to an abandoned warehouse on the edge of town. ${characterName} knew he should tell someone, but curiosity got the better of him.

At the warehouse, ${characterName} discovered a group of teenagers working on a community project to create a digital time capsule for their town's 150th anniversary. They had been leaving coded messages for anyone smart enough to solve them.

"We could use someone with your skills," said their leader, Maya. "${characterName}, want to help us preserve our town's history for the next generation?"

${characterName} realized that the best adventures weren't about danger or mystery—they were about using your talents to make a difference.`
                            :
                            `${characterName} had always felt like she was meant for something bigger than her small town. When she discovered an old journal in her grandmother's attic detailing a family tradition of strong women who made a difference, she knew it was time to find her own path.

The journal mentioned a scholarship program that ${characterName} had never heard of—one that supported young women pursuing environmental science. The application deadline was in just two weeks.

${characterName} threw herself into the application, researching water conservation projects and designing her own proposal for improving the local river ecosystem. She interviewed scientists, gathered water samples, and created presentations.

When other students doubted her chances, ${characterName} remembered her grandmother's words: "Courage isn't the absence of fear—it's acting despite it."

The day the acceptance letter arrived, ${characterName} realized her adventure was just beginning. She had discovered that her true strength came from combining her passion for science with her determination to create positive change.

College would bring new challenges, but ${characterName} was ready to continue her family's legacy of making a difference in the world.`
                    },
                    medium: {
                        title: isMaleCharacter ? `${characterName} and the Tech Startup Challenge` : `${characterName}'s Innovation Lab`,
                        content: isMaleCharacter ?
                            `${characterName} had been coding since he was ten, but the high school entrepreneurship competition would test more than just his programming skills. Teams had six weeks to develop an app that could make a real difference in their community.

His idea was simple: a platform connecting elderly residents with tech-savvy teenagers for digital literacy support. But making it work required more than code—it needed real human connections.

${characterName} spent weekends visiting senior centers, learning about their struggles with technology. Mrs. Chen couldn't video call her grandchildren. Mr. Rodriguez couldn't access his medical records online. Each conversation shaped his app's features.

The development process wasn't smooth. The database crashed twice, and ${characterName} had to rebuild the user interface from scratch. His teammates, Sarah and Alex, handled marketing and user testing while ${characterName} coded late into the night.

During the competition presentation, ${characterName} demonstrated how his app had already helped twelve seniors in just two weeks of beta testing. The judges were impressed not just by the technology, but by the real relationships he'd built.

"Success in tech isn't just about writing code," the lead judge explained as they announced ${characterName}'s team as winners. "It's about understanding people and solving real problems."

The prize money would fund the app's expansion to other communities, but ${characterName} had already gained something more valuable: the knowledge that technology's true power lies in bringing people together.`
                            :
                            `${characterName} had always been fascinated by robotics, but the regional STEM competition would be her biggest challenge yet. While other teams focused on complex mechanisms, ${characterName} had a different vision: a robot designed to help students with learning disabilities.

Her inspiration came from her younger brother Jake, who struggled with dyslexia. Traditional reading methods frustrated him, but he learned better through interactive, multi-sensory approaches.

${characterName} designed a robot companion that could read text aloud while highlighting words, provide visual learning cues, and adapt to different learning styles. The engineering was complex—voice recognition, text processing, and adaptive algorithms all had to work seamlessly.

Late nights in the school's maker space became routine. ${characterName} taught herself advanced programming languages and collaborated with special education teachers to understand learning differences better.

When her first prototype malfunctioned during testing, ${characterName} didn't give up. She redesigned the entire system, making it more reliable and user-friendly.

At the competition, ${characterName} watched nervously as judges evaluated her robot. When eight-year-old Emma, who had been struggling with reading, successfully completed a story with the robot's help and smiled brightly, ${characterName} knew she had succeeded regardless of the competition results.

The first-place trophy was wonderful, but seeing how her innovation could transform learning experiences was the real reward. ${characterName} was already planning improvements for version 2.0.`
                    }
                },
                friendship: {
                    short: {
                        title: `${characterName} and the New Student`,
                        content: `Starting junior year at a new school would be challenging enough, but ${characterName} noticed that Alex, another new student, was having an even harder time. While ${characterName} was naturally outgoing, Alex seemed overwhelmed and alone.

During lunch, ${characterName} saw Alex sitting alone, so ${characterName} approached with a friendly smile. "Mind if I join you? I'm still figuring out where everything is too."

Over the following weeks, ${characterName} and Alex discovered they both loved photography and environmental science. They started a small photography club focused on documenting local wildlife and environmental changes.

Their friendship deepened when Alex confided about moving frequently due to a parent's military service. ${characterName} realized that being a good friend meant understanding that everyone's struggles are different.

When Alex's photographs were selected for the state environmental contest, ${characterName} felt genuinely proud. True friendship, ${characterName} learned, means celebrating others' successes as much as your own.`
                    },
                    medium: {
                        title: `${characterName}'s Leadership Journey`,
                        content: `When ${characterName} was elected class president, the real challenge wasn't winning votes—it was bringing together students with completely different perspectives and priorities.

The senior class was divided over prom venue choices, graduation ceremony changes, and fundraising priorities. Some students wanted traditional approaches, while others pushed for innovative alternatives.

${characterName} organized listening sessions where every student could voice their concerns. Initially, meetings were heated and unproductive. But ${characterName} learned to facilitate discussions, helping classmates find common ground.

The breakthrough came when ${characterName} suggested combining ideas rather than choosing sides. They could have a traditional graduation ceremony AND innovative fundraising. The prom could feature both classic and modern elements.

By graduation, ${characterName} had learned that effective leadership isn't about having all the answers—it's about helping others find solutions together. The experience prepared ${characterName} for college leadership roles and future career challenges.`
                    }
                }
            };

            return matureStories[selectedTheme] || matureStories.adventure;
        }
        
        // For younger readers, use the existing age-appropriate stories
        return baseStories[selectedTheme] || baseStories.adventure;
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