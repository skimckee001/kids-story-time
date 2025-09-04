// Ultra-simple test to verify OpenAI connection
exports.handler = async (event) => {
  console.log('Test-openai function called');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check environment
    const apiKey = process.env.OPENAI_API_KEY;
    const hasApiKey = !!apiKey;
    
    console.log('Environment check:', {
      hasApiKey,
      keyLength: apiKey ? apiKey.length : 0,
      nodeVersion: process.version
    });

    // Try to import OpenAI
    let openaiImported = false;
    let openaiError = null;
    
    try {
      const { default: OpenAI } = await import('openai');
      openaiImported = true;
      console.log('OpenAI module imported successfully');
      
      // Try to create instance
      if (apiKey) {
        const openai = new OpenAI({ apiKey });
        console.log('OpenAI instance created');
        
        // Try a simple API call
        const models = await openai.models.list();
        console.log('API call successful, models count:', models.data.length);
      }
    } catch (e) {
      openaiError = e.message;
      console.error('OpenAI error:', e);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checks: {
          hasApiKey,
          openaiImported,
          openaiError,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Test function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};

exports.default = exports.handler;