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
You are an AI assistant specializing in financial analysis and market research.

CONTEXT: You have previously analyzed "${companyName}" and provided the following market research report:

Company: ${contextData.companyName || companyName}
Stock Symbol: ${contextData.symbol || 'N/A'}
Summary: ${contextData.summary || 'No summary available'}

Financial Data:
- Revenue: ${contextData.financials?.revenue || 'N/A'}
- Net Income: ${contextData.financials?.netIncome || 'N/A'}
- EPS: ${contextData.financials?.eps || 'N/A'}
- P/E Ratio: ${contextData.financials?.peRatio || 'N/A'}

Growth Potential: ${contextData.growthPotential || 'N/A'}
Key Competitors: ${contextData.competitors?.join(', ') || 'N/A'}
Main Risks: ${contextData.risks || 'N/A'}
Investment Recommendation: ${contextData.recommendation || 'N/A'}

Based on this context and your expertise, please answer the following question:

"${message}"

Provide a detailed, professional response that references the market research data when relevant. If the question is about specific financial metrics, growth prospects, competitors, or risks, use the context data to provide accurate information.
      `.trim();
    } else if (companyName) {
      prompt = `
You are an AI assistant specializing in financial analysis and market research for "${companyName}".

Note: No detailed market research context is currently available. Please provide the best answer you can based on your general knowledge, but recommend conducting a market research analysis for more specific insights.

User Question: "${message}"
      `.trim();
    } else {
      prompt = `
You are an AI assistant specializing in financial analysis and market research.

User Question: "${message}"
      `.trim();
    }

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
