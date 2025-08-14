import axios from "axios";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { FormattedAnalysis } from "../components/AnalysisView";
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
const SUPABASE_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_BASE_URL;
const SUPABASE_BEARER_TOKEN = process.env.EXPO_PUBLIC_SUPABASE_BEARER_TOKEN;
// const SUPABASE_BASE_URL = "https://mnjhkeygyczkziowlrab.supabase.co/functions/v1";
// const SUPABASE_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uamhrZXlneWN6a3ppb3dscmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODQ4NzcsImV4cCI6MjA2NzQ2MDg3N30.9unaHI1ZXmSLMDf1szwmsR6oGXpDrn7-MTH-YXH5hng";

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

export const getAiChatResponse = async (message: string, companyName: string): Promise<string> => {
  const response = await axios.post(
    `${SUPABASE_BASE_URL}/ai-chat`,
    { message, companyName },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_BEARER_TOKEN}`
      },
    }
  );

  return response.data.reply;
};



export const GetChartAnalysis = async (
  imageUri: string,
): Promise<FormattedAnalysis> => {
  try {
    console.log("GEMINI_SERVICE: Starting direct image processing with Gemini for URI:", imageUri);
    
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const supabaseEdgeUrl = `${SUPABASE_BASE_URL}/chart-analysis`;
    console.log('GEMINI_SERVICE: Sending request to Supabase Edge Function for direct Gemini processing...');
    
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
      }
    );

    console.log("GEMINI_SERVICE: Received response from Gemini image processing");

    if (!response.data?.summary || !response.data?.signal) {
      console.warn("GEMINI_SERVICE: Invalid response format from Gemini image processing", response.data);
      throw new Error("Failed to process image with Gemini: Invalid format");
    }

    return response.data;
  } catch (error) {
    console.error("GEMINI_SERVICE: Error processing image with Gemini:", error);
    if (axios.isAxiosError(error)) {
      console.error('GEMINI_SERVICE: Axios error details:', {
        message: error.message,
        code: error.code,
        config: error.config,
        request: error.request ? 'has request object' : 'no request object',
        response: error.response ? {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers,
        } : 'no response object',
      });
    }
    throw new Error(
      "Failed to process image with Gemini. Please try again with a clearer image."
    );
  }
};
