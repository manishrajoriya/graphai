import React from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormattedAnalysis } from './AnalysisView';

interface AnalysisModalProps {
  visible: boolean;
  analysis: FormattedAnalysis | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

const AnalysisModal: React.FC<AnalysisModalProps> = ({ visible, analysis, onClose }) => {
  if (!analysis) return null;

  const confidenceStyle = getConfidenceStyle(analysis.confidence);
  const priceChangeStyle = analysis.priceChange24h ? formatPriceChange(analysis.priceChange24h) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chart Analysis</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#e5e7eb" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Confidence Level Section */}
          <View style={styles.confidenceContainer}>
            <Ionicons name={confidenceStyle.icon as any} size={64} color={confidenceStyle.color} />
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

          {/* Price Information */}
          {(analysis.currentPrice || analysis.priceChange24h || analysis.volume24h) && (
            <View style={styles.section}>
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
                      <Ionicons name={priceChangeStyle.icon as any} size={18} color={priceChangeStyle.color} />
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

          {/* Technical Indicators */}
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

          {/* Key Levels */}
          {(analysis.supportLevels?.length || analysis.resistanceLevels?.length) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Levels</Text>
              {analysis.supportLevels?.length && (
                <View style={styles.levelGroup}>
                  <Text style={styles.levelTitle}>Support Levels</Text>
                  {analysis.supportLevels.map((level, index) => (
                    <View key={index} style={styles.levelRow}>
                      <Ionicons name="arrow-down" size={18} color="#22c55e" />
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
                      <Ionicons name="arrow-up" size={18} color="#ef4444" />
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

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Summary</Text>
            <Text style={styles.sectionContent}>{analysis.summary}</Text>
          </View>

          {/* Key Points */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Observations</Text>
            {analysis.keyPoints.map((point, index) => (
              <View key={index} style={styles.keyPointRow}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#38bdf8" style={styles.keyPointIcon} />
                <Text style={styles.sectionContent}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Strategy */}
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={styles.sectionTitle}>Analysis Notes</Text>
            <Text style={styles.sectionContent}>{analysis.strategy}</Text>
            {analysis.timeframe && (
              <Text style={styles.timeframeText}>Analysis Timeframe: {analysis.timeframe}</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginVertical: 30,
    padding: 30,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  confidenceTitle: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  confidenceLevel: {
    fontSize: 24,
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
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    flex: 1,
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
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  sentimentValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceItem: {
    width: '48%',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    color: '#e5e7eb',
    fontWeight: 'bold',
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  indicatorItem: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  indicatorLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '600',
  },
  indicatorValue: {
    fontSize: 16,
    color: '#22d3ee',
    fontWeight: 'bold',
  },
  levelGroup: {
    marginBottom: 20,
  },
  levelTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  targetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetItem: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '600',
  },
  targetValue: {
    fontSize: 16,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyPointIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  timeframeText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default AnalysisModal;
