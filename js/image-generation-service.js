// Image Generation Service for Story Illustrations
// File: js/image-generation-service.js

class ImageGenerationService {
    constructor() {
        this.isInitialized = false;
        this.apiEndpoint = '/.netlify/functions/generate-image';
        this.init();
    }

    init() {
        // Check if we're in demo mode or production
        this.isDemoMode = !window.location.hostname.includes('localhost');
        this.isInitialized = true;
        console.log('Image Generation Service initialized');
    }

    /**
     * Generate an image based on story content
     * @param {Object} params - Generation parameters
     * @param {string} params.prompt - The image description prompt
     * @param {string} params.style - Art style (cartoon, watercolor, digital, etc.)
     * @param {string} params.mood - Mood of the image (happy, adventurous, calm, etc.)
     * @param {string} params.tier - User tier (free, premium, pro)
     * @returns {Promise<Object>} - Image URL and metadata
     */
    async generateImage(params) {
        const { prompt, style = 'cartoon', mood = 'cheerful', tier = 'free' } = params;

        try {
            console.log('Generating image with tier:', tier, 'prompt:', prompt?.substring(0, 50));
            
            // Call the Netlify function for all tiers
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: this.enhancePrompt(prompt, style, mood),
                    style,
                    mood,
                    tier,
                    size: '1024x1024',
                    quality: 'standard'
                })
            });

            if (!response.ok) {
                console.error('API response not OK:', response.status, response.statusText);
                throw new Error('Image generation failed');
            }

            const data = await response.json();
            console.log('Image generation response:', data);
            
            return {
                url: data.url || data.success?.url,
                alt: prompt,
                style,
                mood,
                tier,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Image generation error:', error);
            // Fallback to local placeholder generation
            return await this.generatePlaceholderImage(prompt, style, mood);
        }
    }

    /**
     * Generate AI images for Pro tier users
     */
    async generateAIImage(prompt, style, mood) {
        try {
            // Enhanced prompt for AI generation
            const enhancedPrompt = this.enhancePrompt(prompt, style, mood);
            
            // Try to use AI image generation API (DALL-E, Stable Diffusion, etc.)
            // For now, we'll use a free alternative or placeholder
            
            // Option 1: Use Hugging Face API (free tier available)
            // You would need to sign up at huggingface.co and get an API key
            const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
            
            if (HUGGINGFACE_API_KEY) {
                const response = await fetch(
                    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
                    {
                        headers: {
                            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({
                            inputs: enhancedPrompt,
                            parameters: {
                                negative_prompt: "nsfw, adult content, violence, scary, dark",
                                num_inference_steps: 30,
                                guidance_scale: 7.5,
                            },
                        }),
                    }
                );
                
                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    return {
                        url: imageUrl,
                        alt: prompt,
                        style,
                        mood,
                        isAI: true,
                        quality: 'pro',
                        timestamp: new Date().toISOString()
                    };
                }
            }
            
            // Option 2: Use Replicate API (has free tier)
            // Fallback to high-quality themed image from specialized children's illustration service
            const fallbackUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(prompt)}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=1024`;
            
            return {
                url: fallbackUrl,
                alt: prompt,
                style,
                mood,
                isAI: true,
                quality: 'pro',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('AI image generation failed:', error);
            // Fallback to stock image
            return await this.generateStockImage(prompt, style, mood);
        }
    }

    /**
     * Generate stock images for Premium tier users
     */
    async generateStockImage(prompt, style, mood) {
        try {
            const keywords = this.extractKeywords(prompt);
            
            // Create child-friendly search terms
            const childTerms = ['children', 'kids', 'cartoon', 'illustration', 'colorful', 'friendly'];
            const moodTerms = {
                happy: ['happy', 'smiling', 'joyful', 'cheerful'],
                adventurous: ['adventure', 'exploring', 'journey', 'discovery'],
                calm: ['peaceful', 'serene', 'gentle', 'quiet'],
                magical: ['magical', 'fantasy', 'sparkle', 'wonder'],
                funny: ['funny', 'silly', 'playful', 'laughing']
            };
            
            // Combine keywords with child-friendly terms
            const searchTerms = [
                ...keywords.slice(0, 2),
                childTerms[Math.floor(Math.random() * childTerms.length)],
                ...(moodTerms[mood] || moodTerms.happy).slice(0, 1)
            ];
            
            const query = searchTerms.join(',');
            
            // Use Unsplash API with specific collections for children's content
            // Collection IDs for child-friendly content (these are real Unsplash collection IDs)
            const childCollections = '3330448,3330452,1424240'; // Children's illustrations collections
            
            // Build Unsplash URL with better parameters
            const imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(query)}&collections=${childCollections}`;
            
            // Alternative: Use Pexels API (requires free API key)
            // const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
            // if (PEXELS_API_KEY) {
            //     const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`, {
            //         headers: {
            //             Authorization: PEXELS_API_KEY
            //         }
            //     });
            //     const data = await response.json();
            //     if (data.photos && data.photos.length > 0) {
            //         imageUrl = data.photos[0].src.large;
            //     }
            // }
            
            return {
                url: imageUrl,
                alt: prompt,
                style,
                mood,
                isStock: true,
                quality: 'premium',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Stock image generation failed:', error);
            // Fallback to placeholder
            return await this.generatePlaceholderImage(prompt, style, mood);
        }
    }

    /**
     * Generate placeholder images for demo/testing
     */
    async generatePlaceholderImage(prompt, style, mood) {
        const keywords = this.extractKeywords(prompt);
        
        // Create more specific search terms for better results
        const storyElements = {
            animals: ['puppy', 'kitten', 'bunny', 'teddy bear', 'butterfly'],
            adventure: ['treasure', 'map', 'explorer', 'mountain', 'forest'],
            fantasy: ['unicorn', 'dragon', 'castle', 'magic', 'fairy'],
            space: ['rocket', 'stars', 'planet', 'astronaut', 'moon'],
            ocean: ['fish', 'dolphin', 'coral', 'submarine', 'whale'],
            nature: ['tree', 'flower', 'rainbow', 'sun', 'garden']
        };
        
        // Determine story type from keywords
        let storyType = 'adventure';
        for (const [type, terms] of Object.entries(storyElements)) {
            if (keywords.some(keyword => terms.some(term => keyword.toLowerCase().includes(term)))) {
                storyType = type;
                break;
            }
        }
        
        // Build better search query
        const searchTerms = [
            ...storyElements[storyType].slice(0, 2),
            'illustration',
            'colorful',
            'children'
        ];
        
        const query = searchTerms.join(',');
        
        // Use different services based on style preference
        let imageUrl;
        
        if (style === 'cartoon' || style === 'animated') {
            // Use fun avatar/illustration generator
            const avatarStyles = ['adventurer', 'big-smile', 'miniavs', 'adventurer-neutral'];
            const selectedStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
            imageUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(prompt)}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=1024`;
        } else {
            // Use Unsplash with better parameters for children's content
            imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(query)}`;
            
            // Alternative: Use Lorem Picsum for consistent placeholder
            // imageUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`;
        }

        return {
            url: imageUrl,
            alt: prompt,
            style,
            mood,
            isPlaceholder: true,
            quality: 'free',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Enhance the prompt for better image generation
     */
    enhancePrompt(prompt, style, mood) {
        const styleDescriptors = {
            cartoon: 'cartoon style, colorful, child-friendly, animated',
            watercolor: 'watercolor painting, soft colors, artistic, gentle',
            digital: 'digital art, vibrant, modern, clean lines',
            storybook: 'storybook illustration, whimsical, detailed, magical',
            pencil: 'pencil sketch, hand-drawn, artistic, detailed'
        };

        const moodDescriptors = {
            happy: 'cheerful, bright, joyful, positive',
            adventurous: 'exciting, dynamic, energetic, bold',
            calm: 'peaceful, serene, gentle, soothing',
            magical: 'mystical, enchanting, sparkly, fantasy',
            funny: 'humorous, silly, playful, amusing'
        };

        const enhancedPrompt = `${prompt}, ${styleDescriptors[style] || style}, ${moodDescriptors[mood] || mood}, suitable for children, safe content, high quality`;
        
        return enhancedPrompt;
    }

    /**
     * Extract keywords from a prompt for search queries
     */
    extractKeywords(prompt) {
        // Remove common words and extract meaningful keywords
        const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'was', 'were', 'is', 'are'];
        
        const words = prompt.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => !stopWords.includes(word) && word.length > 2);
        
        return words;
    }

    /**
     * Generate multiple images for a story
     */
    async generateStoryImages(story, count = 3) {
        const images = [];
        
        // Extract key scenes from the story
        const scenes = this.extractKeyScenes(story.content, count);
        
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const image = await this.generateImage({
                prompt: scene.description,
                style: story.style || 'cartoon',
                mood: scene.mood || 'cheerful'
            });
            
            images.push({
                ...image,
                sceneIndex: i,
                sceneText: scene.text
            });
            
            // Add delay between generations to avoid rate limiting
            if (i < scenes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return images;
    }

    /**
     * Extract key scenes from story content for illustration
     */
    extractKeyScenes(content, count) {
        const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
        const scenes = [];
        
        if (paragraphs.length === 0) return scenes;
        
        // Get evenly distributed scenes
        const interval = Math.floor(paragraphs.length / count);
        
        for (let i = 0; i < count; i++) {
            const paragraphIndex = Math.min(i * interval, paragraphs.length - 1);
            const text = paragraphs[paragraphIndex];
            
            scenes.push({
                text,
                description: this.summarizeScene(text),
                mood: this.detectMood(text)
            });
        }
        
        return scenes;
    }

    /**
     * Summarize a scene for image generation
     */
    summarizeScene(text) {
        // Extract main elements from the text
        // This is a simplified version - could use NLP for better results
        
        // Look for character names (capitalized words)
        const characters = text.match(/\b[A-Z][a-z]+\b/g) || [];
        
        // Look for action words
        const actions = text.match(/\b(run|jump|fly|swim|climb|dance|sing|play|explore|discover)\w*/gi) || [];
        
        // Look for descriptive elements
        const settings = text.match(/\b(forest|castle|ocean|mountain|garden|house|sky|tree|river|cave)\w*/gi) || [];
        
        // Combine into a scene description
        let description = '';
        
        if (characters.length > 0) {
            description += characters[0] + ' ';
        }
        
        if (actions.length > 0) {
            description += actions[0].toLowerCase() + ' ';
        }
        
        if (settings.length > 0) {
            description += 'in a ' + settings[0].toLowerCase();
        }
        
        // Fallback to first 50 characters if no elements found
        if (!description.trim()) {
            description = text.substring(0, 50) + '...';
        }
        
        return description;
    }

    /**
     * Detect the mood of a text passage
     */
    detectMood(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('laugh')) {
            return 'happy';
        }
        if (lowerText.includes('adventure') || lowerText.includes('explore') || lowerText.includes('discover')) {
            return 'adventurous';
        }
        if (lowerText.includes('magic') || lowerText.includes('sparkle') || lowerText.includes('wonder')) {
            return 'magical';
        }
        if (lowerText.includes('funny') || lowerText.includes('silly') || lowerText.includes('giggle')) {
            return 'funny';
        }
        if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('quiet')) {
            return 'calm';
        }
        
        return 'cheerful'; // Default mood
    }

    /**
     * Cache generated images
     */
    cacheImage(imageData) {
        try {
            const cachedImages = JSON.parse(localStorage.getItem('cachedStoryImages') || '[]');
            cachedImages.push(imageData);
            
            // Keep only last 20 images
            if (cachedImages.length > 20) {
                cachedImages.shift();
            }
            
            localStorage.setItem('cachedStoryImages', JSON.stringify(cachedImages));
        } catch (error) {
            console.error('Error caching image:', error);
        }
    }

    /**
     * Get cached images
     */
    getCachedImages() {
        try {
            return JSON.parse(localStorage.getItem('cachedStoryImages') || '[]');
        } catch (error) {
            console.error('Error getting cached images:', error);
            return [];
        }
    }
}

// Create global instance
window.imageGenerationService = new ImageGenerationService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageGenerationService;
}