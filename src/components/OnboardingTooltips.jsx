import { useState, useEffect } from 'react';
import './OnboardingTooltips.css';

const TOOLTIP_STEPS = [
  {
    id: 'welcome',
    target: '.logo-text',
    title: 'Welcome to KidsStoryTime! 🎉',
    content: 'Create magical personalized stories for your children in seconds!',
    position: 'bottom'
  },
  {
    id: 'stars',
    target: '.star-bank',
    title: 'Star Bank 💰',
    content: 'Earn stars by reading stories. Spend them in the shop for fun rewards!',
    position: 'bottom'
  },
  {
    id: 'achievements',
    target: '.trophy-room',
    title: 'Trophy Room 🏆',
    content: 'Collect badges as you reach reading milestones. These are permanent achievements!',
    position: 'bottom'
  },
  {
    id: 'name',
    target: '#childName',
    title: 'Personalization ✨',
    content: 'Enter your child\'s name to make them the hero of every story!',
    position: 'top'
  },
  {
    id: 'themes',
    target: '.theme-grid',
    title: 'Choose Themes 🎨',
    content: 'Select fun themes to make stories extra special for your child.',
    position: 'top'
  },
  {
    id: 'imageStyle',
    target: '.image-style-grid',
    title: 'Pick Illustration Style 🖌️',
    content: 'Choose how you want the story pictures to look - from cartoon to realistic!',
    position: 'top'
  },
  {
    id: 'generate',
    target: '.generate-btn',
    title: 'Create Magic! ✨',
    content: 'Click here to generate your personalized story. First one is FREE!',
    position: 'top'
  }
];

function OnboardingTooltips({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (seen) {
      setHasSeenOnboarding(true);
      return;
    }
    
    // Start onboarding after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible || hasSeenOnboarding) return;
    
    // Scroll to current target element
    const currentTooltip = TOOLTIP_STEPS[currentStep];
    const targetElement = document.querySelector(currentTooltip.target);
    
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add highlight class
      targetElement.classList.add('tooltip-highlight');
      
      return () => {
        targetElement.classList.remove('tooltip-highlight');
      };
    }
  }, [currentStep, isVisible, hasSeenOnboarding]);

  const handleNext = () => {
    if (currentStep < TOOLTIP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    setHasSeenOnboarding(true);
    if (onComplete) onComplete();
  };

  if (!isVisible || hasSeenOnboarding) return null;

  const currentTooltip = TOOLTIP_STEPS[currentStep];
  const targetElement = document.querySelector(currentTooltip.target);
  
  if (!targetElement) {
    // If target element doesn't exist, skip to next step
    setTimeout(() => handleNext(), 100);
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const tooltipStyle = {
    position: 'fixed',
    zIndex: 10000
  };

  // Calculate position based on target element
  if (currentTooltip.position === 'bottom') {
    tooltipStyle.top = `${rect.bottom + 10}px`;
    tooltipStyle.left = `${rect.left + rect.width / 2}px`;
    tooltipStyle.transform = 'translateX(-50%)';
  } else if (currentTooltip.position === 'top') {
    tooltipStyle.bottom = `${window.innerHeight - rect.top + 10}px`;
    tooltipStyle.left = `${rect.left + rect.width / 2}px`;
    tooltipStyle.transform = 'translateX(-50%)';
  }

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" onClick={handleSkip} />
      
      {/* Spotlight */}
      <div 
        className="tooltip-spotlight"
        style={{
          position: 'fixed',
          top: rect.top - 10,
          left: rect.left - 10,
          width: rect.width + 20,
          height: rect.height + 20,
          zIndex: 9999
        }}
      />
      
      {/* Tooltip */}
      <div className="onboarding-tooltip" style={tooltipStyle}>
        <div className="tooltip-arrow" />
        
        <div className="tooltip-header">
          <h3>{currentTooltip.title}</h3>
          <button className="tooltip-close" onClick={handleSkip}>×</button>
        </div>
        
        <div className="tooltip-content">
          <p>{currentTooltip.content}</p>
        </div>
        
        <div className="tooltip-footer">
          <div className="tooltip-progress">
            {TOOLTIP_STEPS.map((_, index) => (
              <span 
                key={index} 
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          
          <div className="tooltip-actions">
            {currentStep > 0 && (
              <button onClick={handlePrevious} className="tooltip-btn-secondary">
                Previous
              </button>
            )}
            <button onClick={handleSkip} className="tooltip-btn-skip">
              Skip Tour
            </button>
            <button onClick={handleNext} className="tooltip-btn-primary">
              {currentStep === TOOLTIP_STEPS.length - 1 ? 'Get Started!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingTooltips;