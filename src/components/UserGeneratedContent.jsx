import { useState, useEffect } from 'react';
import { addStarsToChild } from './StarRewardsSystem';
import './UserGeneratedContent.css';

function UserGeneratedContent({ childProfile, user, onClose, onStarsEarned }) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'share', 'my-content'
  const [featuredStories, setFeaturedStories] = useState([]);
  const [userContent, setUserContent] = useState([]);
  const [newReview, setNewReview] = useState({
    storyTitle: '',
    rating: 5,
    review: '',
    childAge: '',
    favoriteTheme: '',
    parentTip: ''
  });
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: 'all',
    theme: 'all',
    rating: 'all'
  });
  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    loadFeaturedContent();
    loadUserContent();
  }, []);

  const loadFeaturedContent = () => {
    // Load featured community content (in real app, this would come from a database)
    const mockFeaturedStories = [
      {
        id: 1,
        title: "Luna's Space Adventure",
        childName: "Emma",
        parentName: "Sarah M.",
        rating: 5,
        review: "Emma absolutely loves this story! She asks for it every night and has started drawing pictures of Luna and her spaceship. It's sparked such creativity!",
        theme: "space",
        ageGroup: "4-6",
        parentTip: "Try using different voices for each character - kids love it!",
        likes: 23,
        helpful: 18,
        dateShared: "2025-01-15",
        featured: true
      },
      {
        id: 2,
        title: "The Magical Garden Adventure",
        childName: "Oliver",
        parentName: "Mike D.",
        rating: 5,
        review: "Perfect bedtime story! Oliver is usually hyperactive at bedtime, but this story calms him down and he falls asleep peacefully. The nature theme is beautiful.",
        theme: "nature",
        ageGroup: "5-7",
        parentTip: "We read this right after brushing teeth - perfect timing for winding down.",
        likes: 31,
        helpful: 25,
        dateShared: "2025-01-14",
        featured: true
      },
      {
        id: 3,
        title: "Detective Maya's Mystery",
        childName: "Sophia",
        parentName: "Jennifer L.",
        rating: 4,
        review: "Sophia loves solving mysteries with Maya! She tries to guess what happens next. Great for developing critical thinking skills.",
        theme: "mystery",
        ageGroup: "6-8",
        parentTip: "Pause and ask 'What do you think happens next?' - makes it interactive!",
        likes: 19,
        helpful: 14,
        dateShared: "2025-01-13",
        featured: true
      },
      {
        id: 4,
        title: "Fluffy's Farm Day",
        childName: "Lucas",
        parentName: "Amanda R.",
        rating: 5,
        review: "Lucas has been asking to visit a real farm ever since we started reading this! He's learned so many animal sounds and facts.",
        theme: "animals",
        ageGroup: "3-5",
        parentTip: "Great for teaching animal sounds - Lucas moos along with the cows!",
        likes: 27,
        helpful: 22,
        dateShared: "2025-01-12",
        featured: true
      }
    ];
    setFeaturedStories(mockFeaturedStories);
  };

  const loadUserContent = () => {
    if (!childProfile) return;
    
    const savedContent = JSON.parse(localStorage.getItem(`userContent_${childProfile.id}`) || '[]');
    setUserContent(savedContent);
  };

  const handleSubmitReview = () => {
    if (!newReview.storyTitle || !newReview.review) {
      alert('Please fill in the story title and review.');
      return;
    }

    const reviewData = {
      id: Date.now(),
      ...newReview,
      childName: childProfile.name,
      parentName: user.email.split('@')[0], // Use email prefix as parent name
      dateShared: new Date().toISOString().split('T')[0],
      likes: 0,
      helpful: 0,
      status: 'pending' // Would be reviewed by moderators
    };

    // Save to user's content
    const existingContent = JSON.parse(localStorage.getItem(`userContent_${childProfile.id}`) || '[]');
    const updatedContent = [reviewData, ...existingContent];
    localStorage.setItem(`userContent_${childProfile.id}`, JSON.stringify(updatedContent));
    setUserContent(updatedContent);

    // Award stars for sharing
    const starsEarned = 15;
    const newTotal = addStarsToChild(childProfile.id, starsEarned, 'Shared a story review with the community!');
    
    if (onStarsEarned) {
      onStarsEarned(newTotal);
    }

    // Reset form
    setNewReview({
      storyTitle: '',
      rating: 5,
      review: '',
      childAge: '',
      favoriteTheme: '',
      parentTip: ''
    });

    setShowSubmissionForm(false);
    setSubmissionStatus('success');
    setTimeout(() => setSubmissionStatus(null), 3000);

    // Switch to "My Content" tab to show the new submission
    setActiveTab('my-content');
  };

  const handleLike = (storyId) => {
    // In a real app, this would update the database
    setFeaturedStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, likes: story.likes + 1 }
        : story
    ));
  };

  const handleHelpful = (storyId) => {
    // In a real app, this would update the database
    setFeaturedStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, helpful: story.helpful + 1 }
        : story
    ));
  };

  const getFilteredStories = () => {
    return featuredStories.filter(story => {
      if (filters.ageGroup !== 'all' && story.ageGroup !== filters.ageGroup) return false;
      if (filters.theme !== 'all' && story.theme !== filters.theme) return false;
      if (filters.rating !== 'all' && story.rating < parseInt(filters.rating)) return false;
      return true;
    });
  };

  const ageGroups = [
    { value: 'all', label: 'All Ages' },
    { value: '2-4', label: '2-4 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '4-6', label: '4-6 years' },
    { value: '5-7', label: '5-7 years' },
    { value: '6-8', label: '6-8 years' },
    { value: '7-9', label: '7-9 years' }
  ];

  const themes = [
    { value: 'all', label: 'All Themes' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'animals', label: 'Animals' },
    { value: 'space', label: 'Space' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'nature', label: 'Nature' },
    { value: 'fairytale', label: 'Fairy Tale' }
  ];

  return (
    <div className="ugc-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <div className="header-content">
            <h2>🌟 Community Stories</h2>
            <p>Discover amazing stories and share your favorites!</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <span className="tab-icon">🔍</span>
            Browse Stories
          </button>
          <button 
            className={`tab-btn ${activeTab === 'share' ? 'active' : ''}`}
            onClick={() => setActiveTab('share')}
          >
            <span className="tab-icon">✨</span>
            Share Review
          </button>
          <button 
            className={`tab-btn ${activeTab === 'my-content' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-content')}
          >
            <span className="tab-icon">📚</span>
            My Reviews ({userContent.length})
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="browse-content">
            <div className="filters">
              <select 
                value={filters.ageGroup} 
                onChange={(e) => setFilters({...filters, ageGroup: e.target.value})}
                className="filter-select"
              >
                {ageGroups.map(age => (
                  <option key={age.value} value={age.value}>{age.label}</option>
                ))}
              </select>
              <select 
                value={filters.theme} 
                onChange={(e) => setFilters({...filters, theme: e.target.value})}
                className="filter-select"
              >
                {themes.map(theme => (
                  <option key={theme.value} value={theme.value}>{theme.label}</option>
                ))}
              </select>
              <select 
                value={filters.rating} 
                onChange={(e) => setFilters({...filters, rating: e.target.value})}
                className="filter-select"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <div className="stories-grid">
              {getFilteredStories().map(story => (
                <div key={story.id} className="story-card">
                  <div className="story-header">
                    <h3 className="story-title">{story.title}</h3>
                    <div className="story-rating">
                      {[...Array(story.rating)].map((_, i) => (
                        <span key={i} className="star">⭐</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="story-meta">
                    <span className="child-info">For {story.childName} ({story.ageGroup})</span>
                    <span className="theme-tag">{story.theme}</span>
                  </div>
                  
                  <div className="story-review">
                    <p>"{story.review}"</p>
                  </div>
                  
                  {story.parentTip && (
                    <div className="parent-tip">
                      <strong>💡 Parent Tip:</strong> {story.parentTip}
                    </div>
                  )}
                  
                  <div className="story-footer">
                    <span className="author">- {story.parentName}</span>
                    <div className="story-actions">
                      <button 
                        className="action-btn like-btn"
                        onClick={() => handleLike(story.id)}
                      >
                        ❤️ {story.likes}
                      </button>
                      <button 
                        className="action-btn helpful-btn"
                        onClick={() => handleHelpful(story.id)}
                      >
                        👍 {story.helpful}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="share-content">
            <div className="share-intro">
              <h3>Share Your Experience</h3>
              <p>Help other parents discover amazing stories! Earn 15 stars for each review. ⭐</p>
            </div>

            <div className="submission-form">
              <div className="form-row">
                <label className="form-label">Story Title *</label>
                <input
                  type="text"
                  value={newReview.storyTitle}
                  onChange={(e) => setNewReview({...newReview, storyTitle: e.target.value})}
                  placeholder="Enter the story title"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label className="form-label">Rating *</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                      onClick={() => setNewReview({...newReview, rating: star})}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Your Review *</label>
                <textarea
                  value={newReview.review}
                  onChange={(e) => setNewReview({...newReview, review: e.target.value})}
                  placeholder="Tell other parents what you and your child loved about this story..."
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-row-group">
                <div className="form-row">
                  <label className="form-label">Child's Age</label>
                  <select
                    value={newReview.childAge}
                    onChange={(e) => setNewReview({...newReview, childAge: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select age</option>
                    <option value="2-3">2-3 years</option>
                    <option value="3-4">3-4 years</option>
                    <option value="4-5">4-5 years</option>
                    <option value="5-6">5-6 years</option>
                    <option value="6-7">6-7 years</option>
                    <option value="7-8">7-8 years</option>
                    <option value="8+">8+ years</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Story Theme</label>
                  <select
                    value={newReview.favoriteTheme}
                    onChange={(e) => setNewReview({...newReview, favoriteTheme: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select theme</option>
                    <option value="adventure">Adventure</option>
                    <option value="animals">Animals</option>
                    <option value="space">Space</option>
                    <option value="mystery">Mystery</option>
                    <option value="nature">Nature</option>
                    <option value="fairytale">Fairy Tale</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Parent Tip (Optional)</label>
                <input
                  type="text"
                  value={newReview.parentTip}
                  onChange={(e) => setNewReview({...newReview, parentTip: e.target.value})}
                  placeholder="Share a tip for other parents (e.g., 'Great for calming hyperactive kids')"
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="submit-btn"
                  onClick={handleSubmitReview}
                >
                  Submit Review (+15 ⭐)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-content' && (
          <div className="my-content">
            <div className="content-header">
              <h3>Your Shared Reviews</h3>
              <p>Thank you for contributing to our community!</p>
            </div>

            {userContent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No reviews shared yet</h4>
                <p>Share your first story review to help other families discover great stories!</p>
                <button 
                  className="cta-btn"
                  onClick={() => setActiveTab('share')}
                >
                  Share Your First Review
                </button>
              </div>
            ) : (
              <div className="user-reviews">
                {userContent.map(review => (
                  <div key={review.id} className="user-review-card">
                    <div className="review-header">
                      <h4>{review.storyTitle}</h4>
                      <div className="review-rating">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i} className="star">⭐</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="review-content">
                      <p>"{review.review}"</p>
                      {review.parentTip && (
                        <div className="tip">
                          <strong>💡 Your Tip:</strong> {review.parentTip}
                        </div>
                      )}
                    </div>
                    
                    <div className="review-meta">
                      <span className="status">
                        {review.status === 'pending' && '⏳ Under Review'}
                        {review.status === 'approved' && '✅ Approved'}
                        {review.status === 'featured' && '🌟 Featured'}
                      </span>
                      <span className="date">Shared {review.dateShared}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success notification */}
        {submissionStatus === 'success' && (
          <div className="success-notification">
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <h3>Review Submitted!</h3>
              <p>Thank you for sharing! You earned 15 stars. Your review will be reviewed and published soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserGeneratedContent;

