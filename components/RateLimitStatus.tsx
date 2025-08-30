import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRateLimitInfo } from '../services/aiServices';

interface RateLimitStatusProps {
  onPress?: () => void;
  style?: any;
}

const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ onPress, style }) => {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: 10,
    maxRequests: 10,
    windowMs: 60000,
    cooldownMs: 2000,
    nextRequestAllowed: 0
  });
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  useEffect(() => {
    const updateRateLimitInfo = () => {
      const info = getRateLimitInfo();
      setRateLimitInfo(info);
      
      const now = Date.now();
      const timeUntil = Math.max(0, info.nextRequestAllowed - now);
      setTimeUntilNext(timeUntil);
    };

    updateRateLimitInfo();
    const interval = setInterval(updateRateLimitInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (timeUntilNext > 0) return '#ef4444'; // Red - cooling down
    if (rateLimitInfo.remaining <= 2) return '#f59e0b'; // Orange - low remaining
    return '#22c55e'; // Green - good to go
  };

  const getStatusIcon = () => {
    if (timeUntilNext > 0) return 'time-outline';
    if (rateLimitInfo.remaining <= 2) return 'warning-outline';
    return 'checkmark-circle-outline';
  };

  const getStatusText = () => {
    if (timeUntilNext > 0) {
      const seconds = Math.ceil(timeUntilNext / 1000);
      return `Wait ${seconds}s`;
    }
    return `${rateLimitInfo.remaining}/${rateLimitInfo.maxRequests}`;
  };

  const progressPercentage = (rateLimitInfo.remaining / rateLimitInfo.maxRequests) * 100;

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: getStatusColor() 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressLabel}>Requests Available</Text>
      </View>

      {timeUntilNext > 0 && (
        <View style={styles.cooldownContainer}>
          <View style={styles.cooldownBar}>
            <View 
              style={[
                styles.cooldownFill,
                { 
                  width: `${(1 - timeUntilNext / rateLimitInfo.cooldownMs) * 100}%`,
                  backgroundColor: '#ef4444'
                }
              ]}
            />
          </View>
          <Text style={styles.cooldownLabel}>Cooldown</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cooldownContainer: {
    marginTop: 8,
  },
  cooldownBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cooldownFill: {
    height: '100%',
    borderRadius: 2,
  },
  cooldownLabel: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default RateLimitStatus;
