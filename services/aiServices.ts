import axios from "axios";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { FormattedAnalysis } from "../components/AnalysisView";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  cooldownMs: 2000, // 2 seconds between requests
};

// Client-side rate limiting store
class RateLimiter {
  private requests: number[] = [];
  private lastRequest: number = 0;

  canMakeRequest(): { allowed: boolean; waitTime?: number; message?: string } {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
    
    // Remove old requests
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    // Check cooldown period
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < RATE_LIMIT_CONFIG.cooldownMs) {
      const waitTime = RATE_LIMIT_CONFIG.cooldownMs - timeSinceLastRequest;
      return {
        allowed: false,
        waitTime,
        message: `Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`
      };
    }
    
    // Check rate limit
    if (this.requests.length >= RATE_LIMIT_CONFIG.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + RATE_LIMIT_CONFIG.windowMs - now;
      return {
        allowed: false,
        waitTime,
        message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      };
    }
    
    return { allowed: true };
  }
  
  recordRequest(): void {
    const now = Date.now();
    this.requests.push(now);
    this.lastRequest = now;
  }
}

const rateLimiter = new RateLimiter();
export interface MarketResearchReport {
  companyName: string;
  symbol: string;
  summary: string;
  financials: {
    revenue: string;
    netIncome: string;
    eps: string;
    peRatio: string;
  };
  growthPotential: string;
  competitors: string[];
  risks: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
}

export interface CryptoAnalysis {
  currentPrice: string;
  priceChange24h: string;
  volume24h: string;
  marketCap: string;
  supportLevels: string[];
  resistanceLevels: string[];
  technicalIndicators: {
    rsi: string;
    macd: string;
    movingAverages: {
      ma20: string;
      ma50: string;
      ma200: string;
    };
  };
  priceTargets: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
  timeframe: string;
}
const SUPABASE_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_BASE_URL;
const SUPABASE_BEARER_TOKEN = process.env.EXPO_PUBLIC_SUPABASE_BEARER_TOKEN;
//const SUPABASE_BASE_URL = "https://mnjhkeygyczkziowlrab.supabase.co/functions/v1";
//const SUPABASE_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uamhrZXlneWN6a3ppb3dscmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODQ4NzcsImV4cCI6MjA2NzQ2MDg3N30.9unaHI1ZXmSLMDf1szwmsR6oGXpDrn7-MTH-YXH5hng";

if (!SUPABASE_BASE_URL || !SUPABASE_BEARER_TOKEN) {
  Alert.alert('Missing environment variables: SUPABASE_BASE_URL or SUPABASE_BEARER_TOKEN');
}

export const getMarketResearch = async (companyName: string): Promise<MarketResearchReport> => {
  const response = await axios.post(
    `${SUPABASE_BASE_URL}/market-reserch`,
    { companyName },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_BEARER_TOKEN}`
      },
    }
  );

  if (!response.data || typeof response.data.summary !== 'string') {
    throw new Error('Invalid or incomplete data received from the server.');
  }

  return response.data;
};

// Enhanced chat function with context support
export const getAiChatResponse = async (
  message: string, 
  companyName?: string, 
  sessionId?: string,
  marketResearchData?: any
): Promise<{reply: string, hasContext: boolean, companyName: string | null}> => {
  const response = await axios.post(
    `${SUPABASE_BASE_URL}/market-reserch-chat-test`,
    { 
      message, 
      companyName, 
      sessionId,
      marketResearchData 
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_BEARER_TOKEN}`
      },
    }
  );

  return {
    reply: response.data.reply,
    hasContext: response.data.hasContext || false,
    companyName: response.data.companyName || null
  };
};

// Legacy function for backward compatibility
export const getAiChatResponseLegacy = async (message: string, companyName: string): Promise<string> => {
  const response = await getAiChatResponse(message, companyName);
  return response.reply;
};



export const GetChartAnalysis = async (
  imageUri: string,
): Promise<FormattedAnalysis> => {
  try {
    // Check client-side rate limit
    const rateLimitCheck = rateLimiter.canMakeRequest();
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || 'Rate limit exceeded');
    }

    console.log("GEMINI_SERVICE: Starting direct image processing with Gemini for URI:", imageUri);
    
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const supabaseEdgeUrl = `${SUPABASE_BASE_URL}/ai-chart-test`;
    console.log('GEMINI_SERVICE: Sending request to Supabase Edge Function for direct Gemini processing...');
    
    // Record the request attempt
    rateLimiter.recordRequest();
    
    const response = await axios.post(
      supabaseEdgeUrl,
      { 
        imageBase64: base64Image
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_BEARER_TOKEN}`,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log("GEMINI_SERVICE: Received response from Gemini image processing");
    
    // Log rate limit headers if present
    if (response.headers['x-ratelimit-remaining']) {
      console.log(`GEMINI_SERVICE: Rate limit remaining: ${response.headers['x-ratelimit-remaining']}`);
    }

    if (!response.data?.summary || !response.data?.trend) {
      console.warn("GEMINI_SERVICE: Invalid response format from Gemini image processing", response.data);
      throw new Error("Failed to process image with Gemini: Invalid format");
    }

    return response.data;
  } catch (error) {
    console.error("GEMINI_SERVICE: Error processing image with Gemini:", error);
    
    if (axios.isAxiosError(error)) {
      // Handle rate limit errors specifically
      if (error.response?.status === 429) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const retryAfter = error.response.headers['retry-after'];
        const errorData = error.response.data;
        
        let message = 'Rate limit exceeded. Please try again later.';
        if (errorData?.message) {
          message = errorData.message;
        } else if (retryAfter) {
          message = `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`;
        }
        
        throw new Error(message);
      }
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again with a smaller or clearer image.');
      }
      
      // Handle network errors
      if (!error.response) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      console.error('GEMINI_SERVICE: Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    
    // Handle client-side rate limiting errors
    if (error instanceof Error && (error.message?.includes('Rate limit') || error.message?.includes('Please wait'))) {
      throw error; // Re-throw rate limit errors as-is
    }
    
    throw new Error(
      "Failed to process image with Gemini. Please try again with a clearer image."
    );
  }
};

// Utility function to get rate limit info
export const getRateLimitInfo = () => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  const recentRequests = (rateLimiter as any).requests.filter((timestamp: number) => timestamp > windowStart);
  
  return {
    remaining: RATE_LIMIT_CONFIG.maxRequests - recentRequests.length,
    maxRequests: RATE_LIMIT_CONFIG.maxRequests,
    windowMs: RATE_LIMIT_CONFIG.windowMs,
    cooldownMs: RATE_LIMIT_CONFIG.cooldownMs,
    nextRequestAllowed: (rateLimiter as any).lastRequest + RATE_LIMIT_CONFIG.cooldownMs
  };
};
