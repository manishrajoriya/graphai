import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MarketResearchReport, getAiChatResponse } from '../services/aiServices';
import subscriptionService from '../services/subscriptionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface MarketResearchReportViewProps {
  report: MarketResearchReport | null;
  chatHistory: ChatMessage[];
  onChatHistoryChange: (messages: ChatMessage[]) => void;
  onRequireSubscription?: () => void;
}

const suggestionChips = [
  'What are the key growth drivers for this company?',
  'How does its growth compare to competitors?',
  'What are the biggest risks to its growth?',
  'What is the projected revenue growth for the next year?',
  'What is the current market sentiment?',
  'How stable is the dividend yield?',
];

const MarketResearchReportView: React.FC<MarketResearchReportViewProps> = ({ 
  report, 
  chatHistory, 
  onChatHistoryChange,
  onRequireSubscription,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Memoized recommendation style function
  const getRecommendationStyle = useCallback((recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'buy':
      case 'strong buy':
        return styles.buy;
      case 'hold':
      case 'neutral':
        return styles.hold;
      case 'sell':
      case 'strong sell':
        return styles.sell;
      default:
        return styles.neutral;
    }
  }, []);

  // Generate unique ID for messages
  const generateMessageId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    if (isLoading) return;
    setInput(suggestion);
    handleSend(suggestion);
  }, [isLoading]);

  const handleSend = useCallback(async (message?: string) => {
    const text = message || input.trim();
    
    if (!text || isLoading) return;
    
    if (!report?.companyName) {
      Alert.alert('Error', 'Company information is not available for AI chat.');
      return;
    }

    // Require subscription before AI chat
    try {
       const status = await subscriptionService.checkSubscriptionStatus();
      const hasAccess = status.isSubscribed
      if (!hasAccess) {
        onRequireSubscription?.();
        return;
      }
    } catch (e) {
      onRequireSubscription?.();
      return;
    }

    const userMessage: ChatMessage = { 
      id: generateMessageId(),
      text, 
      sender: 'user',
      timestamp: new Date()
    };
    
    const newMessages = [...chatHistory, userMessage];
    onChatHistoryChange(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAiChatResponse(text, report.companyName);
      
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('Empty response from AI service');
      }

      const aiMessage: ChatMessage = { 
        id: generateMessageId(),
        text: aiResponse, 
        sender: 'ai',
        timestamp: new Date()
      };
      
      onChatHistoryChange([...newMessages, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = { 
        id: generateMessageId(),
        text: 'Sorry, I encountered an error while processing your request. Please try again later.', 
        sender: 'ai',
        timestamp: new Date()
      };
      
      onChatHistoryChange([...newMessages, errorMessage]);
      
      // Show user-friendly error alert
      Alert.alert(
        'Connection Error', 
        'Unable to get AI response. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatHistory, onChatHistoryChange, report?.companyName, generateMessageId]);

  // Memoized financial data with error handling
  const financialData = useMemo(() => {
    if (!report?.financials) return [];
    
    return [
      { label: 'Revenue', value: report.financials.revenue || 'N/A' },
      { label: 'Net Income', value: report.financials.netIncome || 'N/A' },
      { label: 'EPS', value: report.financials.eps || 'N/A' },
      { label: 'P/E Ratio', value: report.financials.peRatio || 'N/A' },
    ];
  }, [report?.financials]);

  // Render chat message item
  const renderChatMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.message, 
      item.sender === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTimestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  ), []);

  // Render financial item
  const renderFinancialItem = useCallback(({ item }: { item: { label: string; value: string } }) => (
    <View style={styles.financialsItem}>
      <Text style={styles.financialsLabel}>{item.label}</Text>
      <Text style={styles.financialsValue}>{item.value}</Text>
    </View>
  ), []);

  if (!report) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No report data available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{report.companyName || 'Market Research'}</Text>
          <Text style={styles.headerSubtitle}>Investment Analysis</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
        {/* Recommendation Section */}
        <View style={[styles.section, styles.recommendationSection]}>
          <Text style={styles.sectionTitle}>Investment Recommendation</Text>
          <Text style={[
            styles.recommendationText, 
            getRecommendationStyle(report.recommendation)
          ]}>
            {report.recommendation?.toUpperCase() || 'N/A'}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>
            {report.summary || 'No summary available.'}
          </Text>
        </View>

        {/* Financial Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Highlights</Text>
          <FlatList
            data={financialData}
            renderItem={renderFinancialItem}
            keyExtractor={(item) => item.label}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.financialsRow}
          />
        </View>

        {/* Growth Potential */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Potential</Text>
          <Text style={styles.paragraph}>
            {report.growthPotential || 'No growth analysis available.'}
          </Text>
        </View>

        {/* Competitors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Competitors</Text>
          <Text style={styles.paragraph}>
            {report.competitors?.length ? report.competitors.join(', ') : 'No competitor data available.'}
          </Text>
        </View>

        {/* Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <Text style={styles.paragraph}>
            {report.risks || 'No risk assessment available.'}
          </Text>
        </View>

        {/* AI Chat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Assistant</Text>
          
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <View style={styles.chatContainer}>
              <FlatList
                data={chatHistory}
                renderItem={renderChatMessage}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.chatHistory}
              />
            </View>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#22d3ee" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
          
          {/* Suggestion Chips */}
          <View style={styles.suggestionChipsContainer}>
            <Text style={styles.suggestionTitle}>Quick Questions:</Text>
            <View style={styles.chipsWrapper}>
              {suggestionChips.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    isLoading && styles.suggestionChipDisabled
                  ]}
                  onPress={() => handleSuggestionPress(suggestion)}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.suggestionChipText,
                    isLoading && styles.suggestionChipTextDisabled
                  ]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question about this company..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity 
              onPress={() => handleSend()} 
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              disabled={!input.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={(!input.trim() || isLoading) ? "#6b7280" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: SCREEN_HEIGHT - 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    minHeight: SCREEN_HEIGHT - 120,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  section: {
    marginBottom: 28,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 16,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
  },
  recommendationSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#22d3ee',
    marginBottom: 28,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recommendationText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  buy: { 
    color: '#10b981',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hold: { 
    color: '#f59e0b',
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sell: { 
    color: '#ef4444',
    textShadowColor: 'rgba(239, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  neutral: {
    color: '#9ca3af',
  },
  financialsRow: {
    justifyContent: 'space-between',
  },
  financialsItem: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 24,
    width: (SCREEN_WIDTH - 64) / 2,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  financialsLabel: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  financialsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  chatContainer: {
    marginBottom: 24,
    minHeight: 200,
  },
  chatHistory: {
    maxHeight: 400,
    paddingVertical: 8,
  },
  message: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userMessage: {
    backgroundColor: '#22d3ee',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#475569',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  messageTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionChipsContainer: {
    marginBottom: 24,
  },
  suggestionTitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -6,
  },
  suggestionChip: {
    backgroundColor: '#334155',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionChipDisabled: {
    opacity: 0.4,
  },
  suggestionChipText: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  suggestionChipTextDisabled: {
    color: '#64748b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: '#334155',
    paddingTop: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: '#f1f5f9',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#475569',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#22d3ee',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
    minHeight: 52,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
});

export default MarketResearchReportView;