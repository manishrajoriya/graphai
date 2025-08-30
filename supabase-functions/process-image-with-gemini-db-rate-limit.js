import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

console.log("Edge Function 'process-image-with-gemini-db-rate-limit' is running...");

// Initialize Supabase client for rate limiting
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 10, // Maximum requests per window
  windowMinutes: 1, // 1 minute window
  maxRequestsPerDay: 50, // Daily limit
};

// Database-backed rate limiting function
async function checkRateLimitDB(clientId) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_client_id: clientId,
      p_max_requests: RATE_LIMIT_CONFIG.maxRequests,
      p_window_minutes: RATE_LIMIT_CONFIG.windowMinutes,
      p_max_daily: RATE_LIMIT_CONFIG.maxRequestsPerDay
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fall back to allowing the request if DB check fails
      return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests };
    }

    return data;
  } catch (error) {
    console.error('Rate limit DB error:', error);
    // Fall back to allowing the request if DB is unavailable
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests };
  }
}

// Get client identifier (IP or user ID)
function getClientId(req) {
  // Try to get user ID from auth header first
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      // Extract user info from JWT token (simplified)
      const token = authHeader.replace('Bearer ', '');
      return `user_${token.slice(-10)}`; // Use last 10 chars as identifier
    } catch (e) {
      // Fall back to IP if token parsing fails
    }
  }
  
  // Fall back to IP address
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Check rate limit using database
    const clientId = getClientId(req);
    const rateLimitResult = await checkRateLimitDB(clientId);
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.reset_time).toISOString();
      return new Response(JSON.stringify({
        error: rateLimitResult.error,
        message: rateLimitResult.error === 'Daily limit exceeded' 
          ? 'You have exceeded your daily analysis limit. Please try again tomorrow.'
          : 'Too many requests. Please wait before making another request.',
        resetTime: resetTime,
        rateLimitInfo: {
          maxRequests: RATE_LIMIT_CONFIG.maxRequests,
          windowMinutes: RATE_LIMIT_CONFIG.windowMinutes,
          maxRequestsPerDay: RATE_LIMIT_CONFIG.maxRequestsPerDay
        }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(new Date(rateLimitResult.reset_time).getTime() / 1000).toString(),
          'Retry-After': Math.ceil((new Date(rateLimitResult.reset_time).getTime() - Date.now()) / 1000).toString()
        }
      });
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({
        error: 'Missing imageBase64'
      }), {
        status: 400
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY not set'
      }), {
        status: 500
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${apiKey}`;
    
    const prompt = `
      You are an expert cryptocurrency chart analyst. Analyze ONLY what is actually visible on the provided chart image.
      Return your analysis strictly in the following JSON format with no additional text or markdown.

      CRITICAL: Only analyze data that is clearly visible on the chart. Do not make assumptions or provide data not shown.

      {
        "summary": "Brief overview based only on what you can see in the chart (1-2 sentences).",
        "trend": "Primary trend visible on chart. Must be: 'Bullish', 'Bearish', or 'Neutral'.",
        "confidence": "Confidence score 0-1 based on chart clarity and visible patterns.",
        "currentPrice": "Current price if clearly visible on chart, otherwise 'Not visible'",
        "priceChange24h": "24h change if shown on chart, otherwise 'Not visible'",
        "volume24h": "Volume data if visible on chart, otherwise 'Not visible'",
        "marketCap": "Market cap if displayed on chart, otherwise 'Not visible'",
        "supportLevels": [
          "Only include support levels clearly visible as horizontal lines, previous lows, or marked levels on the chart"
        ],
        "resistanceLevels": [
          "Only include resistance levels clearly visible as horizontal lines, previous highs, or marked levels on the chart"
        ],
        "technicalIndicators": {
          "rsi": "RSI value/status if RSI indicator is visible on chart, otherwise 'Not visible'",
          "macd": "MACD signal if MACD indicator is shown on chart, otherwise 'Not visible'",
          "movingAverages": {
            "ma20": "20-period MA if visible as a line on chart, otherwise 'Not visible'",
            "ma50": "50-period MA if visible as a line on chart, otherwise 'Not visible'",
            "ma200": "200-period MA if visible as a line on chart, otherwise 'Not visible'"
          }
        },
        "priceTargets": {
          "shortTerm": "Target based on visible chart patterns/levels, or 'Not determined'",
          "mediumTerm": "Target based on visible chart patterns/levels, or 'Not determined'",
          "longTerm": "Target based on visible chart patterns/levels, or 'Not determined'"
        },
        "keyPoints": [
          "Key observation 1 based on visible chart elements",
          "Key observation 2 based on visible chart elements",
          "Key observation 3 based on visible chart elements"
        ],
        "strategy": "Educational notes about visible patterns and levels. Focus on what can be observed on the chart.",
        "riskLevel": "Risk assessment based on visible volatility and patterns: 'Low', 'Medium', or 'High'.",
        "timeframe": "Timeframe visible on chart (e.g., '1H', '4H', '1D', '1W') or analysis timeframe based on visible patterns"
      }

      STRICT RULES:
      - ONLY analyze what is actually visible on the chart image
      - Use 'Not visible' for any data not clearly shown
      - Do not assume or extrapolate data not displayed
      - Focus on visible candlesticks, lines, indicators, and price levels
      - If chart quality is poor, reflect this in your confidence score
      - Base price targets only on visible support/resistance levels
      - Identify chart timeframe from visible labels if possible
    `;

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        topP: 0.8,
        topK: 40
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(JSON.stringify({
        error: 'Gemini API failed',
        detail: errorText
      }), {
        status: 500
      });
    }

    const geminiResult = await geminiResponse.json();
    let textContent = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      // Clean the response before parsing
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        textContent = jsonMatch[0];
      }

      const jsonResponse = JSON.parse(textContent);
      
      // Validate required fields
      if (!jsonResponse.summary || !jsonResponse.trend) {
        throw new Error('Missing required fields in AI response');
      }

      // Ensure confidence is a number between 0 and 1
      if (typeof jsonResponse.confidence !== 'number' || jsonResponse.confidence < 0 || jsonResponse.confidence > 1) {
        jsonResponse.confidence = 0.7; // Default confidence
      }

      // Ensure arrays exist
      if (!Array.isArray(jsonResponse.keyPoints)) {
        jsonResponse.keyPoints = ['Analysis completed', 'Please review chart manually', 'Consider market conditions'];
      }
      
      if (!Array.isArray(jsonResponse.supportLevels)) {
        jsonResponse.supportLevels = [];
      }
      
      if (!Array.isArray(jsonResponse.resistanceLevels)) {
        jsonResponse.resistanceLevels = [];
      }

      return new Response(JSON.stringify(jsonResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-RateLimit-Reset': Math.ceil(new Date(rateLimitResult.reset_time).getTime() / 1000).toString(),
          'X-RateLimit-Daily-Remaining': rateLimitResult.daily_remaining?.toString() || '0'
        }
      });

    } catch (parseError) {
      console.error("Failed to parse Gemini response:", textContent, parseError);
      
      // Return a fallback response
      return new Response(JSON.stringify({
        summary: "Chart analysis completed. Please review the technical indicators and price action manually.",
        trend: "Neutral",
        confidence: 0.5,
        keyPoints: [
          "Unable to parse detailed analysis",
          "Please ensure chart image is clear and well-lit",
          "Consider uploading a higher quality image"
        ],
        strategy: "Chart shows mixed signals. Consider waiting for clearer patterns to emerge before making decisions.",
        riskLevel: "Medium",
        timeframe: "Short-term (1-7 days)",
        currentPrice: "Not visible",
        priceChange24h: "Not visible",
        volume24h: "Not visible",
        marketCap: "Not visible",
        supportLevels: [],
        resistanceLevels: [],
        technicalIndicators: {
          rsi: "Not visible",
          macd: "Not visible",
          movingAverages: {
            ma20: "Not visible",
            ma50: "Not visible",
            ma200: "Not visible"
          }
        },
        priceTargets: {
          shortTerm: "Not determined",
          mediumTerm: "Not determined",
          longTerm: "Not determined"
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
