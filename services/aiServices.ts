import axios from "axios";
import * as FileSystem from "expo-file-system";


//const SUPABASE_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
//const SUPABASE_BEARER_TOKEN = process.env.EXPO_PUBLIC_SUPABASE_BEARER_TOKEN;
// console.log('GEMINI_SERVICE: Supabase base URL:', SUPABASE_BASE_URL);
// console.log('GEMINI_SERVICE: Supabase bearer token:', SUPABASE_BEARER_TOKEN);

const SUPABASE_BASE_URL = "https://mnjhkeygyczkziowlrab.supabase.co/functions/v1";
const SUPABASE_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uamhrZXlneWN6a3ppb3dscmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODQ4NzcsImV4cCI6MjA2NzQ2MDg3N30.9unaHI1ZXmSLMDf1szwmsR6oGXpDrn7-MTH-YXH5hng";


export const GetChartAnalysis = async (
  imageUri: string,
): Promise<{text: string, answer: string}> => {
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

    if (!response.data?.text || !response.data?.answer) {
      console.warn("GEMINI_SERVICE: Invalid response from Gemini image processing");
      throw new Error("Failed to process image with Gemini");
    }

    return {
      text: response.data.text,
      answer: response.data.answer
    };
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
