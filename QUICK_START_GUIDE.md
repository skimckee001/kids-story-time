# 🚀 Quick Start Guide - Story Generation

## The Problem
Story generation is failing because:
1. **No OpenAI API key** configured in `.env` file
2. **Netlify functions not running** (needed for story generation)

## Solution

### Step 1: Add Your OpenAI API Key

1. **Get your OpenAI API key** from: https://platform.openai.com/api-keys
2. **Edit the `.env` file** and add your key:
```bash
VITE_OPENAI_API_KEY=sk-YOUR-ACTUAL-API-KEY-HERE
OPENAI_API_KEY=sk-YOUR-ACTUAL-API-KEY-HERE
```

### Step 2: Install Netlify CLI (One Time)
```bash
npm install -g netlify-cli
```

### Step 3: Run the App with Netlify Dev
```bash
# Stop the current server (Ctrl+C)
# Then run:
netlify dev
```

This will start:
- Frontend on http://localhost:8888
- Functions on http://localhost:8888/.netlify/functions/

### Step 4: Test Story Generation
1. Go to http://localhost:8888
2. Fill in the story form
3. Click "Create Story"

## Alternative: Test Without API Key

If you don't have an OpenAI API key yet, you can create a mock story for testing:

**Run this in browser console:**
```javascript
// Create a mock story for testing
const mockStory = {
  title: "Test Adventure",
  story: "Once upon a time, there was a brave child who loved adventures. They explored magical forests and made friends with talking animals. The end!",
  imageUrl: "https://via.placeholder.com/400x300/purple/white?text=Story+Image",
  savedAt: new Date().toISOString()
};

// Save to localStorage
const stories = JSON.parse(localStorage.getItem('stories') || '[]');
stories.push(mockStory);
localStorage.setItem('stories', JSON.stringify(stories));

// Show the story
localStorage.setItem('currentStory', JSON.stringify(mockStory));
location.reload();
```

## Current Setup Status

✅ **Mock user authentication** - Working
✅ **Dev panel** - Should be visible (purple 🧪 button)
❌ **OpenAI API key** - Not configured (add to .env)
❌ **Netlify functions** - Not running (use `netlify dev`)

## Commands Summary

```bash
# Install Netlify CLI (first time only)
npm install -g netlify-cli

# Run the full app with functions
netlify dev

# App will be at:
http://localhost:8888
```

## Troubleshooting

### "command not found: netlify"
```bash
npm install -g netlify-cli
```

### Port already in use
```bash
# Kill all node processes
killall node
# Try again
netlify dev
```

### Still not working?
Check the browser console for specific error messages.

---
*Last Updated: September 4, 2025*