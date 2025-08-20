# API Setup Guide for Kids Story Time

## Image Generation APIs

The Kids Story Time app supports multiple image generation services for different subscription tiers:

### Free Tier
- Uses Unsplash Source API (no key required)
- DiceBear Avatars for cartoon-style illustrations
- Basic placeholder images

### Premium Tier (Stock Photos)
Requires one of:
- **Pexels API** (Recommended - Free)
- **Unsplash API**

### Pro Tier (AI Generation)
Requires one of:
- **OpenAI DALL-E 3**
- **Replicate (Stable Diffusion)**
- **Hugging Face**

## Setup Instructions

### 1. Pexels API (Free - Recommended for Premium Tier)

1. Go to [Pexels API](https://www.pexels.com/api/)
2. Click "Get Started"
3. Create a free account
4. You'll receive an API key instantly
5. Add to your `.env` file:
   ```
   PEXELS_API_KEY=your_pexels_api_key_here
   ```

**Limits**: 200 requests per hour, 20,000 per month (free)

### 2. Unsplash API (Alternative for Premium)

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Click "Register as a developer"
3. Create an application
4. Copy your Access Key
5. Add to your `.env` file:
   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```

**Limits**: 50 requests per hour for demo apps

### 3. OpenAI DALL-E (Pro Tier - AI Generation)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Add to your `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

**Cost**: ~$0.04 per image (1024x1024)

### 4. Replicate (Pro Tier - Alternative AI)

1. Go to [Replicate](https://replicate.com/)
2. Sign up for an account
3. Go to [API Tokens](https://replicate.com/account/api-tokens)
4. Create a new token
5. Add to your `.env` file:
   ```
   REPLICATE_API_TOKEN=your_replicate_token_here
   ```

**Cost**: ~$0.0011 per image with Stable Diffusion

### 5. Hugging Face (Pro Tier - Free Alternative)

1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "read" access
5. Add to your `.env` file:
   ```
   HUGGINGFACE_API_KEY=your_huggingface_token_here
   ```

**Limits**: Rate limited on free tier, but generally sufficient for testing

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file

3. Deploy to Netlify:
   - Go to Site Settings > Environment Variables
   - Add each API key as an environment variable

## Image Generation Flow

```
User Tier → API Selection → Image Generation
    │
    ├── Free → Unsplash Source / DiceBear (No API key needed)
    │
    ├── Premium → Pexels API / Unsplash API (Stock photos)
    │
    └── Pro → OpenAI / Replicate / Hugging Face (AI generated)
```

## Testing

To test image generation:

1. Open the browser console
2. Run:
   ```javascript
   await window.imageGenerationService.generateImage({
     prompt: "A happy child reading a book under a tree",
     style: "storybook",
     mood: "cheerful",
     tier: "free" // or "premium" or "pro"
   })
   ```

## Fallback System

The app implements a graceful fallback system:
1. Pro tier attempts AI generation → Falls back to stock photos
2. Premium tier attempts stock photos → Falls back to placeholders
3. Free tier uses placeholders directly

This ensures images always appear, even if APIs are unavailable.

## Cost Optimization

- **Development**: Use Pexels (free) and Hugging Face (free tier)
- **Production**: 
  - Premium users: Pexels API (free, high quality)
  - Pro users: Replicate (cheapest AI option) or OpenAI (best quality)

## Troubleshooting

### Images not loading
1. Check browser console for errors
2. Verify API keys in Netlify environment variables
3. Check API rate limits

### Poor image quality
- Ensure you're using the correct tier
- Check that API keys are properly configured
- Verify the image prompt is descriptive enough

### API errors
- Check API key validity
- Verify you haven't exceeded rate limits
- Ensure proper CORS configuration in Netlify

## Support

For issues with specific APIs:
- Pexels: [Pexels API Documentation](https://www.pexels.com/api/documentation/)
- Unsplash: [Unsplash API Docs](https://unsplash.com/documentation)
- OpenAI: [OpenAI API Reference](https://platform.openai.com/docs)
- Replicate: [Replicate Docs](https://replicate.com/docs)