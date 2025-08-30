import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnalysisLoadingModalProps {
  visible: boolean;
  progress?: number;
  stage?: string;
}

const AnalysisLoadingModal: React.FC<AnalysisLoadingModalProps> = ({ 
  visible, 
  progress = 0, 
  stage = 'Analyzing chart...' 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  const stages = [
    { name: 'Processing image', icon: 'image-outline' },
    { name: 'Analyzing patterns', icon: 'analytics-outline' },
    { name: 'Calculating indicators', icon: 'calculator-outline' },
    { name: 'Generating insights', icon: 'bulb-outline' },
    { name: 'Finalizing analysis', icon: 'checkmark-circle-outline' }
  ];

  const currentStageIndex = Math.min(Math.floor(progress * stages.length), stages.length - 1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Main loading indicator */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22d3ee" />
            <Text style={styles.mainText}>AI Chart Analysis{dots}</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>

          {/* Stage indicators */}
          <View style={styles.stagesContainer}>
            {stages.map((stageItem, index) => (
              <View key={index} style={styles.stageRow}>
                <Ionicons 
                  name={stageItem.icon as any} 
                  size={20} 
                  color={index <= currentStageIndex ? '#22d3ee' : '#6b7280'} 
                />
                <Text 
                  style={[
                    styles.stageText,
                    { color: index <= currentStageIndex ? '#e5e7eb' : '#6b7280' }
                  ]}
                >
                  {stageItem.name}
                </Text>
                {index === currentStageIndex && (
                  <ActivityIndicator size="small" color="#22d3ee" style={styles.stageLoader} />
                )}
              </View>
            ))}
          </View>

          {/* Current stage */}
          <View style={styles.currentStageContainer}>
            <Text style={styles.currentStageText}>{stage}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips for better analysis:</Text>
            <Text style={styles.tipText}>• Use clear, high-resolution chart images</Text>
            <Text style={styles.tipText}>• Ensure indicators are visible</Text>
            <Text style={styles.tipText}>• Include price levels and timeframes</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22d3ee',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '600',
  },
  stagesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  stageText: {
    fontSize: 14,
    flex: 1,
  },
  stageLoader: {
    marginLeft: 8,
  },
  currentStageContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  currentStageText: {
    fontSize: 14,
    color: '#22d3ee',
    textAlign: 'center',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tipsTitle: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default AnalysisLoadingModal;
