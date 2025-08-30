import { useState, useEffect, useCallback } from 'react';
import { getAiChatResponse } from '../services/aiServices';

interface SessionContextData {
  sessionId: string;
  companyName?: string;
  marketResearchData?: any;
  conversationHistory: Array<{
    message: string;
    reply: string;
    timestamp: Date;
    hasContext: boolean;
  }>;
  onConversationUpdate?: (data: SessionContextData) => void;
}

export const useSessionContext = () => {
  const [sessionData, setSessionData] = useState<SessionContextData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize session
  const initializeSession = useCallback((companyName?: string, marketResearchData?: any) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setSessionData(prev => {
      // Only initialize if no session exists
      if (prev) return prev;
      
      return {
        sessionId,
        companyName,
        marketResearchData,
        conversationHistory: []
      };
    });

    return sessionId;
  }, []);

  // Update market research context
  const updateMarketResearchContext = useCallback((marketResearchData: any, companyName?: string) => {
    setSessionData(prev => {
      if (!prev) return null;
      
      // Only update if data has actually changed
      const hasChanged = 
        prev.marketResearchData?.companyName !== marketResearchData?.companyName ||
        prev.marketResearchData?.symbol !== marketResearchData?.symbol ||
        prev.companyName !== companyName;
      
      if (!hasChanged) return prev;
      
      return {
        ...prev,
        marketResearchData,
        companyName: companyName || prev.companyName
      };
    });
  }, []);

  // Send message with context
  const sendMessageWithContext = useCallback(async (message: string) => {
    if (!sessionData) {
      throw new Error('No active session. Initialize session first.');
    }

    setIsLoading(true);
    
    try {
      const response = await getAiChatResponse(
        message,
        sessionData.companyName,
        sessionData.sessionId,
        sessionData.marketResearchData
      );

      // Add to conversation history
      const newConversation = {
        message,
        reply: response.reply,
        timestamp: new Date(),
        hasContext: response.hasContext
      };

      setSessionData(prev => {
        if (!prev) return null;
        
        const updatedData = {
          ...prev,
          conversationHistory: [...prev.conversationHistory, newConversation]
        };
        
        // Trigger auto-save callback if available
        if (prev.onConversationUpdate) {
          setTimeout(() => prev.onConversationUpdate?.(updatedData), 100);
        }
        
        return updatedData;
      });

      return response;
    } finally {
      setIsLoading(false);
    }
  }, [sessionData]);

  // Clear session
  const clearSession = useCallback(() => {
    setSessionData(null);
  }, []);

  // Get context summary
  const getContextSummary = useCallback(() => {
    if (!sessionData) return null;

    return {
      hasSession: true,
      sessionId: sessionData.sessionId,
      companyName: sessionData.companyName,
      hasMarketResearch: !!sessionData.marketResearchData,
      conversationCount: sessionData.conversationHistory.length,
      lastContextUsed: sessionData.conversationHistory.some(conv => conv.hasContext)
    };
  }, [sessionData]);

  return {
    sessionData,
    isLoading,
    initializeSession,
    updateMarketResearchContext,
    sendMessageWithContext,
    clearSession,
    getContextSummary
  };
};
