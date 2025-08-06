import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketResearchReport, getAiChatResponse } from '../services/aiServices';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
}

interface MarketResearchReportViewProps {
  report: MarketResearchReport | null;
  chatHistory: ChatMessage[];
  onChatHistoryChange: (messages: ChatMessage[]) => void;
}

const suggestionChips = [
  'What are the key growth drivers for this company?',
  'How does its growth compare to competitors?',
  'What are the biggest risks to its growth?',
  'What is the projected revenue growth for the next year?',
];

const MarketResearchReportView: React.FC<MarketResearchReportViewProps> = ({ report, chatHistory, onChatHistoryChange }) => {
    const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!report) {
    return null;
  }

  const handleSuggestionPress = (suggestion: string) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

    const handleSend = async (message?: string) => {
    const text = message || input;
    if (text.trim() && !isLoading) {
      const userMessage = { text, sender: 'user' as const };
      const newMessages = [...chatHistory, userMessage];
      onChatHistoryChange(newMessages);
      setInput('');
      setIsLoading(true);

      try {
        const aiResponse = await getAiChatResponse(text, report.companyName);
        const aiMessage = { text: aiResponse, sender: 'ai' as const };
        onChatHistoryChange([...newMessages, aiMessage]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage = { text: 'Sorry, something went wrong.', sender: 'ai' as const };
        onChatHistoryChange([...newMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return styles.buy;
      case 'hold':
        return styles.hold;
      case 'sell':
        return styles.sell;
      default:
        return {};
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.section, styles.recommendationSection]}>
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <Text style={[styles.recommendationText, getRecommendationStyle(report.recommendation)]}>
          {report.recommendation.toUpperCase()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.paragraph}>{report.summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Highlights</Text>
        <View style={styles.financialsGrid}>
          <View style={styles.financialsItem}>
            <Text style={styles.financialsLabel}>Revenue</Text>
            <Text style={styles.financialsValue}>{report.financials.revenue}</Text>
          </View>
          <View style={styles.financialsItem}>
            <Text style={styles.financialsLabel}>Net Income</Text>
            <Text style={styles.financialsValue}>{report.financials.netIncome}</Text>
          </View>
          <View style={styles.financialsItem}>
            <Text style={styles.financialsLabel}>EPS</Text>
            <Text style={styles.financialsValue}>{report.financials.eps}</Text>
          </View>
          <View style={styles.financialsItem}>
            <Text style={styles.financialsLabel}>P/E Ratio</Text>
            <Text style={styles.financialsValue}>{report.financials.peRatio}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Growth Potential</Text>
        <Text style={styles.paragraph}>{report.growthPotential}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Competitors</Text>
        <Text style={styles.paragraph}>{report.competitors.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risks</Text>
        <Text style={styles.paragraph}>{report.risks}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ask AI</Text>
        <FlatList
          data={chatHistory}
          renderItem={({ item }) => (
            <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        {isLoading && <ActivityIndicator style={{ marginTop: 10 }} size="small" color="#22d3ee" />}
        <View style={styles.suggestionChipsContainer}>
          {suggestionChips.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionChipText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor="#9ca3af"
          />
                    <TouchableOpacity onPress={() => handleSend()} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
  },
  recommendationSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  recommendationText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buy: { color: '#10b981' },
  hold: { color: '#f59e0b' },
  sell: { color: '#ef4444' },
  financialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialsItem: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  financialsLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 5,
  },
  financialsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#22d3ee',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#374151',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    color: '#f9fafb',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#22d3ee',
    borderRadius: 20,
    padding: 10,
  },
  suggestionChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  suggestionChip: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  suggestionChipText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});

export default MarketResearchReportView;
