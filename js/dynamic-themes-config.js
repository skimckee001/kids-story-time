// Dynamic Themes Configuration by Age Group
// Based on 2024 research on children's reading preferences
// File: js/dynamic-themes-config.js

const DynamicThemesConfig = {
    // Ages 3-4: Toddler/Preschool
    "3-4": {
        themes: [
            { id: "animals", label: "🐻 Animal Friends", description: "Cute animals on fun adventures" },
            { id: "vehicles", label: "🚂 Trucks & Trains", description: "Vehicles that go vroom and zoom" },
            { id: "bedtime", label: "🌙 Bedtime Stories", description: "Gentle stories for sleepy time" },
            { id: "colors-shapes", label: "🌈 Colors & Shapes", description: "Learning about the world around us" },
            { id: "family", label: "👨‍👩‍👧‍👦 Family Fun", description: "Stories about mom, dad, and siblings" },
            { id: "playground", label: "🎪 Playground Adventures", description: "Fun at the park and playground" },
            { id: "silly", label: "🤪 Silly & Funny", description: "Giggles and silliness" },
            { id: "helpers", label: "👮 Community Helpers", description: "Police, firefighters, and doctors" }
        ],
        characteristics: {
            storyLength: "very-short", // 200-400 words
            vocabulary: "simple",
            illustrations: "essential",
            repetition: "high",
            concepts: ["basic counting", "colors", "emotions", "daily routines"]
        }
    },

    // Ages 5-6: Kindergarten/Early Elementary
    "5-6": {
        themes: [
            { id: "dinosaurs", label: "🦕 Dinosaur Discovery", description: "Prehistoric adventures" },
            { id: "fairy-tales", label: "🧚 Fairy Tales", description: "Magic and wonder" },
            { id: "school", label: "🎒 School Adventures", description: "Making friends at school" },
            { id: "superheroes", label: "🦸 Everyday Heroes", description: "Being brave and kind" },
            { id: "nature", label: "🌳 Nature Explorers", description: "Discovering the outdoors" },
            { id: "pets", label: "🐶 Pet Pals", description: "Adventures with furry friends" },
            { id: "pirates", label: "🏴‍☠️ Pirate Treasure", description: "Sailing the seven seas" },
            { id: "space", label: "🚀 Space Explorers", description: "Blast off to adventure" },
            { id: "bugs", label: "🐛 Bug Buddies", description: "Tiny creatures, big adventures" },
            { id: "princesses-knights", label: "👑 Castles & Crowns", description: "Royal adventures" }
        ],
        characteristics: {
            storyLength: "short", // 400-600 words
            vocabulary: "expanding",
            illustrations: "important",
            morals: "simple",
            concepts: ["friendship", "sharing", "problem-solving", "emotions"]
        }
    },

    // Ages 7-8: Early Elementary
    "7-8": {
        themes: [
            { id: "mystery", label: "🔍 Mystery Detectives", description: "Solve puzzles and find clues" },
            { id: "dragons", label: "🐉 Dragon Adventures", description: "Magical dragon friends" },
            { id: "sports", label: "⚽ Sports Champions", description: "Teamwork and winning" },
            { id: "ocean", label: "🌊 Ocean Explorers", description: "Underwater adventures" },
            { id: "inventions", label: "🔬 Young Inventors", description: "Creating cool gadgets" },
            { id: "time-travel", label: "⏰ Time Travelers", description: "Journey through history" },
            { id: "friendship", label: "👫 Friendship Adventures", description: "Best friends forever" },
            { id: "gross-funny", label: "💩 Gross & Goofy", description: "Silly and yucky fun" },
            { id: "ninjas", label: "🥷 Ninja Training", description: "Secret ninja missions" },
            { id: "magic-school", label: "✨ Magic Academy", description: "Learning magical powers" }
        ],
        characteristics: {
            storyLength: "medium", // 600-800 words
            vocabulary: "grade-appropriate",
            chapters: "optional",
            humor: "important",
            concepts: ["bravery", "loyalty", "consequences", "diversity"]
        }
    },

    // Ages 9-10: Upper Elementary
    "9-10": {
        themes: [
            { id: "adventure-quest", label: "🗺️ Epic Quests", description: "Heroes on important missions" },
            { id: "mythology", label: "⚡ Myths & Legends", description: "Gods, heroes, and monsters" },
            { id: "survival", label: "🏕️ Survival Stories", description: "Overcoming challenges" },
            { id: "secret-agent", label: "🕵️ Secret Agents", description: "Spy missions and gadgets" },
            { id: "science-fiction", label: "🤖 Sci-Fi Adventures", description: "Robots and future worlds" },
            { id: "magical-creatures", label: "🦄 Magical Creatures", description: "Unicorns, phoenixes, and more" },
            { id: "environmental", label: "🌍 Planet Protectors", description: "Saving the environment" },
            { id: "gaming", label: "🎮 Video Game Worlds", description: "Inside the game adventures" },
            { id: "paranormal", label: "👻 Paranormal Mysteries", description: "Ghosts and supernatural" },
            { id: "stem", label: "🧬 Science Adventures", description: "Cool science experiments" }
        ],
        characteristics: {
            storyLength: "long", // 800-1200 words
            vocabulary: "challenging",
            plotTwists: true,
            worldBuilding: "detailed",
            concepts: ["identity", "justice", "perseverance", "ethical choices"]
        }
    },

    // Ages 11-12: Middle School/Tween
    "11-12": {
        themes: [
            { id: "dystopian", label: "🏙️ Dystopian Futures", description: "Surviving in changed worlds" },
            { id: "romance-adventure", label: "💕 First Crush Adventures", description: "Romance meets adventure" },
            { id: "horror-lite", label: "😱 Scary Stories", description: "Spooky but not too scary" },
            { id: "social-media", label: "📱 Digital Life", description: "Online friends and drama" },
            { id: "fantasy-epic", label: "🗡️ Fantasy Epics", description: "Complex magical worlds" },
            { id: "real-life", label: "🎭 Real Life Drama", description: "School and friend problems" },
            { id: "conspiracy", label: "🔐 Secret Societies", description: "Hidden organizations and mysteries" },
            { id: "superpowers", label: "⚡ Discovering Powers", description: "Finding hidden abilities" },
            { id: "time-loop", label: "🔄 Time Paradox", description: "Stuck in time loops" },
            { id: "alternate-reality", label: "🌐 Parallel Worlds", description: "Multiple dimensions" }
        ],
        characteristics: {
            storyLength: "very-long", // 1200-1500 words
            vocabulary: "advanced",
            romance: "age-appropriate",
            themes: "mature",
            concepts: ["identity crisis", "peer pressure", "social justice", "self-discovery"]
        }
    },

    // Ages 13+: Young Teen
    "13+": {
        themes: [
            { id: "dystopian-rebellion", label: "✊ Revolution Stories", description: "Fighting oppressive systems" },
            { id: "romance", label: "💘 Teen Romance", description: "Love and relationships" },
            { id: "thriller", label: "🎬 Psychological Thrillers", description: "Mind-bending suspense" },
            { id: "urban-fantasy", label: "🌃 Urban Fantasy", description: "Magic in modern cities" },
            { id: "coming-of-age", label: "🌟 Coming of Age", description: "Finding yourself" },
            { id: "social-issues", label: "⚖️ Social Justice", description: "Making a difference" },
            { id: "dark-academia", label: "📚 Dark Academia", description: "Mysterious schools and secrets" },
            { id: "apocalyptic", label: "🔥 Post-Apocalyptic", description: "After the world ends" },
            { id: "mental-health", label: "🧠 Mental Health Journey", description: "Understanding emotions" },
            { id: "lgbtq", label: "🏳️‍🌈 LGBTQ+ Stories", description: "Diverse identities and love" }
        ],
        characteristics: {
            storyLength: "unlimited", // 1500+ words
            vocabulary: "sophisticated",
            romance: "realistic",
            themes: "complex",
            concepts: ["moral ambiguity", "social responsibility", "identity exploration", "complex relationships"]
        }
    }
};

// Gender-inclusive alternatives (can be mixed with age-appropriate themes)
const GenderNeutralEnhancements = {
    // Instead of strictly "boy" or "girl" themes, offer these modifiers
    actionLevel: {
        high: ["fast-paced", "action-packed", "thrilling"],
        medium: ["adventurous", "exciting", "mysterious"],
        low: ["thoughtful", "emotional", "character-driven"]
    },
    
    storyStyle: {
        competitive: ["winning", "champions", "competition"],
        collaborative: ["teamwork", "friendship", "cooperation"],
        solo: ["independence", "self-discovery", "personal journey"]
    },
    
    emotionalDepth: {
        light: ["fun", "humorous", "silly"],
        moderate: ["meaningful", "touching", "inspiring"],
        deep: ["complex", "thought-provoking", "emotional"]
    }
};

// Special interest modifiers that can be applied to any age group
const SpecialInterests = {
    stem: {
        label: "STEM Focus",
        modifiers: ["robots", "coding", "experiments", "inventions", "space"]
    },
    sports: {
        label: "Sports & Competition",
        modifiers: ["soccer", "basketball", "dance", "gymnastics", "martial arts"]
    },
    arts: {
        label: "Creative Arts",
        modifiers: ["music", "painting", "theater", "writing", "crafts"]
    },
    nature: {
        label: "Nature & Animals",
        modifiers: ["wildlife", "conservation", "pets", "farming", "exploration"]
    },
    culture: {
        label: "World Cultures",
        modifiers: ["travel", "languages", "traditions", "food", "celebrations"]
    }
};

// Trending topics for 2024-2025
const TrendingTopics2024 = {
    allAges: [
        "environmental heroes",
        "digital citizenship",
        "mindfulness and emotions",
        "diverse families",
        "problem-solving"
    ],
    elementary: [
        "graphic novel style",
        "STEM adventures",
        "kindness challenges",
        "cultural celebrations"
    ],
    middleGrade: [
        "social media reality",
        "climate action",
        "mental health awareness",
        "gender identity",
        "online vs real friends"
    ],
    teen: [
        "AI and technology ethics",
        "social activism",
        "complex identities",
        "global connections",
        "future careers"
    ]
};

// Function to get appropriate themes based on age
function getThemesForAge(age) {
    if (age <= 4) return DynamicThemesConfig["3-4"];
    if (age <= 6) return DynamicThemesConfig["5-6"];
    if (age <= 8) return DynamicThemesConfig["7-8"];
    if (age <= 10) return DynamicThemesConfig["9-10"];
    if (age <= 12) return DynamicThemesConfig["11-12"];
    return DynamicThemesConfig["13+"];
}

// Function to enhance themes based on preferences
function enhanceThemesWithPreferences(themes, preferences = {}) {
    const enhanced = [...themes];
    
    // Add action-oriented variants if preferred
    if (preferences.actionLevel === 'high') {
        enhanced.forEach(theme => {
            theme.description = `Action-packed ${theme.description.toLowerCase()}`;
        });
    }
    
    // Add special interests
    if (preferences.specialInterest) {
        const interest = SpecialInterests[preferences.specialInterest];
        if (interest) {
            enhanced.forEach(theme => {
                theme.keywords = [...(theme.keywords || []), ...interest.modifiers];
            });
        }
    }
    
    return enhanced;
}

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DynamicThemesConfig,
        GenderNeutralEnhancements,
        SpecialInterests,
        TrendingTopics2024,
        getThemesForAge,
        enhanceThemesWithPreferences
    };
}

// Make available globally for browser use
window.DynamicThemes = {
    config: DynamicThemesConfig,
    enhancements: GenderNeutralEnhancements,
    interests: SpecialInterests,
    trending: TrendingTopics2024,
    getThemesForAge,
    enhanceThemesWithPreferences
};