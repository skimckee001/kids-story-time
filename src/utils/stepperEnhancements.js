// Stepper Auto-Highlight Based on Scroll Position
export function initStepperAutoHighlight() {
  const steps = [...document.querySelectorAll('[id^="step"]')];
  const links = [...document.querySelectorAll('.stepper a')];
  
  if (!steps.length || !links.length) return;

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    
    if (!visible) return;
    
    const id = '#' + visible.target.id;
    links.forEach(a => {
      const isCurrent = a.getAttribute('href') === id;
      a.setAttribute('aria-current', isCurrent ? 'step' : 'false');
      
      // Also update visual state
      if (isCurrent) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }, { 
    rootMargin: '-40% 0px -50% 0px', 
    threshold: [0, 0.25, 0.5, 0.75, 1] 
  });

  steps.forEach(s => io.observe(s));
  
  // Return cleanup function
  return () => {
    steps.forEach(s => io.unobserve(s));
  };
}

// Theme Selection Limiter
export function initThemeSelectionLimit(maxThemes = 3) {
  const chips = document.querySelectorAll('.theme-chip');
  
  if (!chips.length) return;

  const handleChipClick = (event) => {
    const btn = event.currentTarget;
    const isOn = btn.getAttribute('aria-pressed') === 'true';
    const selected = [...chips].filter(c => c.getAttribute('aria-pressed') === 'true');
    
    // If trying to select and already at max, show message
    if (!isOn && selected.length >= maxThemes) {
      // Create temporary tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'theme-limit-tooltip';
      tooltip.textContent = `Maximum ${maxThemes} themes selected`;
      tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
      `;
      
      btn.style.position = 'relative';
      btn.appendChild(tooltip);
      
      setTimeout(() => tooltip.remove(), 2000);
      return;
    }
    
    // Toggle the selection
    btn.setAttribute('aria-pressed', String(!isOn));
  };

  chips.forEach(btn => {
    btn.addEventListener('click', handleChipClick);
  });
  
  // Add CSS for tooltip animation
  if (!document.querySelector('#theme-tooltip-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-tooltip-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(5px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Return cleanup function
  return () => {
    chips.forEach(btn => {
      btn.removeEventListener('click', handleChipClick);
    });
  };
}

// Smooth Scroll Enhancement for Stepper Links
export function initSmoothScroll() {
  const links = document.querySelectorAll('.stepper a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  });
}

// Initialize all enhancements
export function initAllEnhancements() {
  const cleanupHighlight = initStepperAutoHighlight();
  const cleanupThemes = initThemeSelectionLimit(3);
  initSmoothScroll();
  
  // Return combined cleanup function
  return () => {
    if (cleanupHighlight) cleanupHighlight();
    if (cleanupThemes) cleanupThemes();
  };
}