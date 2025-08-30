import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RateLimitStatus from './RateLimitStatus';

interface ChartAnalysisHeaderProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onRateLimitPress?: () => void;
  analysisCount?: number;
}

const ChartAnalysisHeader: React.FC<ChartAnalysisHeaderProps> = ({
  onAnalyze,
  isAnalyzing,
  onRateLimitPress,
  analysisCount = 0
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics-outline" size={28} color="#22d3ee" />
          <Text style={styles.title}>Chart Analysis</Text>
          {analysisCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{analysisCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>AI-powered crypto chart analysis</Text>
      </View>

      <View style={styles.controlsSection}>
        <RateLimitStatus 
          onPress={onRateLimitPress}
          style={styles.rateLimitStatus}
        />
        
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            isAnalyzing && styles.analyzeButtonDisabled
          ]}
          onPress={onAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="#9ca3af" />
              <Text style={styles.analyzeButtonTextDisabled}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="scan-outline" size={20} color="#ffffff" />
              <Text style={styles.analyzeButtonText}>Analyze Chart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e7eb',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 40,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateLimitStatus: {
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 140,
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#374151',
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButtonTextDisabled: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChartAnalysisHeader;
