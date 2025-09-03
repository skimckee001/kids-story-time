import { useState, useEffect } from 'react';
import { addStarsToChild } from './StarRewardsSystem';
import './SocialSharing.css';

function SocialSharing({ story, childProfile, onStarsEarned }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasSharedToday, setHasSharedToday] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (childProfile?.id) {
      // Check if child has shared today
      const today = new Date().toDateString();
      const sharedKey = `shared_${childProfile.id}_${today}`;
      const todayShared = localStorage.getItem(sharedKey);
      setHasSharedToday(!!todayShared);

      // Get total share count
      const shareData = JSON.parse(localStorage.getItem(`shares_${childProfile.id}`) || '{"total": 0, "history": []}');
      setShareCount(shareData.total || 0);
    }
  }, [childProfile]);

  const generateStoryImage = async () => {
    if (!story) return null;
    
    setIsGeneratingImage(true);
    try {
      // Create a shareable story card image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size for social media (Instagram square format)
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add decorative elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Title background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.roundRect(60, 150, canvas.width - 120, 200, 20);
      ctx.fill();
      
      // Story title
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // Word wrap the title
      const maxWidth = canvas.width - 160;
      const words = story.title.split(' ');
      const lines = [];
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      
      // Draw title lines
      const lineHeight = 60;
      const startY = 200 + (lines.length * lineHeight / 2);
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
      });
      
      // Child name
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText(`A story for ${story.childName || 'a special child'}`, canvas.width / 2, 420);
      
      // Story preview (first few words)
      const preview = story.content.split(' ').slice(0, 15).join(' ') + '...';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'left';
      
      // Wrap preview text
      const previewLines = wrapText(ctx, preview, 120, 600, canvas.width - 240, 32);
      previewLines.forEach((line, index) => {
        ctx.fillText(line, 120, 600 + (index * 32));
      });
      
      // Branding
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('KidsStoryTime.ai', canvas.width / 2, canvas.height - 100);
      
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('Create magical stories for your child', canvas.width / 2, canvas.height - 60);
      
      // Convert to blob
      return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 0.9);
      });
    } catch (error) {
      console.error('Error generating story image:', error);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `🌟 Check out this amazing story I created for ${story.childName || 'my child'}: "${story.title}" ✨\n\nCreate magical bedtime stories for your kids too!`;
    
    // Award stars for sharing (once per day)
    if (childProfile?.id && !hasSharedToday) {
      const starsEarned = 25;
      const newTotal = addStarsToChild(childProfile.id, starsEarned, 'Shared a story with friends!');
      
      // Mark as shared today
      const today = new Date().toDateString();
      const sharedKey = `shared_${childProfile.id}_${today}`;
      localStorage.setItem(sharedKey, 'true');
      setHasSharedToday(true);
      
      // Update total share count
      const shareData = JSON.parse(localStorage.getItem(`shares_${childProfile.id}`) || '{"total": 0, "history": []}');
      shareData.total = (shareData.total || 0) + 1;
      shareData.history = shareData.history || [];
      shareData.history.push({
        date: new Date().toISOString(),
        platform,
        storyTitle: story.title,
        starsEarned
      });
      // Keep only last 50 shares
      if (shareData.history.length > 50) {
        shareData.history = shareData.history.slice(-50);
      }
      localStorage.setItem(`shares_${childProfile.id}`, JSON.stringify(shareData));
      setShareCount(shareData.total);
      
      // Show thank you message
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
      
      // Notify parent component about stars earned
      if (onStarsEarned) {
        onStarsEarned(newTotal);
      }
    }
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=KidsStories,Bedtime,AI`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(`Amazing story: ${story.title}`)}&body=${encodeURIComponent(text + '\n\n' + url)}`,
      instagram: async () => {
        // Generate story image for Instagram
        const imageBlob = await generateStoryImage();
        if (imageBlob && navigator.share) {
          try {
            const file = new File([imageBlob], 'story-share.png', { type: 'image/png' });
            await navigator.share({
              title: story.title,
              text: `Check out this story: ${story.title}`,
              files: [file]
            });
          } catch (err) {
            console.log('Sharing cancelled or not supported');
            // Fallback: copy image to clipboard
            try {
              const item = new ClipboardItem({ 'image/png': imageBlob });
              await navigator.clipboard.write([item]);
              alert('Story image copied to clipboard! You can now paste it in Instagram.');
            } catch (clipErr) {
              alert('Unable to copy image. Please try a different sharing method.');
            }
          }
        } else {
          alert('Instagram sharing not available. Try copying the story link instead!');
        }
      },
      copy: async () => {
        try {
          await navigator.clipboard.writeText(text + '\n\n' + url);
          alert('Story link copied to clipboard!');
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text + '\n\n' + url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Story link copied to clipboard!');
        }
      }
    };

    if (typeof shareUrls[platform] === 'function') {
      await shareUrls[platform]();
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
    
    setShowShareMenu(false);
  };

  const getShareButtonText = () => {
    if (hasSharedToday) {
      return '📤 Share Again';
    }
    return '📤 Share (+25 ⭐)';
  };

  const getShareMenuTitle = () => {
    if (hasSharedToday) {
      return 'Share this amazing story!';
    }
    return 'Share & Earn 25 Stars! ⭐';
  };

  return (
    <div className="social-sharing">
      <div className="share-dropdown">
        <button 
          onClick={() => setShowShareMenu(!showShareMenu)} 
          className="share-btn"
          title={hasSharedToday ? 'Share this story' : 'Share to earn 25 stars!'}
        >
          {getShareButtonText()}
        </button>
        
        {showShareMenu && (
          <div className="share-menu">
            <div className="share-menu-header">
              <h4>{getShareMenuTitle()}</h4>
              {shareCount > 0 && (
                <p className="share-stats">You've shared {shareCount} stories! 🎉</p>
              )}
            </div>
            
            <div className="share-options">
              <button 
                onClick={() => handleShare('facebook')} 
                className="share-option facebook"
              >
                <span className="share-icon">📘</span>
                <span>Facebook</span>
              </button>
              
              <button 
                onClick={() => handleShare('twitter')} 
                className="share-option twitter"
              >
                <span className="share-icon">🐦</span>
                <span>Twitter</span>
              </button>
              
              <button 
                onClick={() => handleShare('whatsapp')} 
                className="share-option whatsapp"
              >
                <span className="share-icon">💬</span>
                <span>WhatsApp</span>
              </button>
              
              <button 
                onClick={() => handleShare('instagram')} 
                className="share-option instagram"
                disabled={isGeneratingImage}
              >
                <span className="share-icon">📸</span>
                <span>{isGeneratingImage ? 'Generating...' : 'Instagram'}</span>
              </button>
              
              <button 
                onClick={() => handleShare('email')} 
                className="share-option email"
              >
                <span className="share-icon">✉️</span>
                <span>Email</span>
              </button>
              
              <button 
                onClick={() => handleShare('copy')} 
                className="share-option copy"
              >
                <span className="share-icon">📋</span>
                <span>Copy Link</span>
              </button>
            </div>
            
            {!hasSharedToday && (
              <div className="share-reward-info">
                <p>🌟 Earn 3 stars for your first share today!</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Thank you message */}
      {showThankYou && (
        <div className="share-thank-you">
          <div className="thank-you-content">
            <div className="thank-you-stars">⭐⭐⭐</div>
            <h3>Thank you for sharing!</h3>
            <p>You earned 3 stars! Keep sharing stories to inspire other families. 🌟</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialSharing;
