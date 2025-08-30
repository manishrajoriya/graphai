import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionContext } from '../hooks/useSessionContext';
import ContextIndicator from './ContextIndicator';

interface ChatMessage {
  id: string;
  message: string;
  reply: string;
  timestamp: Date;
  hasContext: boolean;
}

interface ChatWithContextProps {
  companyName?: string;
  marketResearchData?: any;
  onContextUpdate?: (hasContext: boolean) => void;
}

const ChatWithContext: React.FC<ChatWithContextProps> = ({
  companyName,
  marketResearchData,
  onContextUpdate
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    sessionData,
    isLoading,
    initializeSession,
    updateMarketResearchContext,
    sendMessageWithContext,
    getContextSummary
  } = useSessionContext();

  // Initialize session when component mounts or context changes
  useEffect(() => {
    if (!sessionData) {
      initializeSession(companyName, marketResearchData);
    } else if (marketResearchData) {
      updateMarketResearchContext(marketResearchData, companyName);
    }
  }, [companyName, marketResearchData, sessionData, initializeSession, updateMarketResearchContext]);

  // Update parent component about context status
  useEffect(() => {
    const contextSummary = getContextSummary();
    if (onContextUpdate && contextSummary) {
      onContextUpdate(contextSummary.hasMarketResearch);
    }
  }, [sessionData, onContextUpdate, getContextSummary]);

  // Sync messages with session data
  useEffect(() => {
    if (sessionData?.conversationHistory) {
      const formattedMessages: ChatMessage[] = sessionData.conversationHistory.map((conv, index) => ({
        id: `msg_${index}`,
        message: conv.message,
        reply: conv.reply,
        timestamp: conv.timestamp,
        hasContext: conv.hasContext
      }));
      setMessages(formattedMessages);
    }
  }, [sessionData?.conversationHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessageWithContext(messageToSend);
      
      // Scroll to bottom after message is sent
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add error handling UI here
    }
  };

  const contextSummary = getContextSummary();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Context Status */}
      <ContextIndicator
        hasContext={contextSummary?.hasMarketResearch || false}
        companyName={contextSummary?.companyName}
        conversationCount={contextSummary?.conversationCount || 0}
      />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>
              {contextSummary?.hasMarketResearch 
                ? `Ask questions about ${contextSummary.companyName}`
                : 'Start a conversation about market research'
              }
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageGroup}>
            {/* User Message */}
            <View style={styles.userMessageContainer}>
              <View style={styles.userMessage}>
                <Text style={styles.userMessageText}>{msg.message}</Text>
              </View>
            </View>

            {/* AI Response */}
            <View style={styles.aiMessageContainer}>
              <View style={styles.aiMessage}>
                <View style={styles.aiMessageHeader}>
                  <Ionicons name="sparkles" size={16} color="#22d3ee" />
                  <Text style={styles.aiLabel}>AI Assistant</Text>
                  {msg.hasContext && (
                    <View style={styles.contextBadge}>
                      <Text style={styles.contextBadgeText}>Context</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.aiMessageText}>{msg.reply}</Text>
              </View>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#22d3ee" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder={
            contextSummary?.hasMarketResearch 
              ? `Ask about ${contextSummary.companyName}...`
              : 'Ask a question...'
          }
          placeholderTextColor="#6b7280"
          multiline
          maxLength={500}
          editable={!isLoading}
          onFocus={() => {
            // Scroll to bottom when input is focused
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={(!inputMessage.trim() || isLoading) ? '#6b7280' : '#ffffff'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  messageGroup: {
    marginBottom: 24,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#3b82f6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  aiMessage: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  aiLabel: {
    fontSize: 12,
    color: '#22d3ee',
    fontWeight: '600',
    flex: 1,
  },
  contextBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  contextBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  aiMessageText: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e5e7eb',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
  },
});

export default ChatWithContext;
