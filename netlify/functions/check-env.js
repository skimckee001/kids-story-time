// Diagnostic function to check environment variables
export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check which environment variables are set
  const envCheck = {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasOpenAILength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasViteOpenAI: !!process.env.VITE_OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    // List all env var keys (not values for security)
    envKeys: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('KEY') && 
      !key.includes('TOKEN') &&
      !key.includes('PASSWORD')
    ).sort()
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(envCheck, null, 2)
  };
}