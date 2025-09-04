import { useState, useEffect } from 'react';
import { addStarsToChild } from './StarRewardsSystem';
import './ReferralProgram.css';

function ReferralProgram({ childProfile, user, onClose, onStarsEarned }) {
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalStarsEarned: 0
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmails, setInviteEmails] = useState(['']);
  const [inviteMessage, setInviteMessage] = useState('');
  const [recentReferrals, setRecentReferrals] = useState([]);

  useEffect(() => {
    if (user && childProfile) {
      generateReferralCode();
      loadReferralStats();
    }
  }, [user, childProfile]);

  const generateReferralCode = () => {
    // Generate unique referral code based on user ID and child profile
    const baseCode = `${user.id.slice(0, 4)}${childProfile.id.slice(0, 4)}`.toUpperCase();
    const suffix = childProfile.name.slice(0, 2).toUpperCase();
    const code = `${baseCode}${suffix}`;
    setReferralCode(code);
  };

  const loadReferralStats = () => {
    const stats = JSON.parse(localStorage.getItem(`referralStats_${childProfile.id}`) || '{}');
    const referrals = JSON.parse(localStorage.getItem(`referrals_${childProfile.id}`) || '[]');
    
    setReferralStats({
      totalReferrals: referrals.length,
      successfulReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalStarsEarned: stats.totalStarsEarned || 0
    });
    
    setRecentReferrals(referrals.slice(-5).reverse()); // Last 5 referrals
  };

  const copyReferralCode = async () => {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    const shareText = `🌟 Join me on KidsStoryTime.ai! Create magical bedtime stories for your kids with AI. Use my code ${referralCode} for bonus stars! ${referralUrl}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    const subject = encodeURIComponent("Amazing Bedtime Stories for Your Kids!");
    const body = encodeURIComponent(`Hi!

I've been using KidsStoryTime.ai to create amazing personalized bedtime stories for ${childProfile.name}, and I think your kids would love it too!

✨ AI-generated stories personalized for your child
📚 Thousands of themes and characters
🎙️ Read-aloud narration
🏆 Fun achievements and rewards

Use my referral code ${referralCode} when you sign up and we'll both get bonus stars!

Check it out: ${referralUrl}

Happy reading!`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    const text = encodeURIComponent(`🌟 Check out KidsStoryTime.ai! I've been creating magical bedtime stories for ${childProfile.name}. Use code ${referralCode} for bonus stars! ${referralUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaFacebook = () => {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    const text = encodeURIComponent(`Creating amazing bedtime stories for ${childProfile.name} with KidsStoryTime.ai! Join us with code ${referralCode}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${text}`, '_blank');
  };

  const addEmailField = () => {
    if (inviteEmails.length < 5) {
      setInviteEmails([...inviteEmails, '']);
    }
  };

  const removeEmailField = (index) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails.length > 0 ? newEmails : ['']);
  };

  const updateEmail = (index, value) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const sendInvites = () => {
    const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length === 0) {
      alert('Please enter at least one valid email address.');
      return;
    }

    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    const customMessage = inviteMessage || `Hi! I've been using KidsStoryTime.ai to create amazing personalized bedtime stories for ${childProfile.name}, and I think your kids would love it too!`;
    
    const subject = encodeURIComponent("You're invited: Amazing Bedtime Stories for Your Kids!");
    const body = encodeURIComponent(`${customMessage}

✨ AI-generated stories personalized for your child
📚 Thousands of themes and characters
🎙️ Read-aloud narration
🏆 Fun achievements and rewards

Use my referral code ${referralCode} when you sign up and we'll both get bonus stars!

Check it out: ${referralUrl}

Happy reading!`);

    // Track the invites
    const newReferrals = validEmails.map(email => ({
      id: Date.now() + Math.random(),
      email,
      code: referralCode,
      status: 'invited',
      invitedAt: new Date().toISOString(),
      method: 'email'
    }));

    const existingReferrals = JSON.parse(localStorage.getItem(`referrals_${childProfile.id}`) || '[]');
    const updatedReferrals = [...existingReferrals, ...newReferrals];
    localStorage.setItem(`referrals_${childProfile.id}`, JSON.stringify(updatedReferrals));

    // Open email client
    window.location.href = `mailto:${validEmails.join(',')}?subject=${subject}&body=${body}`;
    
    setShowInviteForm(false);
    setInviteEmails(['']);
    setInviteMessage('');
    loadReferralStats();
  };

  const getReferralRewards = () => {
    return [
      { referrals: 1, reward: '50 bonus stars', icon: '⭐', unlocked: referralStats.successfulReferrals >= 1 },
      { referrals: 3, reward: '150 stars + special badge', icon: '🏆', unlocked: referralStats.successfulReferrals >= 3 },
      { referrals: 5, reward: '300 stars + exclusive themes', icon: '🎨', unlocked: referralStats.successfulReferrals >= 5 },
      { referrals: 10, reward: '500 stars + VIP status', icon: '👑', unlocked: referralStats.successfulReferrals >= 10 }
    ];
  };

  const getProgressPercentage = () => {
    const nextMilestone = getReferralRewards().find(r => !r.unlocked);
    if (!nextMilestone) return 100;
    return (referralStats.successfulReferrals / nextMilestone.referrals) * 100;
  };

  return (
    <div className="referral-program-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <div className="header-content">
            <h2>🎁 Invite Friends & Earn Rewards</h2>
            <p>Share the magic of personalized stories and earn stars together!</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="referral-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-number">{referralStats.totalReferrals}</span>
              <span className="stat-label">Friends Invited</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">{referralStats.successfulReferrals}</span>
              <span className="stat-label">Joined</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <span className="stat-number">{referralStats.totalStarsEarned}</span>
              <span className="stat-label">Stars Earned</span>
            </div>
          </div>
        </div>

        <div className="referral-code-section">
          <h3>Your Referral Code</h3>
          <div className="code-container">
            <div className="code-display">
              <span className="code">{referralCode}</span>
              <button 
                className={`copy-btn ${copiedCode ? 'copied' : ''}`}
                onClick={copyReferralCode}
              >
                {copiedCode ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="share-methods">
          <h3>Share with Friends</h3>
          <div className="share-buttons">
            <button className="share-btn email" onClick={shareViaEmail}>
              <span className="share-icon">✉️</span>
              <span>Email</span>
            </button>
            <button className="share-btn whatsapp" onClick={shareViaWhatsApp}>
              <span className="share-icon">💬</span>
              <span>WhatsApp</span>
            </button>
            <button className="share-btn facebook" onClick={shareViaFacebook}>
              <span className="share-icon">📘</span>
              <span>Facebook</span>
            </button>
            <button 
              className="share-btn invite" 
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              <span className="share-icon">📧</span>
              <span>Send Invites</span>
            </button>
          </div>
        </div>

        {showInviteForm && (
          <div className="invite-form">
            <h4>Send Personal Invites</h4>
            <div className="email-inputs">
              {inviteEmails.map((email, index) => (
                <div key={index} className="email-input-row">
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="email-input"
                  />
                  {inviteEmails.length > 1 && (
                    <button 
                      className="remove-email-btn"
                      onClick={() => removeEmailField(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {inviteEmails.length < 5 && (
                <button className="add-email-btn" onClick={addEmailField}>
                  + Add another email
                </button>
              )}
            </div>
            <textarea
              placeholder="Add a personal message (optional)"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="message-input"
              rows="3"
            />
            <div className="invite-actions">
              <button className="cancel-btn" onClick={() => setShowInviteForm(false)}>
                Cancel
              </button>
              <button className="send-btn" onClick={sendInvites}>
                Send Invites
              </button>
            </div>
          </div>
        )}

        <div className="rewards-section">
          <h3>Referral Rewards</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="rewards-grid">
            {getReferralRewards().map((reward, index) => (
              <div 
                key={index} 
                className={`reward-item ${reward.unlocked ? 'unlocked' : ''}`}
              >
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-info">
                  <div className="reward-target">{reward.referrals} friends</div>
                  <div className="reward-description">{reward.reward}</div>
                </div>
                {reward.unlocked && <div className="unlock-badge">✅</div>}
              </div>
            ))}
          </div>
        </div>

        {recentReferrals.length > 0 && (
          <div className="recent-referrals">
            <h3>Recent Invites</h3>
            <div className="referral-list">
              {recentReferrals.map((referral, index) => (
                <div key={index} className="referral-item">
                  <div className="referral-info">
                    <span className="referral-email">{referral.email}</span>
                    <span className="referral-date">
                      {new Date(referral.invitedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`referral-status ${referral.status}`}>
                    {referral.status === 'completed' && '✅ Joined'}
                    {referral.status === 'pending' && '⏳ Pending'}
                    {referral.status === 'invited' && '📧 Invited'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="how-it-works">
          <h3>How It Works</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-text">Share your referral code with friends</div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-text">They sign up and create their first story</div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-text">You both get bonus stars and rewards!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralProgram;

