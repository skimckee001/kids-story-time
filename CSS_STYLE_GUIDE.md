# 🎨 KidsStoryTime.ai CSS Style Guide

## Table of Contents
1. [Core Design Principles](#core-design-principles)
2. [CSS Variables & Design Tokens](#css-variables--design-tokens)
3. [Typography System](#typography-system)
4. [Color Palette](#color-palette)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Animations & Transitions](#animations--transitions)
8. [Responsive Design](#responsive-design)
9. [Accessibility Standards](#accessibility-standards)
10. [Print Styles](#print-styles)
11. [Best Practices](#best-practices)

---

## Core Design Principles

### 1. **Playful Yet Professional**
- Use gradient backgrounds for visual interest
- Rounded corners (border-radius) for friendly appearance
- Soft shadows for depth without harshness

### 2. **Reading-First Design**
- Optimal line-height (1.6-1.7) for readability
- Comfortable font sizes (clamp for responsive typography)
- High contrast ratios for text legibility

### 3. **Mobile-First Responsive**
- Design for mobile, enhance for desktop
- Touch-friendly targets (min 44px)
- Fluid typography and spacing

---

## CSS Variables & Design Tokens

### Root Variables (Always Define These)
```css
:root {
  /* ===== SPACING ===== */
  --gutter: clamp(16px, 4vw, 24px);
  --radius: 16px;
  --radius-sm: 8px;
  --radius-lg: 24px;
  --shadow: 0 8px 24px rgba(0,0,0,.06);
  --shadow-sm: 0 2px 8px rgba(0,0,0,.08);
  --shadow-lg: 0 20px 40px rgba(0,0,0,.1);
  
  /* ===== LAYOUT ===== */
  --page-max: 960px;        /* Max width for content */
  --read-max: 72ch;         /* Optimal reading width */
  --safe-top: env(safe-area-inset-top);     /* iPhone notch */
  --safe-bot: env(safe-area-inset-bottom);  /* iPhone home bar */
  
  /* ===== COLORS - Light Theme ===== */
  --bg: #ffffff;
  --card: #ffffff;
  --ink: #1f2937;           /* Primary text */
  --muted: #6b7280;         /* Secondary text */
  --border: #e5e7eb;
  --brand: #6d28d9;         /* Purple brand color */
  --brand-weak: rgba(109,40,217,.10);
  
  /* ===== GRADIENTS ===== */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  --gradient-gold: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}
```

---

## Typography System

### Font Stack
```css
/* System font stack for optimal performance */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale (Mobile-First with Clamp)
```css
/* Fluid typography that scales with viewport */
.text-xs    { font-size: clamp(0.75rem, 1.5vw, 0.875rem); }
.text-sm    { font-size: clamp(0.875rem, 1.8vw, 1rem); }
.text-base  { font-size: clamp(1rem, 2vw, 1.125rem); }
.text-lg    { font-size: clamp(1.125rem, 2.5vw, 1.25rem); }
.text-xl    { font-size: clamp(1.25rem, 3vw, 1.5rem); }
.text-2xl   { font-size: clamp(1.5rem, 4vw, 2rem); }
.text-3xl   { font-size: clamp(2rem, 5vw, 3rem); }
.text-4xl   { font-size: clamp(2.5rem, 6vw, 4rem); }
```

### Story-Specific Typography
```css
.story-title {
  font-size: clamp(2rem, 5vw, 3.2rem) !important;
  font-weight: 700;
  line-height: 1.2;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.story-text {
  font-size: clamp(16px, 1.6vw, 18px);
  line-height: 1.7;
  color: var(--ink);
  max-width: var(--read-max);
}
```

---

## Color Palette

### Primary Brand Colors
```css
/* Purple gradient system */
--purple-50: #f5f3ff;
--purple-100: #ede9fe;
--purple-200: #ddd6fe;
--purple-300: #c4b5fd;
--purple-400: #a78bfa;
--purple-500: #8b5cf6;  /* Primary */
--purple-600: #7c3aed;
--purple-700: #6d28d9;  /* Brand */
--purple-800: #5b21b6;
--purple-900: #4c1d95;
```

### Semantic Colors
```css
/* Success */
--success: #10b981;
--success-bg: rgba(16, 185, 129, 0.1);

/* Warning */
--warning: #f59e0b;
--warning-bg: rgba(245, 158, 11, 0.1);

/* Danger */
--danger: #ef4444;
--danger-bg: rgba(239, 68, 68, 0.1);

/* Info */
--info: #3b82f6;
--info-bg: rgba(59, 130, 246, 0.1);
```

---

## Spacing & Layout

### Spacing Scale
```css
/* Use consistent spacing multiples of 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Container Patterns
```css
.container {
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.story-card {
  background: #ffffff !important;
  border-radius: var(--radius);
  padding: clamp(30px, 5vw, 50px);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  /* IMPORTANT: No transform on hover for story cards */
  transition: none !important;
  transform: none !important;
}
```

---

## Component Patterns

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.3s ease, filter 0.3s ease;
  min-height: 44px;  /* Touch-friendly */
  white-space: nowrap;  /* Prevent text wrapping */
}

.btn-primary:hover {
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  filter: brightness(1.05);
}

.btn-primary:focus-visible {
  outline: 3px solid color-mix(in oklab, var(--brand) 40%, white);
  outline-offset: 2px;
}
```

### Star Rating Component
```css
.star {
  font-size: 6rem !important;    /* Desktop */
  cursor: pointer;
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
  line-height: 1;
  display: inline-block;
  padding: 10px;
  user-select: none;
}

.star:hover {
  filter: grayscale(0%);
  transform: scale(1.1);
}

.star.active {
  filter: grayscale(0%);
  animation: sparkle 0.5s ease;
}

@keyframes sparkle {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}
```

### Modal/Overlay Pattern
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--gutter);
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  padding: clamp(20px, 4vw, 40px);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
```

---

## Animations & Transitions

### Standard Transitions
```css
/* Use consistent timing for smooth UX */
--transition-fast: 0.2s ease;
--transition-normal: 0.3s ease;
--transition-slow: 0.5s ease;

/* Standard transition properties */
transition: transform var(--transition-normal),
            box-shadow var(--transition-normal),
            filter var(--transition-normal);
```

### Celebration Animations
```css
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); }
  100% { transform: translateY(100vh) rotate(720deg); }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * { 
    animation: none !important; 
    transition: none !important; 
  }
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 480px;   /* Small phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Responsive Patterns
```css
/* Tablet (768px) */
@media (max-width: 768px) {
  .container { padding: 15px; }
  .story-card { padding: 30px 20px; }
  .story-title { font-size: 2.2rem !important; }
  .star { font-size: 4.8rem !important; }
  
  /* Stack layouts */
  .header-content { flex-direction: column; gap: 15px; }
  .story-actions { flex-wrap: wrap; }
}

/* Mobile (480px) */
@media (max-width: 480px) {
  .container { padding: 8px; }
  .story-card { padding: 20px 15px; }
  .story-title { font-size: 1.8rem !important; }
  .star { font-size: 3.6rem !important; }
  
  /* Full-width buttons */
  .btn { width: 100%; max-width: none; }
}
```

---

## Accessibility Standards

### Focus States
```css
/* Visible focus for keyboard navigation */
:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Touch Targets
```css
/* Minimum 44x44px for touch targets */
button, a, .clickable {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Color Contrast
```css
/* Ensure WCAG AA compliance */
/* Text on white: min #595959 (4.5:1) */
/* Large text on white: min #767676 (3:1) */
```

---

## Print Styles

```css
@media print {
  /* Hide non-content elements */
  .header-container,
  .footer,
  .story-rating,
  .story-actions,
  .ad-container { 
    display: none !important; 
  }
  
  /* Optimize for print */
  .story-card {
    box-shadow: none;
    border: 0;
    padding: 0;
  }
  
  .story-text {
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    max-width: none;
  }
  
  /* Force text colors for print */
  .story-title {
    color: black !important;
    -webkit-text-fill-color: black !important;
  }
  
  @page { margin: 16mm; }
}
```

---

## Best Practices

### 1. **Use CSS Variables**
- Define all colors, spacing, and sizes as variables
- Makes theme changes and maintenance easier
- Ensures consistency across components

### 2. **Mobile-First Development**
```css
/* Start with mobile styles */
.element {
  padding: 10px;
}

/* Enhance for larger screens */
@media (min-width: 768px) {
  .element {
    padding: 20px;
  }
}
```

### 3. **Avoid !important (Unless Necessary)**
- Use for critical overrides only (e.g., story-card background)
- Document why it's needed
- Try specificity first

### 4. **Performance Considerations**
```css
/* Use transform for animations (GPU accelerated) */
.animated {
  transform: translateX(100px);  /* Good */
  /* left: 100px; */              /* Avoid */
}

/* Use will-change sparingly */
.will-animate {
  will-change: transform;  /* Only when needed */
}
```

### 5. **Component Isolation**
```css
/* Scope styles to components */
.story-display .title { }  /* Better */
.title { }                  /* Too generic */
```

### 6. **Consistent Naming**
```css
/* BEM-inspired naming */
.story-card { }           /* Block */
.story-card__title { }    /* Element */
.story-card--featured { } /* Modifier */
```

---

## iOS/Safari Specific Fixes

```css
/* Prevent text size adjustment on rotation */
html {
  -webkit-text-size-adjust: 100%;
}

/* Fix for iOS safe areas */
.container {
  padding-top: max(var(--gutter), env(safe-area-inset-top));
  padding-bottom: max(var(--gutter), env(safe-area-inset-bottom));
}

/* Smooth scrolling with momentum */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

---

## Quick Reference Checklist

When adding new styles, ensure:

- [ ] CSS variables used for colors and spacing
- [ ] Mobile-first responsive design
- [ ] Touch targets are 44px minimum
- [ ] Focus states are visible
- [ ] Animations respect prefers-reduced-motion
- [ ] Print styles included if content is printable
- [ ] No unnecessary !important flags
- [ ] Component styles are scoped appropriately
- [ ] Gradients use defined variables
- [ ] Typography uses clamp() for responsive sizing

---

## Component-Specific Guidelines

### Story Display
- White background forced with `!important`
- No hover transforms (prevents unwanted zoom)
- Large, accessible star ratings
- Comfortable reading width (72ch max)

### Headers & Navigation
- Sticky positioning considerations
- Mobile menu patterns
- Touch-friendly button sizes

### Forms & Inputs
- Clear focus states
- Error state styling
- Loading state animations

---

*Last Updated: September 2025*
*Version: 1.0*

⚠️ **Note**: Always check this file when adding CSS to ensure consistency with the design system.