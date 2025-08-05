import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the structure of the AI analysis response
export interface FormattedAnalysis {
  imageUri: string;
  summary: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  confidence: number;
  keyPoints: string[];
  strategy: string;
}

interface AnalysisViewProps {
  analysis: FormattedAnalysis;
}

// Helper to get color and icon based on trend/signal
const getSignalStyle = (signal: FormattedAnalysis['signal']) => {
  switch (signal) {
    case 'Strong Buy':
    case 'Buy':
      return { color: '#22c55e', icon: 'arrow-up-circle' };
    case 'Strong Sell':
    case 'Sell':
      return { color: '#ef4444', icon: 'arrow-down-circle' };
    default:
      return { color: '#f59e0b', icon: 'pause-circle' };
  }
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  const signalStyle = getSignalStyle(analysis.signal);

  return (
    <View style={styles.container}>
      {/* Signal Section */}
      <View style={styles.signalContainer}>
        <Ionicons name={signalStyle.icon as any} size={48} color={signalStyle.color} />
        <Text style={[styles.signalText, { color: signalStyle.color }]}>{analysis.signal}</Text>
        <Text style={styles.confidenceText}>
          Confidence: {Math.round(analysis.confidence * 100)}%
        </Text>
      </View>

      {/* Summary Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.sectionContent}>{analysis.summary}</Text>
      </View>

      {/* Key Points Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Points</Text>
        {analysis.keyPoints.map((point, index) => (
          <View key={index} style={styles.keyPointRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#38bdf8" style={styles.keyPointIcon} />
            <Text style={styles.sectionContent}>{point}</Text>
          </View>
        ))}
      </View>

      {/* Strategy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested Strategy</Text>
        <Text style={styles.sectionContent}>{analysis.strategy}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  signalContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 16,
  },
  signalText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    flex: 1,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyPointIcon: {
    marginRight: 8,
    marginTop: 2,
  },
});

export default AnalysisView;
