# CLAUDE PROJECT CONTEXT

## ⚠️ IMPORTANT: CORRECT PROJECT LOCATION
**THIS IS THE ACTIVE PROJECT DIRECTORY**: `/Users/skimckee/Documents/GitHub/kids-story-time`

### ❌ DO NOT USE (Outdated):
- `/Users/skimckee/Projects/kids-story-full-product/` - Old version, not synced with GitHub

## Project Information
- **Project Name**: Kids Story Time
- **Live URL**: https://kidsstorytime.org (deployed via Netlify)
- **GitHub Repository**: https://github.com/skimckee001/kids-story-time
- **Description**: AI-powered personalized story generation app for children

## Technology Stack
- **Frontend**: Pure HTML/CSS/JavaScript (no build process)
- **Deployment**: Netlify (static site hosting + serverless functions)
- **AI Services**: 
  - OpenAI API (story generation, DALL-E for images)
  - Replicate API (Stable Diffusion for images)
  - Pexels API (stock photos)
- **Database**: Supabase (user profiles, stories, subscriptions)
- **Authentication**: Supabase Auth

## Key Files & Structure
```
/Users/skimckee/Documents/GitHub/kids-story-time/
├── index.html              # Main landing page
├── story.html              # Story display page
├── story-library.html      # User's story library
├── profile.html            # User profile page
├── js/                     # JavaScript services
│   ├── ai-story-service.js      # Story generation
│   ├── image-generation-service.js # Image generation
│   ├── auth-manager.js          # Authentication
│   ├── subscription-manager.js   # Subscription handling
│   └── ...
├── netlify/
│   └── functions/          # Serverless functions
│       ├── generate-story.js
│       └── generate-image.js
├── netlify.toml            # Netlify configuration
└── .env.example            # Environment variables template
```

## Environment Variables (Set in Netlify Dashboard)
- `OPENAI_API_KEY` - For GPT-4 story generation and DALL-E images
- `REPLICATE_API_TOKEN` - For Stable Diffusion image generation
- `PEXELS_API_KEY` - For stock photos
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Subscription Tiers
1. **Free**: Basic stories, placeholder images
2. **Premium**: Enhanced stories, stock photos from Pexels
3. **Family/Pro**: Full features, AI-generated images with Replicate/DALL-E

## Current Features
- ✅ AI story generation with OpenAI GPT-4
- ✅ Multi-tier image generation (placeholder → stock → AI)
- ✅ User authentication with Supabase
- ✅ Story library with save/delete functionality
- ✅ Subscription management (Free/Premium/Family tiers)
- ✅ Star points reward system
- ✅ Social sharing capabilities
- ✅ AI voice narration
- ✅ Story export (PDF, print)
- ✅ Age-appropriate theme selection
- ✅ Analytics integration

## Common Commands
```bash
# Navigate to project
cd /Users/skimckee/Documents/GitHub/kids-story-time

# Check git status
git status

# Pull latest changes
git pull origin main

# Push changes
git add .
git commit -m "Your message"
git push origin main

# View Netlify deployment
open https://kidsstorytime.org
```

## Development Workflow
1. Always work in `/Users/skimckee/Documents/GitHub/kids-story-time`
2. Pull latest changes before starting work
3. Test locally by opening HTML files directly (no build process needed)
4. Commit and push to GitHub
5. Netlify auto-deploys from GitHub main branch

## Testing Accounts
Test users can be accessed via "Quick Test Login" buttons on the login modal:
- Test Free (gray button)
- Test Premium (orange button)  
- Test Family (green button) - Gets AI image generation

## Recent Issues & Solutions
- **Image Generation**: Family tier now properly maps to 'pro' tier for AI images
- **API Keys**: All keys should be set in Netlify environment variables
- **Old Directory**: Never use `/Users/skimckee/Projects/kids-story-full-product/`

## Owner Information
- **GitHub Username**: skimckee001
- **Primary Email**: (check Supabase/Netlify dashboards)

---
Last Updated: 2024-08-21
If you're reading this in a new Claude session, verify you're in the correct directory:
`pwd` should return `/Users/skimckee/Documents/GitHub/kids-story-time`