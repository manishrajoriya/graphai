import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMarketResearch, MarketResearchReport } from '../services/aiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MarketResearchProps {
  onResearchComplete: (report: MarketResearchReport, chatHistory: any[]) => void;
}

const MarketResearch: React.FC<MarketResearchProps> = ({ onResearchComplete }) => {
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
    setLoading(true);
    setError('');
    try {
      const report = await getMarketResearch(companyName);
      onResearchComplete(report, []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Market research failed:', err);
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
