// Netlify Function for AI Image Generation
// Handles image generation requests with various API providers

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS request for CORS
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
        const { prompt, style, mood, tier = 'free' } = JSON.parse(event.body);

        // Validate input
        if (!prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt is required' })
            };
        }

        // Child safety filter - ensure prompts are appropriate
        const safetyKeywords = ['violence', 'scary', 'horror', 'death', 'blood'];
        const promptLower = prompt.toLowerCase();
        if (safetyKeywords.some(keyword => promptLower.includes(keyword))) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt contains inappropriate content for children' })
            };
        }

        let imageUrl;
        let imageData = {
            prompt,
            style,
            mood,
            tier,
            timestamp: new Date().toISOString()
        };

        // Handle different tiers
        console.log('Processing tier:', tier);
        console.log('Environment vars available:', {
            hasReplicate: !!process.env.REPLICATE_API_TOKEN,
            hasOpenAI: !!process.env.OPENAI_API_KEY,
            hasPexels: !!process.env.PEXELS_API_KEY
        });
        
        // Map new tier names to image generation methods
        if (tier === 'ai-enabled' || tier === 'pro' || 
            tier === 'family-plus' || tier === 'story-maker-basic' || 
            tier === 'movie-director-premium' || tier === 'plus' || 
            tier === 'premium' || tier === 'basic') {
            // AI-enabled tiers: Use AI image generation (Replicate or OpenAI)
            imageUrl = await generateAIImage(prompt, style, mood, tier);
            imageData.isAI = true;
        } else if (tier === 'standard' || tier === 'reader-free' || tier === 'try-now' || tier === 'free') {
            // Free/Standard tier: Use low-cost dall-e-2 with 256x256
            // Pass tier to generateAIImage which will use dall-e-2 for non-paid tiers
            imageUrl = await generateAIImage(prompt, style, mood, tier);
            imageData.isAI = true;
            imageData.lowRes = true;
        } else {
            // Fallback: Basic placeholder images
            imageUrl = await generatePlaceholderImage(prompt, style, mood);
            imageData.isPlaceholder = true;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                url: imageUrl,
                ...imageData
            })
        };

    } catch (error) {
        console.error('Image generation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Image generation failed',
                fallback: true 
            })
        };
    }
};

// AI Image Generation (using Replicate or OpenAI with tier-based settings)
async function generateAIImage(prompt, style, mood, tier) {
    // Add tier marker to prompt for downstream processing
    const isPaidTier = ['ai-enabled', 'pro', 'family-plus', 'story-maker-basic', 
                        'movie-director-premium', 'plus', 'premium', 'basic'].includes(tier);
    
    const tierMarker = isPaidTier ? '__PAID__' : '';
    const enhancedPrompt = enhancePrompt(prompt, style, mood) + ' ' + tierMarker;
    console.log(`Generating AI image for ${tier} tier with prompt:`, enhancedPrompt.substring(0, 100));
    
    // Option 1: Replicate API (Stable Diffusion)
    if (process.env.REPLICATE_API_TOKEN) {
        console.log('Using Replicate API for AI generation');
        try {
            // Use the latest SDXL model for better quality
            const response = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
                    input: {
                        prompt: enhancedPrompt,
                        negative_prompt: 'nsfw, adult, violence, scary, dark, horror, gore, blood',
                        width: 1024,
                        height: 1024,
                        num_outputs: 1,
                        guidance_scale: 7.5,
                        num_inference_steps: 25,
                        scheduler: 'K_EULER'
                    }
                })
            });

            console.log('Replicate API response status:', response.status);
            
            if (response.ok) {
                const prediction = await response.json();
                console.log('Prediction created, ID:', prediction.id);
                
                // Poll for completion
                let result = await pollPrediction(prediction.id);
                if (result && result.output && result.output[0]) {
                    console.log('AI image generated successfully');
                    return result.output[0];
                }
            } else {
                const errorText = await response.text();
                console.error('Replicate API error response:', errorText);
            }
        } catch (error) {
            console.error('Replicate API error:', error.message);
        }
    } else {
        console.log('Replicate API token not configured');
    }

    // Option 2: OpenAI DALL-E API (tier-based configuration)
    if (process.env.OPENAI_API_KEY) {
        try {
            // Determine model and size based on tier (passed from parent function)
            const isPaidTier = enhancedPrompt.includes('__PAID__');
            const model = isPaidTier ? 'dall-e-3' : 'dall-e-2';
            const size = isPaidTier ? '1024x1024' : '256x256';
            
            // Remove tier marker from prompt
            const cleanPrompt = enhancedPrompt.replace('__PAID__', '').trim();
            
            const requestBody = {
                model: model,
                prompt: cleanPrompt,
                n: 1,
                size: size
            };
            
            // Only dall-e-3 supports quality and style parameters
            if (model === 'dall-e-3') {
                requestBody.quality = 'standard';
                requestBody.style = style === 'cartoon' ? 'vivid' : 'natural';
            }
            
            console.log(`Using ${model} with ${size} resolution for image generation`);
            
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data[0]) {
                    // Return URL as-is, watermark is handled by CSS on client side
                    const imageUrl = data.data[0].url;
                    return imageUrl;
                }
            }
        } catch (error) {
            console.error('OpenAI API error:', error);
        }
    }

    // Fallback to high-quality illustration service
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(prompt)}&size=1024`;
}

// Poll Replicate prediction status
async function pollPrediction(id) {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            }
        });
        
        const prediction = await response.json();
        
        if (prediction.status === 'succeeded') {
            return prediction;
        } else if (prediction.status === 'failed') {
            throw new Error('Prediction failed');
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }
    
    throw new Error('Prediction timeout');
}

// Generate high-quality stock images
async function generateStockImage(prompt, style, mood) {
    const keywords = extractKeywords(prompt);
    console.log('Generating stock image with keywords:', keywords);
    
    // Pexels API (free tier available)
    if (process.env.PEXELS_API_KEY) {
        console.log('Using Pexels API for stock photos');
        try {
            const query = [...keywords, 'children', 'illustration', mood].join(' ');
            console.log('Pexels search query:', query);
            
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=square`,
                {
                    headers: {
                        'Authorization': process.env.PEXELS_API_KEY
                    }
                }
            );

            console.log('Pexels API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Pexels returned', data.photos?.length || 0, 'photos');
                
                if (data.photos && data.photos.length > 0) {
                    // Return a random photo from the results
                    const photo = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
                    console.log('Selected photo from Pexels');
                    return photo.src.large2x || photo.src.large;
                }
            } else {
                const errorText = await response.text();
                console.error('Pexels API error response:', errorText);
            }
        } catch (error) {
            console.error('Pexels API error:', error.message);
        }
    } else {
        console.log('Pexels API key not configured');
    }

    // Unsplash API (requires access key)
    if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
            const query = [...keywords, 'kids', style].join(' ');
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=squarish`,
                {
                    headers: {
                        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const photo = data.results[Math.floor(Math.random() * Math.min(5, data.results.length))];
                    return photo.urls.regular;
                }
            }
        } catch (error) {
            console.error('Unsplash API error:', error);
        }
    }

    // Fallback to Lorem Picsum - reliable, no CORS issues
    // Using a seeded random based on prompt for consistency
    const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    console.log('Falling back to Lorem Picsum with seed:', seed);
    return `https://picsum.photos/seed/${seed}/1024/1024`;
}

// Generate placeholder images for free tier
async function generatePlaceholderImage(prompt, style, mood) {
    const keywords = extractKeywords(prompt);
    
    // Use Lorem Picsum for consistent, CORS-friendly placeholders
    const seed = prompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    
    // Add some variety based on style
    if (style === 'cartoon' || style === 'animated') {
        // Use avatar generator for cartoon style
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&size=1024&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    
    // Use Lorem Picsum for photo-style images (no CORS issues)
    const numericSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://picsum.photos/seed/${numericSeed}/1024/1024`;
}

// Enhance prompt for better AI generation
function enhancePrompt(prompt, style, mood) {
    const styleMap = {
        cartoon: 'cartoon style, vibrant colors, child-friendly, animated, fun',
        watercolor: 'watercolor painting, soft colors, artistic, gentle brushstrokes',
        digital: 'digital art, modern illustration, clean lines, bright colors',
        storybook: 'children\'s book illustration, whimsical, detailed, magical',
        realistic: 'photorealistic, high quality, detailed, professional'
    };

    const moodMap = {
        happy: 'joyful, cheerful, bright, positive atmosphere',
        adventurous: 'exciting, dynamic, action-packed, exploration',
        calm: 'peaceful, serene, gentle, soothing',
        magical: 'enchanting, mystical, sparkles, fantasy elements',
        funny: 'humorous, silly, playful, amusing'
    };

    return `${prompt}, ${styleMap[style] || style}, ${moodMap[mood] || mood}, suitable for children, safe content, no violence, bright lighting, positive`;
}

// Extract keywords from prompt
function extractKeywords(prompt) {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were'];
    
    const words = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Return unique keywords
    return [...new Set(words)].slice(0, 5);
}