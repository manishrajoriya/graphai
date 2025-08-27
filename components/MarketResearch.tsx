import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getMarketResearch, MarketResearchReport } from '../services/aiServices';
import { trackAIRequest } from '../services/dbService';
import subscriptionService from '../services/subscriptionService';
import { resolveUserId } from '../services/userId';

interface MarketResearchProps {
  onResearchComplete: (report: MarketResearchReport, chatHistory: any[]) => void;
  onRequireSubscription?: () => void;
}

const MarketResearch: React.FC<MarketResearchProps> = ({ onResearchComplete, onRequireSubscription }) => {
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    const loadLastCompanyName = async () => {
      const lastCompanyName = await AsyncStorage.getItem('lastCompanyName');
      if (lastCompanyName) {
        setCompanyName(lastCompanyName);
      }
    };
    loadLastCompanyName();
  }, []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

    const handleGenerateResearch = async () => {
    await AsyncStorage.setItem('lastCompanyName', companyName);
    if (!companyName.trim()) {
      setError('Please enter a company name.');
      return;
    }

    const startTime = Date.now();
    let userId: string;
    let isPremiumUser = false;

    try {
      userId = await resolveUserId();
    } catch (e) {
      console.error('Failed to resolve user ID:', e);
      userId = 'unknown';
    }

    // Check subscription before making AI request
    try {
      const status = await subscriptionService.checkSubscriptionStatus();
      isPremiumUser = status.isSubscribed;
      if (!isPremiumUser) {
        onRequireSubscription?.();
        return;
      }
    } catch (e) {
      // If we fail to check, block the request and ask user to subscribe
      onRequireSubscription?.();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const report = await getMarketResearch(companyName);
      const processingTime = Date.now() - startTime;
      
      onResearchComplete(report, []);

      // Track AI request for premium users
      await trackAIRequest({
        user_id: userId,
        request_type: 'market_research',
        is_premium_user: isPremiumUser,
        request_data: { companyName },
        response_data: { symbol: report.symbol, companyName: report.companyName },
        processing_time_ms: processingTime,
        success: true
      });
    } catch (err) {
      const processingTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Market research failed:', err);

      // Track failed AI request
      await trackAIRequest({
        user_id: userId,
        request_type: 'market_research',
        is_premium_user: isPremiumUser,
        request_data: { companyName },
        processing_time_ms: processingTime,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.contentView}>
      <Text style={styles.title}>Market Research</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Company Name (e.g., Apple)"
        placeholderTextColor="#9ca3af"
        value={companyName}
        onChangeText={setCompanyName}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#22d3ee" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleGenerateResearch} disabled={!companyName.trim()}>
          <Ionicons name="search-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  contentView: {
    padding: 24,
    backgroundColor: '#111827',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: '#1f2937',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    color: '#f9fafb',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default MarketResearch;
