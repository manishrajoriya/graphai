import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { message, companyName, sessionId, marketResearchData } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({
        error: "Missing message"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "API key not configured"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client for context storage
    let supabase = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    // Build context from multiple sources
    let contextData = null;
    
    // 1. Try to get context from provided market research data
    if (marketResearchData) {
      contextData = marketResearchData;
    }
    // 2. Try to get context from database if sessionId provided
    else if (supabase && sessionId) {
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('context_data, company_name')
          .eq('session_id', sessionId)
          .single();
        
        if (!error && data) {
          contextData = data.context_data;
          companyName = companyName || data.company_name;
        }
      } catch (dbError) {
        console.warn("Could not retrieve context from database:", dbError);
      }
    }

    // Build enhanced prompt with context
    let prompt = '';
    
    if (contextData && companyName) {
      prompt = `
You are an AI financial analyst assistant specializing in market research and investment analysis.

MARKET RESEARCH CONTEXT: You have access to comprehensive market research data for "${companyName}":

Company Overview:
- Name: ${contextData.companyName || companyName}
- Stock Symbol: ${contextData.symbol || 'N/A'}
- Executive Summary: ${contextData.summary || 'No summary available'}

Financial Performance:
- Annual Revenue: ${contextData.financials?.revenue || 'N/A'}
- Net Income: ${contextData.financials?.netIncome || 'N/A'}
- Earnings Per Share (EPS): ${contextData.financials?.eps || 'N/A'}
- Price-to-Earnings Ratio: ${contextData.financials?.peRatio || 'N/A'}

Growth Analysis:
${contextData.growthPotential || 'No growth analysis available'}

Competitive Landscape:
Key Competitors: ${contextData.competitors?.join(', ') || 'No competitor data available'}

Risk Assessment:
${contextData.risks || 'No risk assessment available'}

Investment Recommendation: ${contextData.recommendation || 'N/A'}

Based on this comprehensive market research data, please provide a detailed, professional response to the following question. Reference specific data points from the research when relevant:

User Question: "${message}"

Guidelines:
- Use specific financial metrics and data from the research
- Compare with industry standards when relevant
- Provide actionable insights based on the data
- Maintain a professional, analytical tone
- If asked about competitors, risks, or growth, reference the specific research data
      `.trim();
    } else if (companyName) {
      prompt = `
You are an AI financial analyst assistant for "${companyName}".

Note: No detailed market research context is currently available for this company. Please provide the best answer you can based on your general knowledge about ${companyName}, but recommend conducting a comprehensive market research analysis for more specific and accurate insights.

User Question: "${message}"

Please mention that for more detailed analysis including current financials, competitor analysis, and specific risk assessment, a market research report should be generated first.
      `.trim();
    } else {
      prompt = `
You are an AI financial analyst assistant specializing in market research and investment analysis.

User Question: "${message}"

Please provide a helpful response based on general financial and market knowledge. If the question is about a specific company, recommend generating a market research report first for detailed analysis.
      `.trim();
    }

    console.log(`Processing chat request for: ${companyName || 'General'}, Has Context: ${!!contextData}`);

    // Make request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return new Response(JSON.stringify({
        error: "Gemini API error",
        details: data
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      return new Response(JSON.stringify({
        error: "No reply from Gemini API"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Store conversation in database if possible
    if (supabase && sessionId) {
      try {
        await supabase
          .from('chat_sessions')
          .upsert({
            session_id: sessionId,
            company_name: companyName,
            context_data: contextData,
            last_message: message,
            last_response: reply,
            updated_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn("Could not store conversation:", dbError);
      }
    }

    return new Response(JSON.stringify({
      reply,
      hasContext: !!contextData,
      companyName: companyName || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
