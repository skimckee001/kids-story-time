import { useState, useEffect } from 'react';
import './StarRewardsSystem.css';

// Define reward items
const REWARDS = [
  // Themes & Styles
  { id: 'theme_superhero', name: 'Superhero Theme', description: 'Unlock superhero story themes', cost: 50, category: 'themes', icon: '🦸' },
  { id: 'theme_dinosaur', name: 'Dinosaur Theme', description: 'Unlock dinosaur adventure stories', cost: 50, category: 'themes', icon: '🦕' },
  { id: 'theme_pirate', name: 'Pirate Theme', description: 'Unlock pirate adventure stories', cost: 50, category: 'themes', icon: '🏴‍☠️' },
  { id: 'theme_unicorn', name: 'Unicorn Theme', description: 'Unlock magical unicorn stories', cost: 50, category: 'themes', icon: '🦄' },
  { id: 'theme_space', name: 'Space Adventure', description: 'Unlock space exploration stories', cost: 45, category: 'themes', icon: '🚀' },
  { id: 'theme_ocean', name: 'Ocean Explorer', description: 'Unlock underwater adventures', cost: 45, category: 'themes', icon: '🌊' },
  
  // Avatars & Badges
  { id: 'avatar_wizard', name: 'Wizard Avatar', description: 'Magical wizard profile picture', cost: 30, category: 'avatars', icon: '🧙‍♂️' },
  { id: 'avatar_princess', name: 'Princess Avatar', description: 'Royal princess profile picture', cost: 30, category: 'avatars', icon: '👸' },
  { id: 'avatar_astronaut', name: 'Astronaut Avatar', description: 'Space explorer profile picture', cost: 30, category: 'avatars', icon: '👨‍🚀' },
  { id: 'avatar_dragon', name: 'Dragon Avatar', description: 'Mighty dragon profile picture', cost: 40, category: 'avatars', icon: '🐲' },
  { id: 'avatar_robot', name: 'Robot Avatar', description: 'Futuristic robot profile', cost: 35, category: 'avatars', icon: '🤖' },
  
  // Story Boosts
  { id: 'boost_extra_story', name: 'Extra Story', description: 'Get one extra story today', cost: 20, category: 'boosts', icon: '📚', consumable: true },
  { id: 'boost_longer_story', name: 'Epic Story', description: 'Create an extra-long story', cost: 25, category: 'boosts', icon: '📖', consumable: true },
  { id: 'boost_ai_image', name: 'AI Illustration', description: 'Get AI-generated image for one story', cost: 35, category: 'boosts', icon: '🎨', consumable: true },
  { id: 'boost_voice_pack', name: 'Voice Pack', description: 'Unlock premium narrator voices', cost: 60, category: 'boosts', icon: '🎙️' },
  
  // Backgrounds & Frames
  { id: 'frame_golden', name: 'Golden Frame', description: 'Prestigious golden story frame', cost: 45, category: 'frames', icon: '🖼️' },
  { id: 'frame_rainbow', name: 'Rainbow Frame', description: 'Colorful rainbow story frame', cost: 35, category: 'frames', icon: '🌈' },
  { id: 'bg_space', name: 'Space Background', description: 'Cosmic space theme for library', cost: 40, category: 'frames', icon: '🌌' },
  { id: 'bg_forest', name: 'Forest Background', description: 'Enchanted forest theme', cost: 40, category: 'frames', icon: '🌲' },
  
  // Special Powers
  { id: 'power_name_sparkle', name: 'Sparkle Name', description: 'Your name sparkles in stories', cost: 25, category: 'powers', icon: '✨' },
  { id: 'power_sound_effects', name: 'Sound Effects', description: 'Add sound effects to stories', cost: 55, category: 'powers', icon: '🔊' },
  { id: 'power_story_music', name: 'Background Music', description: 'Magical music for your stories', cost: 70, category: 'powers', icon: '🎵' },
  { id: 'power_share_boost', name: 'Share Boost', description: 'Get extra stars when sharing stories', cost: 80, category: 'powers', icon: '🚀' }
];

function StarRewardsSystem({ childProfile, stars, setStars, onClose }) {
  const [ownedRewards, setOwnedRewards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');

  useEffect(() => {
    loadOwnedRewards();
  }, [childProfile]);

  const loadOwnedRewards = () => {
    if (!childProfile?.id) return;
    
    const savedRewards = localStorage.getItem(`rewards_${childProfile.id}`);
    if (savedRewards) {
      setOwnedRewards(JSON.parse(savedRewards));
    }
  };

  const handlePurchase = (reward) => {
    if (stars < reward.cost) {
      setPurchaseMessage('Not enough stars! Keep reading to earn more!');
      setSelectedReward(reward);
      setShowPurchaseModal(true);
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseMessage('');
      }, 3000);
      return;
    }

    setSelectedReward(reward);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    if (!selectedReward || !childProfile?.id) return;
    
    // Deduct stars
    const newStarCount = stars - selectedReward.cost;
    setStars(newStarCount);
    localStorage.setItem(`stars_${childProfile.id}`, newStarCount.toString());
    
    // Add to owned rewards (if not consumable)
    if (!selectedReward.consumable) {
      const updatedRewards = [...ownedRewards, selectedReward.id];
      setOwnedRewards(updatedRewards);
      localStorage.setItem(`rewards_${childProfile.id}`, JSON.stringify(updatedRewards));
    } else {
      // Handle consumable rewards
      const consumables = JSON.parse(localStorage.getItem(`consumables_${childProfile.id}`) || '{}');
      consumables[selectedReward.id] = (consumables[selectedReward.id] || 0) + 1;
      localStorage.setItem(`consumables_${childProfile.id}`, JSON.stringify(consumables));
    }
    
    // Show success message
    setPurchaseMessage(`🎉 You got ${selectedReward.name}!`);
    setTimeout(() => {
      setShowPurchaseModal(false);
      setPurchaseMessage('');
      setSelectedReward(null);
    }, 2000);
    
    // Track achievement
    checkRewardAchievements();
  };

  const checkRewardAchievements = () => {
    // This could trigger achievements for first purchase, big spender, etc.
    const purchaseCount = ownedRewards.length + 1;
    if (purchaseCount === 1) {
      console.log('First reward purchased!');
    }
    if (purchaseCount === 5) {
      console.log('Reward collector achievement!');
    }
  };

  const getFilteredRewards = () => {
    if (selectedCategory === 'all') return REWARDS;
    if (selectedCategory === 'owned') {
      return REWARDS.filter(r => ownedRewards.includes(r.id));
    }
    return REWARDS.filter(r => r.category === selectedCategory);
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return REWARDS.length;
    if (category === 'owned') return ownedRewards.length;
    return REWARDS.filter(r => r.category === category).length;
  };

  const filteredRewards = getFilteredRewards();

  return (
    <div className="rewards-system">
      <div className="rewards-content">
        <div className="rewards-header">
          <h2>⭐ Star Rewards Shop</h2>
          <button className="close-btn" onClick={onClose} style={{position: 'absolute', right: '20px', top: '20px'}}>✕</button>
        </div>

        <div className="rewards-body">
          {/* Star Balance */}
          <div className="star-balance">
          <div className="balance-display">
            <span className="balance-icon">⭐</span>
            <span className="balance-value">{stars}</span>
            <span className="balance-label">Stars Available</span>
          </div>
          <div className="earning-tip">
            💡 Tip: Read stories daily to earn more stars!
          </div>
        </div>

        {/* How to Earn Stars */}
        <div className="earn-stars-section">
          <h3>How to Earn Stars</h3>
          <div className="earn-methods">
            <div className="earn-method">
              <span className="method-icon">📖</span>
              <span>Complete a story (+10 ⭐)</span>
            </div>
            <div className="earn-method">
              <span className="method-icon">🔥</span>
              <span>Daily streak (+5 ⭐ per day)</span>
            </div>
            <div className="earn-method">
              <span className="method-icon">🏆</span>
              <span>Unlock achievement (+15 ⭐)</span>
            </div>
            <div className="earn-method">
              <span className="method-icon">🎯</span>
              <span>Complete goals (+20 ⭐)</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="rewards-filters">
          <button 
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All ({getCategoryCount('all')})
          </button>
          <button 
            className={selectedCategory === 'owned' ? 'active' : ''}
            onClick={() => setSelectedCategory('owned')}
          >
            My Rewards ({getCategoryCount('owned')})
          </button>
          <button 
            className={selectedCategory === 'themes' ? 'active' : ''}
            onClick={() => setSelectedCategory('themes')}
          >
            Themes
          </button>
          <button 
            className={selectedCategory === 'avatars' ? 'active' : ''}
            onClick={() => setSelectedCategory('avatars')}
          >
            Avatars
          </button>
          <button 
            className={selectedCategory === 'boosts' ? 'active' : ''}
            onClick={() => setSelectedCategory('boosts')}
          >
            Boosts
          </button>
          <button 
            className={selectedCategory === 'frames' ? 'active' : ''}
            onClick={() => setSelectedCategory('frames')}
          >
            Frames
          </button>
          <button 
            className={selectedCategory === 'powers' ? 'active' : ''}
            onClick={() => setSelectedCategory('powers')}
          >
            Powers
          </button>
        </div>

        {/* Rewards Grid */}
        <div className="rewards-grid">
          {filteredRewards.map(reward => {
            const isOwned = ownedRewards.includes(reward.id);
            const canAfford = stars >= reward.cost;
            
            return (
              <div 
                key={reward.id} 
                className={`reward-card ${isOwned ? 'owned' : ''} ${!canAfford && !isOwned ? 'locked' : ''}`}
              >
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-info">
                  <h3>{reward.name}</h3>
                  <p>{reward.description}</p>
                  {reward.consumable && (
                    <span className="consumable-badge">Consumable</span>
                  )}
                </div>
                <div className="reward-footer">
                  {isOwned ? (
                    <button className="owned-btn" disabled>
                      ✓ Owned
                    </button>
                  ) : (
                    <>
                      <div className="reward-cost">
                        <span className="cost-icon">⭐</span>
                        <span className="cost-value">{reward.cost}</span>
                      </div>
                      <button 
                        className={`purchase-btn ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                        onClick={() => handlePurchase(reward)}
                      >
                        {canAfford ? 'Get' : 'Need More'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredRewards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🌟</div>
            <h3>No rewards found</h3>
            <p>
              {selectedCategory === 'owned' 
                ? "You haven't purchased any rewards yet. Start shopping!"
                : "Check back later for new rewards!"}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedReward && (
        <div className="purchase-modal">
          <div className="modal-content">
            {purchaseMessage ? (
              <>
                <div className="modal-icon">{purchaseMessage.includes('🎉') ? '🎉' : '😔'}</div>
                <p className="modal-message">{purchaseMessage}</p>
              </>
            ) : (
              <>
                <div className="modal-icon">{selectedReward.icon}</div>
                <h3>Purchase {selectedReward.name}?</h3>
                <p>This will cost {selectedReward.cost} ⭐ stars</p>
                <div className="modal-actions">
                  <button onClick={() => setShowPurchaseModal(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button onClick={confirmPurchase} className="confirm-btn">
                    Purchase
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export helper function to add stars
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