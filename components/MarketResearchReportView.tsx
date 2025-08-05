import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketResearchReport } from '../services/aiServices';

interface MarketResearchReportViewProps {
  report: MarketResearchReport | null;
}

const MarketResearchReportView: React.FC<MarketResearchReportViewProps> = ({ report }) => {
  if (!report) {
    return null;
  }

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
});

export default MarketResearchReportView;
