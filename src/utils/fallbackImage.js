/**
 * Generate a base64 encoded SVG fallback image with gradient background
 */
export function generateFallbackImage(title = 'Story', theme = 'default') {
  const gradients = {
    adventure: ['#4A90E2', '#7B68EE'],
    fairytale: ['#FF69B4', '#DA70D6'],
    educational: ['#32CD32', '#20B2AA'],
    bedtime: ['#6495ED', '#9370DB'],
    default: ['#8A2BE2', '#5F9EA0']
  };

  const [color1, color2] = gradients[theme] || gradients.default;
  
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#gradient)"/>
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" opacity="0.9">
        📚
      </text>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">
        ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}
      </text>
    </svg>
  `;

  // Convert to base64 data URI
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Load image with fallback
 */
export async function loadImageWithFallback(url, title = 'Story', theme = 'default') {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      console.log('Image failed to load, using fallback:', url);
      resolve(generateFallbackImage(title, theme));
    };
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(generateFallbackImage(title, theme));
    }, 5000);
  });
}

export default {
  generateFallbackImage,
  loadImageWithFallback
};