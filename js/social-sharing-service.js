// Social Sharing Service for KidsStoryTime
// File: js/social-sharing-service.js

class SocialSharingService {
    constructor() {
        this.isInitialized = false;
        this.shareCount = 0;
        this.init();
    }

    init() {
        this.loadShareHistory();
        this.isInitialized = true;
        console.log('Social Sharing Service initialized');
    }

    /**
     * Load share history from storage
     */
    loadShareHistory() {
        const history = localStorage.getItem('shareHistory');
        if (history) {
            const parsed = JSON.parse(history);
            this.shareCount = parsed.count || 0;
        }
    }

    /**
     * Generate shareable story image
     */
    async generateStoryImage(story) {
        try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions (Instagram-friendly square)
            canvas.width = 1080;
            canvas.height = 1080;
            
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add decorative elements
            this.drawDecorations(ctx, canvas.width, canvas.height);
            
            // Add KidsStoryTime logo/branding
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('KidsStoryTime.org', canvas.width / 2, 100);
            
            // Add story title
            ctx.font = 'bold 64px Arial';
            ctx.fillStyle = '#FFD700';
            const title = story.title || 'My Amazing Story';
            this.wrapText(ctx, title, canvas.width / 2, 250, canvas.width - 100, 70);
            
            // Add story excerpt
            ctx.font = '36px Arial';
            ctx.fillStyle = 'white';
            const excerpt = this.getStoryExcerpt(story.content);
            this.wrapText(ctx, excerpt, canvas.width / 2, 500, canvas.width - 150, 45);
            
            // Add child's name if available
            if (story.metadata && story.metadata.childName) {
                ctx.font = 'bold 42px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`Starring: ${story.metadata.childName}`, canvas.width / 2, 800);
            }
            
            // Add hashtag
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText('#StoryStarMoments', canvas.width / 2, 950);
            
            // Add star decorations
            this.drawStars(ctx, canvas.width, canvas.height);
            
            // Convert canvas to blob
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });
            
        } catch (error) {
            console.error('Error generating story image:', error);
            return null;
        }
    }

    /**
     * Draw decorative elements
     */
    drawDecorations(ctx, width, height) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'white';
        
        // Draw circles
        ctx.beginPath();
        ctx.arc(100, 100, 150, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width - 100, height - 100, 200, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }

    /**
     * Draw star decorations
     */
    drawStars(ctx, width, height) {
        const starPositions = [
            { x: 150, y: 850 },
            { x: width - 150, y: 850 },
            { x: 100, y: 400 },
            { x: width - 100, y: 400 }
        ];
        
        ctx.fillStyle = '#FFD700';
        starPositions.forEach(pos => {
            this.drawStar(ctx, pos.x, pos.y, 30, 5);
        });
    }

    /**
     * Draw a star shape
     */
    drawStar(ctx, cx, cy, outerRadius, points) {
        const innerRadius = outerRadius / 2;
        ctx.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = cx + Math.cos(angle - Math.PI / 2) * radius;
            const y = cy + Math.sin(angle - Math.PI / 2) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Wrap text to fit within width
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    /**
     * Get story excerpt for sharing
     */
    getStoryExcerpt(content) {
        if (!content) return 'An amazing personalized story...';
        
        // Get first 100 characters
        const excerpt = content.substring(0, 150);
        
        // Find last complete word
        const lastSpace = excerpt.lastIndexOf(' ');
        return excerpt.substring(0, lastSpace) + '...';
    }

    /**
     * Share story with #StoryStarMoments
     */
    async shareStory(story, platform = 'general') {
        try {
            // Generate story image
            const imageBlob = await this.generateStoryImage(story);
            
            // Create share content
            const shareText = this.createShareText(story);
            const shareUrl = 'https://kidsstorytime.org';
            
            // Check if Web Share API is available
            if (navigator.share && imageBlob) {
                // Use native share with image
                const file = new File([imageBlob], 'story.png', { type: 'image/png' });
                
                try {
                    await navigator.share({
                        title: story.title,
                        text: shareText,
                        url: shareUrl,
                        files: [file]
                    });
                    
                    // Award stars for sharing
                    await this.onShareSuccess();
                    return true;
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.log('Share cancelled');
                        return false;
                    }
                    // Fallback to text-only share
                }
            }
            
            // Fallback for specific platforms
            if (platform === 'twitter' || platform === 'x') {
                this.shareToTwitter(shareText, shareUrl);
            } else if (platform === 'facebook') {
                this.shareToFacebook(shareUrl);
            } else if (platform === 'instagram') {
                this.shareToInstagram(imageBlob);
            } else if (platform === 'tiktok') {
                this.shareToTikTok(shareText);
            } else {
                // Fallback: copy to clipboard
                await this.copyToClipboard(shareText, shareUrl);
            }
            
            // Award stars for sharing
            await this.onShareSuccess();
            return true;
            
        } catch (error) {
            console.error('Error sharing story:', error);
            this.showShareError();
            return false;
        }
    }

    /**
     * Create share text with hashtag
     */
    createShareText(story) {
        const childName = story.metadata?.childName || 'My child';
        const storyTheme = story.metadata?.theme || 'adventure';
        
        const templates = [
            `${childName} was thrilled to be the hero of their own ${storyTheme} story! 🌟 #StoryStarMoments`,
            `Just created an amazing personalized story for ${childName}! They loved it! 📚✨ #StoryStarMoments`,
            `${childName}'s reaction to their custom story was priceless! 😊 #StoryStarMoments`,
            `Making bedtime magical with personalized stories! ${childName} can't wait for the next one! 🌙 #StoryStarMoments`
        ];
        
        // Pick random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template;
    }

    /**
     * Share to Twitter/X
     */
    shareToTwitter(text, url) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }

    /**
     * Share to Facebook
     */
    shareToFacebook(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
    }

    /**
     * Share to Instagram (show instructions)
     */
    shareToInstagram(imageBlob) {
        // Instagram doesn't have a web share API
        // Show instructions modal
        this.showInstagramInstructions(imageBlob);
    }

    /**
     * Share to TikTok (show instructions)
     */
    shareToTikTok(text) {
        // TikTok web sharing is limited
        // Show instructions modal
        this.showTikTokInstructions(text);
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text, url) {
        const fullText = `${text}\n\n${url}`;
        
        try {
            await navigator.clipboard.writeText(fullText);
            this.showCopySuccess();
        } catch (error) {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = fullText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopySuccess();
        }
    }

    /**
     * Handle successful share
     */
    async onShareSuccess() {
        // Update share count
        this.shareCount++;
        const history = {
            count: this.shareCount,
            lastShare: new Date().toISOString()
        };
        localStorage.setItem('shareHistory', JSON.stringify(history));
        
        // Award stars
        if (window.starPointsService) {
            await window.starPointsService.awardShareStars();
        }
        
        // Track analytics
        if (window.analyticsService) {
            window.analyticsService.trackEvent('Social', 'story_shared', '#StoryStarMoments');
        }
        
        // Show success message
        this.showShareSuccess();
    }

    /**
     * Show share success message
     */
    showShareSuccess() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideUp 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 32px;">🎉</span>
                <div>
                    <div style="font-weight: bold; font-size: 18px;">Story Shared!</div>
                    <div style="font-size: 14px; opacity: 0.9;">Thank you for spreading the magic!</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 4000);
        
        // Add animation styles if not present
        if (!document.getElementById('shareAnimations')) {
            const style = document.createElement('style');
            style.id = 'shareAnimations';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show copy success message
     */
    showCopySuccess() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            z-index: 10000;
        `;
        
        notification.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <div style="font-weight: bold;">Copied to Clipboard!</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">Paste it on your favorite social media</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    /**
     * Show Instagram instructions
     */
    showInstagramInstructions(imageBlob) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Create image URL for download
        const imageUrl = URL.createObjectURL(imageBlob);
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3 style="color: #E4405F; margin-bottom: 20px;">📸 Share on Instagram</h3>
                
                <img src="${imageUrl}" style="width: 100%; max-width: 300px; border-radius: 10px; margin-bottom: 20px;">
                
                <ol style="text-align: left; color: #666; line-height: 1.8;">
                    <li>Download the image above</li>
                    <li>Open Instagram app</li>
                    <li>Create a new post or story</li>
                    <li>Upload the downloaded image</li>
                    <li>Add caption with <strong>#StoryStarMoments</strong></li>
                    <li>Share with your followers!</li>
                </ol>
                
                <a href="${imageUrl}" download="story-star-moment.png" 
                   style="display: inline-block;
                          background: linear-gradient(135deg, #E4405F, #C13584);
                          color: white;
                          padding: 12px 30px;
                          border-radius: 25px;
                          text-decoration: none;
                          font-weight: bold;
                          margin: 15px 5px;">
                    Download Image
                </a>
                
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #666;
                               color: white;
                               border: none;
                               padding: 12px 30px;
                               border-radius: 25px;
                               cursor: pointer;
                               margin: 15px 5px;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Show TikTok instructions
     */
    showTikTokInstructions(text) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3 style="color: #000; margin-bottom: 20px;">🎵 Share on TikTok</h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="color: #666; font-style: italic;">"${text}"</p>
                </div>
                
                <ol style="text-align: left; color: #666; line-height: 1.8;">
                    <li>Open TikTok app</li>
                    <li>Create a new video</li>
                    <li>Record your child's reaction to their story</li>
                    <li>Add the text above as caption</li>
                    <li>Include <strong>#StoryStarMoments</strong></li>
                    <li>Share your video!</li>
                </ol>
                
                <button onclick="navigator.clipboard.writeText('${text}')" 
                        style="background: #000;
                               color: white;
                               border: none;
                               padding: 12px 30px;
                               border-radius: 25px;
                               cursor: pointer;
                               font-weight: bold;
                               margin: 15px 5px;">
                    Copy Caption
                </button>
                
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #666;
                               color: white;
                               border: none;
                               padding: 12px 30px;
                               border-radius: 25px;
                               cursor: pointer;
                               margin: 15px 5px;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Show share error
     */
    showShareError() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
        `;
        
        notification.innerHTML = `
            <div>Unable to share. Please try again.</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Create global instance
window.socialSharingService = new SocialSharingService();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialSharingService;
}