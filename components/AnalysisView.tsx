import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the structure of the AI analysis response
export interface FormattedAnalysis {
  imageUri: string;
  summary: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  signal?: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  confidence: number;
  keyPoints: string[];
  strategy: string;
  // Crypto-specific fields
  currentPrice?: string;
  priceChange24h?: string;
  volume24h?: string;
  marketCap?: string;
  supportLevels?: string[];
  resistanceLevels?: string[];
  technicalIndicators?: {
    rsi?: string;
    macd?: string;
    movingAverages?: {
      ma20?: string;
      ma50?: string;
      ma200?: string;
    };
  };
  priceTargets?: {
    shortTerm?: string;
    mediumTerm?: string;
    longTerm?: string;
  };
  riskLevel?: 'Low' | 'Medium' | 'High';
  timeframe?: string;
}

interface AnalysisViewProps {
  analysis: FormattedAnalysis;
  onFullScreen?: () => void;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

// Helper to get confidence level color and description
const getConfidenceStyle = (confidence: number) => {
  if (confidence >= 0.8) {
    return { color: '#22c55e', level: 'Very High', icon: 'checkmark-circle' };
  } else if (confidence >= 0.6) {
    return { color: '#fbbf24', level: 'High', icon: 'checkmark-circle-outline' };
  } else if (confidence >= 0.4) {
    return { color: '#f59e0b', level: 'Moderate', icon: 'help-circle-outline' };
  } else {
    return { color: '#ef4444', level: 'Low', icon: 'warning-outline' };
  }
};

// Helper to get trend color
const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'Bullish': return '#22c55e';
    case 'Bearish': return '#ef4444';
    default: return '#f59e0b';
  }
};

// Helper to get risk level color
const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Low': return '#22c55e';
    case 'Medium': return '#f59e0b';
    case 'High': return '#ef4444';
    default: return '#9ca3af';
  }
};

// Helper to format price change
const formatPriceChange = (change: string) => {
  const isPositive = !change.startsWith('-');
  return {
    color: isPositive ? '#22c55e' : '#ef4444',
    icon: isPositive ? 'trending-up' : 'trending-down'
  };
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  const confidenceStyle = getConfidenceStyle(analysis.confidence);
  const priceChangeStyle = analysis.priceChange24h ? formatPriceChange(analysis.priceChange24h) : null;

  return (
    <ScrollView style={styles.container}>
      {/* Confidence Level Section */}
      <View style={styles.confidenceContainer}>
        <Ionicons name={confidenceStyle.icon as any} size={48} color={confidenceStyle.color} />
        <Text style={styles.confidenceTitle}>Analysis Confidence</Text>
        <Text style={[styles.confidenceLevel, { color: confidenceStyle.color }]}>
          {confidenceStyle.level}
        </Text>
        <Text style={styles.confidencePercentage}>
          {Math.round(analysis.confidence * 100)}%
        </Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceBarFill, 
              { 
                width: `${analysis.confidence * 100}%`,
                backgroundColor: confidenceStyle.color 
              }
            ]} 
          />
        </View>
      </View>

      {/* Market Sentiment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Sentiment</Text>
        <View style={styles.sentimentRow}>
          <View style={styles.sentimentItem}>
            <Text style={styles.sentimentLabel}>Trend</Text>
            <Text style={[styles.sentimentValue, { color: getTrendColor(analysis.trend) }]}>
              {analysis.trend}
            </Text>
          </View>
          {analysis.riskLevel && (
            <View style={styles.sentimentItem}>
              <Text style={styles.sentimentLabel}>Risk Level</Text>
              <Text style={[styles.sentimentValue, { color: getRiskLevelColor(analysis.riskLevel) }]}>
                {analysis.riskLevel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Price Info Section */}
      {(analysis.currentPrice || analysis.priceChange24h || analysis.volume24h) && (
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Price Information</Text>
          <View style={styles.priceGrid}>
            {analysis.currentPrice && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Current Price</Text>
                <Text style={styles.priceValue}>{analysis.currentPrice}</Text>
              </View>
            )}
            {analysis.priceChange24h && priceChangeStyle && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>24h Change</Text>
                <View style={styles.priceChangeRow}>
                  <Ionicons name={priceChangeStyle.icon as any} size={16} color={priceChangeStyle.color} />
                  <Text style={[styles.priceValue, { color: priceChangeStyle.color }]}>
                    {analysis.priceChange24h}
                  </Text>
                </View>
              </View>
            )}
            {analysis.volume24h && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>24h Volume</Text>
                <Text style={styles.priceValue}>{analysis.volume24h}</Text>
              </View>
            )}
            {analysis.marketCap && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Market Cap</Text>
                <Text style={styles.priceValue}>{analysis.marketCap}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Technical Indicators Section */}
      {analysis.technicalIndicators && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Indicators</Text>
          <View style={styles.indicatorGrid}>
            {analysis.technicalIndicators.rsi && (
              <View style={styles.indicatorItem}>
                <Text style={styles.indicatorLabel}>RSI</Text>
                <Text style={styles.indicatorValue}>{analysis.technicalIndicators.rsi}</Text>
              </View>
            )}
            {analysis.technicalIndicators.macd && (
              <View style={styles.indicatorItem}>
                <Text style={styles.indicatorLabel}>MACD</Text>
                <Text style={styles.indicatorValue}>{analysis.technicalIndicators.macd}</Text>
              </View>
            )}
            {analysis.technicalIndicators.movingAverages?.ma20 && (
              <View style={styles.indicatorItem}>
                <Text style={styles.indicatorLabel}>MA20</Text>
                <Text style={styles.indicatorValue}>{analysis.technicalIndicators.movingAverages.ma20}</Text>
              </View>
            )}
            {analysis.technicalIndicators.movingAverages?.ma50 && (
              <View style={styles.indicatorItem}>
                <Text style={styles.indicatorLabel}>MA50</Text>
                <Text style={styles.indicatorValue}>{analysis.technicalIndicators.movingAverages.ma50}</Text>
              </View>
            )}
            {analysis.technicalIndicators.movingAverages?.ma200 && (
              <View style={styles.indicatorItem}>
                <Text style={styles.indicatorLabel}>MA200</Text>
                <Text style={styles.indicatorValue}>{analysis.technicalIndicators.movingAverages.ma200}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Support & Resistance Levels */}
      {(analysis.supportLevels?.length || analysis.resistanceLevels?.length) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Levels</Text>
          {analysis.supportLevels?.length && (
            <View style={styles.levelGroup}>
              <Text style={styles.levelTitle}>Support Levels</Text>
              {analysis.supportLevels.map((level, index) => (
                <View key={index} style={styles.levelRow}>
                  <Ionicons name="arrow-down" size={16} color="#22c55e" />
                  <Text style={[styles.levelText, { color: '#22c55e' }]}>{level}</Text>
                </View>
              ))}
            </View>
          )}
          {analysis.resistanceLevels?.length && (
            <View style={styles.levelGroup}>
              <Text style={styles.levelTitle}>Resistance Levels</Text>
              {analysis.resistanceLevels.map((level, index) => (
                <View key={index} style={styles.levelRow}>
                  <Ionicons name="arrow-up" size={16} color="#ef4444" />
                  <Text style={[styles.levelText, { color: '#ef4444' }]}>{level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Price Targets */}
      {analysis.priceTargets && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Targets</Text>
          <View style={styles.targetGrid}>
            {analysis.priceTargets.shortTerm && (
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Short Term</Text>
                <Text style={styles.targetValue}>{analysis.priceTargets.shortTerm}</Text>
              </View>
            )}
            {analysis.priceTargets.mediumTerm && (
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Medium Term</Text>
                <Text style={styles.targetValue}>{analysis.priceTargets.mediumTerm}</Text>
              </View>
            )}
            {analysis.priceTargets.longTerm && (
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Long Term</Text>
                <Text style={styles.targetValue}>{analysis.priceTargets.longTerm}</Text>
              </View>
            )}
          </View>
        </View>
      )}

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

      {/* Analysis Notes Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Notes</Text>
        <Text style={styles.sectionContent}>{analysis.strategy}</Text>
        {analysis.timeframe && (
          <Text style={styles.timeframeText}>Analysis Timeframe: {analysis.timeframe}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111827',
  },
  confidenceContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  confidenceTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  confidenceLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidencePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  confidenceBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sentimentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sentimentItem: {
    alignItems: 'center',
    flex: 1,
  },
  sentimentLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sentimentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  priceSection: {
    marginBottom: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceItem: {
    width: '48%',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: 'bold',
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    flex: 1,
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  indicatorItem: {
    width: '48%',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  indicatorLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '600',
  },
  indicatorValue: {
    fontSize: 16,
    color: '#22d3ee',
    fontWeight: 'bold',
  },
  levelGroup: {
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetItem: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '600',
  },
  targetValue: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 'bold',
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
  timeframeText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AnalysisView;
