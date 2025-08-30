import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RateLimitModalProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  resetTime?: string;
  rateLimitInfo?: {
    maxRequests: number;
    windowMs: number;
    maxRequestsPerDay: number;
  };
}

const RateLimitModal: React.FC<RateLimitModalProps> = ({ 
  visible, 
  onClose, 
  message, 
  resetTime,
  rateLimitInfo 
}) => {
  const formatResetTime = (resetTimeStr?: string) => {
    if (!resetTimeStr) return null;
    
    try {
      const resetDate = new Date(resetTimeStr);
      const now = new Date();
      const diffMs = resetDate.getTime() - now.getTime();
      
      if (diffMs <= 0) return 'Now';
      
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      const diffSeconds = Math.ceil(diffMs / 1000);
      
      if (diffMinutes > 1) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''}`;
      }
    } catch (e) {
      return null;
    }
  };

  const timeUntilReset = formatResetTime(resetTime);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={64} color="#f59e0b" />
          </View>
          
          <Text style={styles.title}>Rate Limit Reached</Text>
          
          <Text style={styles.message}>{message}</Text>
          
          {timeUntilReset && (
            <View style={styles.resetContainer}>
              <Text style={styles.resetLabel}>Try again in:</Text>
              <Text style={styles.resetTime}>{timeUntilReset}</Text>
            </View>
          )}
          
          {rateLimitInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Rate Limit Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max requests per minute:</Text>
                <Text style={styles.infoValue}>{rateLimitInfo.maxRequests}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max requests per day:</Text>
                <Text style={styles.infoValue}>{rateLimitInfo.maxRequestsPerDay}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Window duration:</Text>
                <Text style={styles.infoValue}>{rateLimitInfo.windowMs / 1000}s</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  resetContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  resetLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  resetTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  infoContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  infoValue: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RateLimitModal;
