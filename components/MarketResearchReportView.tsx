import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSessionContext } from '../hooks/useSessionContext';
import { MarketResearchReport } from '../services/aiServices';
import ChatWithContext from './ChatWithContext';

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
  onSaveReport?: (chatHistory: ChatMessage[]) => void;
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
  onSaveReport
}) => {
  // Initialize session context with market research data
  const {
    sessionData,
    initializeSession,
    updateMarketResearchContext,
    getContextSummary
  } = useSessionContext();

  // Initialize session when report is available
  React.useEffect(() => {
    if (report && !sessionData) {
      const autoSaveCallback = (updatedData: any) => {
        if (onSaveReport && updatedData.conversationHistory.length > 0) {
          const chatMessages: ChatMessage[] = [];
          updatedData.conversationHistory.forEach((conv: any, index: number) => {
            chatMessages.push({
              id: `user_${index}`,
              text: conv.message,
              sender: 'user' as const,
              timestamp: conv.timestamp
            });
            chatMessages.push({
              id: `ai_${index}`,
              text: conv.reply,
              sender: 'ai' as const,
              timestamp: conv.timestamp
            });
          });
          onSaveReport(chatMessages);
        }
      };
      
      initializeSession(report.companyName, report);
      
      // Auto-save will be handled through the onContextUpdate callback
    }
  }, [report, sessionData, onSaveReport]);

  // Update context when report changes
  React.useEffect(() => {
    if (report && sessionData && report.companyName) {
      updateMarketResearchContext(report, report.companyName);
    }
  }, [report?.companyName, report?.symbol, sessionData?.sessionId]);

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
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.companyInfo}>
            <Text style={styles.headerTitle}>{report.companyName || 'Market Research'}</Text>
            {report.symbol && report.symbol !== 'N/A' && (
              <View style={styles.symbolBadge}>
                <Text style={styles.symbolText}>{report.symbol}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>Investment Analysis Report</Text>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationLabel}>Recommendation:</Text>
            <Text style={[styles.recommendationBadge, getRecommendationStyle(report.recommendation)]}>
              {report.recommendation?.toUpperCase() || 'N/A'}
            </Text>
          </View>
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
        {/* Executive Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#22d3ee" />
            <Text style={styles.cardTitle}>Executive Summary</Text>
          </View>
          <Text style={styles.summaryText}>
            {report.summary || 'No summary available.'}
          </Text>
        </View>

        {/* Financial Dashboard */}
        <View style={styles.dashboardCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart-outline" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>Financial Dashboard</Text>
          </View>
          <View style={styles.metricsGrid}>
            {financialData.map((item, index) => (
              <View key={item.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
                <View style={styles.metricIndicator} />
              </View>
            ))}
          </View>
        </View>

        {/* Analysis Grid */}
        <View style={styles.analysisGrid}>
          {/* Growth Potential */}
          <View style={styles.analysisCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#22c55e" />
              <Text style={styles.analysisCardTitle}>Growth Potential</Text>
            </View>
            <Text style={styles.analysisText}>
              {report.growthPotential || 'No growth analysis available.'}
            </Text>
          </View>

          {/* Risk Assessment */}
          <View style={styles.analysisCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning-outline" size={20} color="#f59e0b" />
              <Text style={styles.analysisCardTitle}>Risk Assessment</Text>
            </View>
            <Text style={styles.analysisText}>
              {report.risks || 'No risk assessment available.'}
            </Text>
          </View>
        </View>

        {/* Competitors Section */}
        <View style={styles.competitorsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Key Competitors</Text>
          </View>
          <View style={styles.competitorsList}>
            {report.competitors?.length ? (
              report.competitors.map((competitor, index) => (
                <View key={index} style={styles.competitorItem}>
                  <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
                  <Text style={styles.competitorText}>{competitor}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No competitor data available</Text>
            )}
          </View>
        </View>

        {/* Enhanced AI Chat Section */}
        <View style={styles.chatSection}>
          <View style={styles.enhancedChatHeader}>
            <LinearGradient
              colors={['rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.05)']}
              style={styles.chatHeaderGradient}
            >
              <View style={styles.chatTitleRow}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={20} color="#22d3ee" />
                </View>
                <View style={styles.chatTitleContent}>
                  <Text style={styles.chatTitle}>AI Investment Assistant</Text>
                  <Text style={styles.chatSubtitle}>Ask questions about {report.companyName}</Text>
                </View>
                <View style={styles.chatStatusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          
          {/* Integrated ChatWithContext Component */}
          <View style={styles.chatWithContextContainer}>
            <ChatWithContext
              companyName={report.companyName}
              marketResearchData={report}
              onContextUpdate={(hasContext) => {
                // Auto-save chat history when new messages are added
                if (sessionData?.conversationHistory && sessionData.conversationHistory.length > 0 && onSaveReport) {
                  const chatMessages: ChatMessage[] = [];
                  sessionData.conversationHistory.forEach((conv, index) => {
                    chatMessages.push({
                      id: `user_${index}`,
                      text: conv.message,
                      sender: 'user' as const,
                      timestamp: conv.timestamp
                    });
                    chatMessages.push({
                      id: `ai_${index}`,
                      text: conv.reply,
                      sender: 'ai' as const,
                      timestamp: conv.timestamp
                    });
                  });
                  onSaveReport(chatMessages);
                }
              }}
            />
          </View>
          
          {/* Save Button */}
          {sessionData?.conversationHistory && sessionData.conversationHistory.length > 0 && onSaveReport && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => {
                // Convert session conversation history to ChatMessage format for saving
                const chatMessages: ChatMessage[] = [];
                sessionData.conversationHistory.forEach((conv, index) => {
                  // Add user message
                  chatMessages.push({
                    id: `user_${index}`,
                    text: conv.message,
                    sender: 'user' as const,
                    timestamp: conv.timestamp
                  });
                  // Add AI reply
                  chatMessages.push({
                    id: `ai_${index}`,
                    text: conv.reply,
                    sender: 'ai' as const,
                    timestamp: conv.timestamp
                  });
                });
                onSaveReport(chatMessages);
              }}
            >
              <Ionicons name="save-outline" size={20} color="#22d3ee" />
              <Text style={styles.saveButtonText}>Save Chat History</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingVertical: 28,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(34, 211, 238, 0.3)',
    elevation: 6,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerContent: {
    alignItems: 'center',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  symbolBadge: {
    backgroundColor: '#22d3ee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  recommendationBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
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
    paddingHorizontal: 0,
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
  // Card Components
  summaryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 0,
    padding: 20,
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
    position: 'relative',
  },
  dashboardCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 0,
    padding: 20,
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
    position: 'relative',
  },
  competitorsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 0,
    padding: 20,
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    letterSpacing: -0.3,
  },
  summaryText: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  // Financial Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 16,
    padding: 18,
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2 - 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#22d3ee',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  metricIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#22d3ee',
    borderRadius: 3,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  // Analysis Grid
  analysisGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  analysisCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22d3ee',
    flex: 1,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  analysisText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  // Competitors
  competitorsList: {
    gap: 12,
  },
  competitorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    gap: 12,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  competitorText: {
    fontSize: 15,
    color: '#f1f5f9',
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Chat Section
  chatSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 0,
    padding: 20,
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
    position: 'relative',
  },
  chatHeader: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)',
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  chatTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22d3ee',
    flex: 1,
    letterSpacing: -0.3,
  },
  chatSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    letterSpacing: 0.1,
  },
  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#22d3ee',
    marginBottom: 0,
    marginHorizontal: 0,
    gap: 10,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  chatWithContextContainer: {
    flex: 1,
    minHeight: 400,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  enhancedChatHeader: {
    marginBottom: 16,
  },
  chatHeaderGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatTitleContent: {
    flex: 1,
  },
  chatStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
});

export default MarketResearchReportView;