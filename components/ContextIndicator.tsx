import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ContextIndicatorProps {
  hasContext: boolean;
  companyName?: string;
  conversationCount?: number;
  onPress?: () => void;
}

const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  hasContext,
  companyName,
  conversationCount = 0,
  onPress
}) => {
  const getStatusColor = () => {
    if (hasContext && companyName) return '#22c55e';
    if (companyName) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (hasContext && companyName) return 'Context Available';
    if (companyName) return 'Company Set';
    return 'No Context';
  };

  const getStatusIcon = () => {
    if (hasContext && companyName) return 'checkmark-circle';
    if (companyName) return 'information-circle';
    return 'alert-circle';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: getStatusColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={18} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        {conversationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{conversationCount}</Text>
          </View>
        )}
      </View>
      
      {companyName && (
        <Text style={styles.companyName}>{companyName}</Text>
      )}
      
      {hasContext && (
        <Text style={styles.contextHint}>
          AI has market research context
        </Text>
      )}
      
      {!hasContext && companyName && (
        <Text style={styles.noContextHint}>
          Run market research for better responses
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginTop: 4,
  },
  contextHint: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noContextHint: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ContextIndicator;
