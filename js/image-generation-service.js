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
     * @returns {Promise<Object>} - Image URL and metadata
     */
    async generateImage(params) {
        const { prompt, style = 'cartoon', mood = 'cheerful' } = params;

        try {
            // For demo/MVP, use a placeholder service
            // In production, this would call DALL-E, Stable Diffusion, or Midjourney API
            if (this.isDemoMode) {
                return await this.generatePlaceholderImage(prompt, style, mood);
            }

            // Production API call (when backend is ready)
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: this.enhancePrompt(prompt, style, mood),
                    style,
                    mood,
                    size: '1024x1024',
                    quality: 'standard'
                })
            });

            if (!response.ok) {
                throw new Error('Image generation failed');
            }

            const data = await response.json();
            return {
                url: data.url,
                alt: prompt,
                style,
                mood,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Image generation error:', error);
            // Fallback to placeholder
            return await this.generatePlaceholderImage(prompt, style, mood);
        }
    }

    /**
     * Generate placeholder images for demo/testing
     */
    async generatePlaceholderImage(prompt, style, mood) {
        // Use Unsplash or Lorem Picsum for placeholder images
        const keywords = this.extractKeywords(prompt);
        const query = keywords.slice(0, 3).join(',');
        
        // Use different placeholder services based on style
        let imageUrl;
        
        if (style === 'cartoon' || style === 'animated') {
            // Use a cartoon-style placeholder
            imageUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(prompt)}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=512`;
        } else {
            // Use Unsplash for more realistic images
            imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(query)},illustration,children`;
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            url: imageUrl,
            alt: prompt,
            style,
            mood,
            isPlaceholder: true,
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