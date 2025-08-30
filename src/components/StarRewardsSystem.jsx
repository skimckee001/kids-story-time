import { useState, useEffect } from 'react';
import './StarRewardsSystem.css';

function StarRewardsSystem({ childProfile, onRewardUnlocked }) {
  const [stars, setStars] = useState(0);
  const [unlockedRewards, setUnlockedRewards] = useState([]);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [animationReward, setAnimationReward] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Define rewards catalog
  const rewards = [
    // Themes
    {
      id: 'theme_space',
      name: 'Space Adventure Theme',
      category: 'themes',
      cost: 50,
      icon: '🚀',
      description: 'Unlock space-themed story backgrounds',
      type: 'theme'
    },
    {
      id: 'theme_ocean',
      name: 'Ocean Explorer Theme',
      category: 'themes',
      cost: 50,
      icon: '🌊',
      description: 'Unlock underwater story themes',
      type: 'theme'
    },
    {
      id: 'theme_rainbow',
      name: 'Rainbow Magic Theme',
      category: 'themes',
      cost: 75,
      icon: '🌈',
      description: 'Unlock magical rainbow themes',
      type: 'theme'
    },
    {
      id: 'theme_dinosaur',
      name: 'Dinosaur World Theme',
      category: 'themes',
      cost: 60,
      icon: '🦕',
      description: 'Unlock prehistoric adventures',
      type: 'theme'
    },
    
    // Avatars
    {
      id: 'avatar_astronaut',
      name: 'Astronaut Avatar',
      category: 'avatars',
      cost: 30,
      icon: '👨‍🚀',
      description: 'Become a space explorer',
      type: 'avatar'
    },
    {
      id: 'avatar_princess',
      name: 'Princess Avatar',
      category: 'avatars',
      cost: 30,
      icon: '👸',
      description: 'Royal profile picture',
      type: 'avatar'
    },
    {
      id: 'avatar_superhero',
      name: 'Superhero Avatar',
      category: 'avatars',
      cost: 40,
      icon: '🦸',
      description: 'Be a super reader',
      type: 'avatar'
    },
    {
      id: 'avatar_wizard',
      name: 'Wizard Avatar',
      category: 'avatars',
      cost: 35,
      icon: '🧙',
      description: 'Magical reader avatar',
      type: 'avatar'
    },
    
    // Special Features
    {
      id: 'feature_voice',
      name: 'Special Voice Pack',
      category: 'features',
      cost: 100,
      icon: '🎤',
      description: 'Unlock special narration voices',
      type: 'feature'
    },
    {
      id: 'feature_music',
      name: 'Background Music',
      category: 'features',
      cost: 80,
      icon: '🎵',
      description: 'Add music to your stories',
      type: 'feature'
    },
    {
      id: 'feature_effects',
      name: 'Sound Effects Pack',
      category: 'features',
      cost: 70,
      icon: '🔊',
      description: 'Add fun sound effects',
      type: 'feature'
    },
    {
      id: 'feature_stickers',
      name: 'Story Stickers',
      category: 'features',
      cost: 45,
      icon: '⭐',
      description: 'Decorate your stories',
      type: 'feature'
    },
    
    // Badges
    {
      id: 'badge_gold_star',
      name: 'Gold Star Reader',
      category: 'badges',
      cost: 25,
      icon: '⭐',
      description: 'Show off your reading skills',
      type: 'badge'
    },
    {
      id: 'badge_bookworm',
      name: 'Bookworm Badge',
      category: 'badges',
      cost: 20,
      icon: '📚',
      description: 'For dedicated readers',
      type: 'badge'
    },
    {
      id: 'badge_creative',
      name: 'Creative Mind',
      category: 'badges',
      cost: 30,
      icon: '🎨',
      description: 'For imaginative storytellers',
      type: 'badge'
    }
  ];

  // Load saved data on mount
  useEffect(() => {
    if (childProfile?.id) {
      const savedStars = localStorage.getItem(`stars_${childProfile.id}`);
      const savedRewards = localStorage.getItem(`unlocked_rewards_${childProfile.id}`);
      
      if (savedStars) setStars(parseInt(savedStars));
      if (savedRewards) setUnlockedRewards(JSON.parse(savedRewards));
    }
  }, [childProfile]);

  // Save data when it changes
  useEffect(() => {
    if (childProfile?.id) {
      localStorage.setItem(`stars_${childProfile.id}`, stars.toString());
      localStorage.setItem(`unlocked_rewards_${childProfile.id}`, JSON.stringify(unlockedRewards));
    }
  }, [stars, unlockedRewards, childProfile]);

  // Handle reward purchase
  const purchaseReward = (reward) => {
    if (stars >= reward.cost && !unlockedRewards.includes(reward.id)) {
      setStars(prev => prev - reward.cost);
      setUnlockedRewards(prev => [...prev, reward.id]);
      
      // Show animation
      setAnimationReward(reward);
      setShowRewardAnimation(true);
      setTimeout(() => setShowRewardAnimation(false), 3000);
      
      // Notify parent component
      if (onRewardUnlocked) {
        onRewardUnlocked(reward);
      }
    }
  };

  // Add stars (called from parent when activities are completed)
  const addStars = (amount, reason) => {
    setStars(prev => prev + amount);
    
    // You could show a brief animation here
    console.log(`Earned ${amount} stars for: ${reason}`);
  };

  // Filter rewards by category
  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

  // Calculate total unlocked
  const totalUnlocked = unlockedRewards.length;
  const totalRewards = rewards.length;
  const progressPercent = (totalUnlocked / totalRewards) * 100;

  if (!childProfile) {
    return (
      <div className="star-rewards-container">
        <div className="no-profile-message">
          <span className="star-icon">⭐</span>
          <p>Select a child profile to view rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="star-rewards-container">
      {/* Header with star balance */}
      <div className="rewards-header">
        <div className="star-balance">
          <span className="star-icon-large">⭐</span>
          <div className="balance-info">
            <span className="balance-label">Your Stars</span>
            <span className="balance-amount">{stars}</span>
          </div>
        </div>
        
        <div className="rewards-progress">
          <div className="progress-label">
            Rewards Unlocked: {totalUnlocked}/{totalRewards}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* How to earn stars */}
      <div className="earn-stars-info">
        <h3>How to Earn Stars</h3>
        <div className="earn-methods">
          <div className="earn-method">
            <span className="method-icon">📖</span>
            <span className="method-text">Complete a story (+10 ⭐)</span>
          </div>
          <div className="earn-method">
            <span className="method-icon">🎯</span>
            <span className="method-text">Daily reading (+5 ⭐)</span>
          </div>
          <div className="earn-method">
            <span className="method-icon">🏆</span>
            <span className="method-text">Unlock achievement (+15 ⭐)</span>
          </div>
          <div className="earn-method">
            <span className="method-icon">🔥</span>
            <span className="method-text">7-day streak (+25 ⭐)</span>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="rewards-filters">
        <button 
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Rewards
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'themes' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('themes')}
        >
          🎨 Themes
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'avatars' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('avatars')}
        >
          👤 Avatars
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'features' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('features')}
        >
          ✨ Features
        </button>
        <button 
          className={`filter-btn ${selectedCategory === 'badges' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('badges')}
        >
          🏅 Badges
        </button>
      </div>

      {/* Rewards grid */}
      <div className="rewards-grid">
        {filteredRewards.map(reward => {
          const isUnlocked = unlockedRewards.includes(reward.id);
          const canAfford = stars >= reward.cost;
          
          return (
            <div 
              key={reward.id} 
              className={`reward-card ${isUnlocked ? 'unlocked' : ''} ${!canAfford && !isUnlocked ? 'locked' : ''}`}
            >
              <div className="reward-icon">{reward.icon}</div>
              <h4 className="reward-name">{reward.name}</h4>
              <p className="reward-description">{reward.description}</p>
              
              {isUnlocked ? (
                <div className="reward-status unlocked">
                  <span className="check-icon">✓</span> Unlocked
                </div>
              ) : (
                <div className="reward-purchase">
                  <span className="reward-cost">
                    {reward.cost} ⭐
                  </span>
                  <button 
                    className="purchase-btn"
                    onClick={() => purchaseReward(reward)}
                    disabled={!canAfford}
                  >
                    {canAfford ? 'Unlock' : 'Need More Stars'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reward unlock animation */}
      {showRewardAnimation && animationReward && (
        <div className="reward-animation-overlay">
          <div className="reward-animation">
            <div className="animation-icon">{animationReward.icon}</div>
            <h2>Reward Unlocked!</h2>
            <p>{animationReward.name}</p>
            <div className="sparkles">
              <span>✨</span>
              <span>⭐</span>
              <span>✨</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export a function to add stars from outside the component
export const addStarsToChild = (childId, amount, reason) => {
  const currentStars = parseInt(localStorage.getItem(`stars_${childId}`) || '0');
  const newTotal = currentStars + amount;
  localStorage.setItem(`stars_${childId}`, newTotal.toString());
  
  // Log the activity
  const activities = JSON.parse(localStorage.getItem(`star_activities_${childId}`) || '[]');
  activities.push({
    amount,
    reason,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(`star_activities_${childId}`, JSON.stringify(activities));
  
  return newTotal;
};

export default StarRewardsSystem;