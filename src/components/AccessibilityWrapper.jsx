import { useEffect } from 'react';

// Accessibility wrapper component to add ARIA attributes and screen reader support
const AccessibilityWrapper = ({ children }) => {
  useEffect(() => {
    // Add skip navigation link dynamically
    if (!document.getElementById('skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.id = 'skip-nav';
      skipNav.href = '#main-content';
      skipNav.className = 'skip-nav';
      skipNav.textContent = 'Skip to main content';
      skipNav.setAttribute('aria-label', 'Skip to main content');
      document.body.insertBefore(skipNav, document.body.firstChild);
    }

    // Set up ARIA live region for announcements
    if (!document.getElementById('aria-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Add lang attribute to HTML element
    document.documentElement.lang = 'en';

    // Ensure proper heading hierarchy
    const checkHeadingHierarchy = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > lastLevel + 1 && lastLevel !== 0) {
          console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${lastLevel}`);
        }
        lastLevel = level;
      });
    };
    checkHeadingHierarchy();

    // Add ARIA labels to buttons without text
    const enhanceButtons = () => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
          // Try to infer label from icon or class
          if (button.querySelector('[class*="close"]') || button.className.includes('close')) {
            button.setAttribute('aria-label', 'Close');
          } else if (button.querySelector('[class*="menu"]') || button.className.includes('menu')) {
            button.setAttribute('aria-label', 'Menu');
          } else if (button.querySelector('[class*="search"]') || button.className.includes('search')) {
            button.setAttribute('aria-label', 'Search');
          }
        }
      });
    };
    enhanceButtons();

    // Add ARIA attributes to form elements
    const enhanceForms = () => {
      // Add labels to inputs without labels
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (!input.getAttribute('aria-label') && !input.id) {
          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          }
        }
        
        // Add required attribute for screen readers
        if (input.hasAttribute('required')) {
          input.setAttribute('aria-required', 'true');
        }
        
        // Add error messages
        if (input.classList.contains('error') || input.classList.contains('invalid')) {
          input.setAttribute('aria-invalid', 'true');
          const errorId = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
          input.setAttribute('aria-describedby', errorId);
        }
      });
    };
    enhanceForms();

    // Enhance navigation
    const enhanceNavigation = () => {
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      navElements.forEach(nav => {
        if (!nav.getAttribute('aria-label')) {
          nav.setAttribute('aria-label', 'Main navigation');
        }
      });

      // Mark current page in navigation
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('nav a, [role="navigation"] a');
      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
          link.setAttribute('aria-current', 'page');
        }
      });
    };
    enhanceNavigation();

    // Add landmark roles
    const addLandmarks = () => {
      // Main content area
      const mainContent = document.querySelector('.main-content, main, [class*="content"]');
      if (mainContent && !mainContent.getAttribute('role')) {
        mainContent.setAttribute('role', 'main');
        mainContent.id = mainContent.id || 'main-content';
      }

      // Header
      const header = document.querySelector('header, .header, [class*="header"]');
      if (header && !header.getAttribute('role')) {
        header.setAttribute('role', 'banner');
      }

      // Footer
      const footer = document.querySelector('footer, .footer, [class*="footer"]');
      if (footer && !footer.getAttribute('role')) {
        footer.setAttribute('role', 'contentinfo');
      }

      // Search
      const search = document.querySelector('[class*="search"]');
      if (search && !search.getAttribute('role')) {
        search.setAttribute('role', 'search');
      }
    };
    addLandmarks();

    // Enhance images
    const enhanceImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.getAttribute('alt')) {
          // Decorative images should have empty alt
          if (img.classList.contains('decorative') || img.classList.contains('icon')) {
            img.setAttribute('alt', '');
          } else {
            // Try to infer from src or title
            const src = img.getAttribute('src');
            if (src) {
              const filename = src.split('/').pop().split('.')[0];
              const altText = filename.replace(/[-_]/g, ' ');
              img.setAttribute('alt', altText);
            }
          }
        }
      });
    };
    enhanceImages();

    // Add focus management for modals
    const enhanceModals = () => {
      const modals = document.querySelectorAll('.modal, [role="dialog"]');
      modals.forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        // Find and label close buttons in modals
        const closeBtn = modal.querySelector('[class*="close"]');
        if (closeBtn) {
          closeBtn.setAttribute('aria-label', 'Close dialog');
        }
      });
    };
    enhanceModals();

    // Enhance loading states
    const enhanceLoadingStates = () => {
      const spinners = document.querySelectorAll('.spinner, .loading, [class*="load"]');
      spinners.forEach(spinner => {
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-label', 'Loading');
        
        // Add screen reader text if not present
        if (!spinner.querySelector('.sr-only')) {
          const srText = document.createElement('span');
          srText.className = 'sr-only';
          srText.textContent = 'Loading...';
          spinner.appendChild(srText);
        }
      });
    };
    enhanceLoadingStates();

    // Run enhancements on DOM changes
    const observer = new MutationObserver(() => {
      enhanceButtons();
      enhanceForms();
      enhanceImages();
      enhanceModals();
      enhanceLoadingStates();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return children;
};

// Utility function to announce to screen readers
export const announceToScreenReader = (message) => {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
};

// Screen reader only CSS class
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .skip-nav {
    position: absolute;
    top: -40px;
    left: 0;
    background: #8b5cf6;
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 0 0 8px 0;
    z-index: 10000;
    font-weight: 600;
  }
  
  .skip-nav:focus {
    top: 0;
  }
`;

// Inject screen reader styles if not already present
if (!document.getElementById('sr-styles')) {
  const style = document.createElement('style');
  style.id = 'sr-styles';
  style.textContent = srOnlyStyles;
  document.head.appendChild(style);
}

export default AccessibilityWrapper;