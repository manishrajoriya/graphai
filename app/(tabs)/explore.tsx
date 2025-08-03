import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Mock data types
type AnalysisResult = {
  id: string;
  date: string;
  symbol: string;
  prediction: 'bullish' | 'bearish';
  confidence: number;
  imageUri?: string;
  notes?: string;
};

type SavedChart = {
  id: string;
  title: string;
  symbol: string;
  timestamp: string;
  imageUri: string;
};

const Explore = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'data'>('history');
  const [refreshing, setRefreshing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [userStats, setUserStats] = useState({
    totalAnalyses: 0,
    accuracy: 0,
    favoriteSymbol: 'N/A',
  });

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load analysis history
      const historyString = await AsyncStorage.getItem('analysisHistory');
      if (historyString) {
        setAnalysisHistory(JSON.parse(historyString));
      }

      // Load saved charts
      const savedString = await AsyncStorage.getItem('savedCharts');
      if (savedString) {
        setSavedCharts(JSON.parse(savedString));
      }

      // Load user stats
      const statsString = await AsyncStorage.getItem('userStats');
      if (statsString) {
        setUserStats(JSON.parse(statsString));
      } else {
        // Initialize stats if not exists
        const initialStats = {
          totalAnalyses: analysisHistory.length,
          accuracy: calculateAccuracy(analysisHistory),
          favoriteSymbol: getFavoriteSymbol(analysisHistory),
        };
        await AsyncStorage.setItem('userStats', JSON.stringify(initialStats));
        setUserStats(initialStats);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateAccuracy = (history: AnalysisResult[]): number => {
    if (history.length === 0) return 0;
    // This would need actual market data to compare predictions
    // For now, we'll return a mock value
    return 72.5;
  };

  const getFavoriteSymbol = (history: AnalysisResult[]): string => {
    if (history.length === 0) return 'N/A';
    const symbolCounts = history.reduce((acc, item) => {
      acc[item.symbol] = (acc[item.symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const deleteAnalysis = async (id: string) => {
    const updatedHistory = analysisHistory.filter(item => item.id !== id);
    setAnalysisHistory(updatedHistory);
    await AsyncStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
    
    // Update stats
    const updatedStats = {
      ...userStats,
      totalAnalyses: updatedHistory.length,
      accuracy: calculateAccuracy(updatedHistory),
      favoriteSymbol: getFavoriteSymbol(updatedHistory),
    };
    setUserStats(updatedStats);
    await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
  };

  const deleteSavedChart = async (id: string) => {
    const updatedSaved = savedCharts.filter(item => item.id !== id);
    setSavedCharts(updatedSaved);
    await AsyncStorage.setItem('savedCharts', JSON.stringify(updatedSaved));
  };

  const renderAnalysisItem = ({ item }: { item: AnalysisResult }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.symbolText}>{item.symbol}</Text>
        <View style={[
          styles.predictionBadge, 
          item.prediction === 'bullish' ? styles.bullishBadge : styles.bearishBadge
        ]}>
          <Text style={styles.predictionText}>
            {item.prediction === 'bullish' ? 'Bullish' : 'Bearish'}
          </Text>
        </View>
      </View>
      <Text style={styles.dateText}>{item.date}</Text>
      <Text style={styles.confidenceText}>
        Confidence: {item.confidence}%
      </Text>
      {item.notes && <Text style={styles.notesText}>Notes: {item.notes}</Text>}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteAnalysis(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSavedChartItem = ({ item }: { item: SavedChart }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.symbolText}>{item.symbol}</Text>
        <Text style={styles.chartTitle}>{item.title}</Text>
      </View>
      <Text style={styles.dateText}>{item.timestamp}</Text>
      {/* In a real app, you would display the chart image here */}
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart-outline" size={40} color="#6b7280" />
        <Text style={styles.placeholderText}>Chart Preview</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteSavedChart(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#111827', '#1f2937']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={styles.tabText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={styles.tabText}>Saved Charts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'data' && styles.activeTab]}
          onPress={() => setActiveTab('data')}
        >
          <Text style={styles.tabText}>My Stats</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
          />
        }
      >
        {activeTab === 'history' ? (
          analysisHistory.length > 0 ? (
            <FlatList
              data={analysisHistory}
              renderItem={renderAnalysisItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No analysis history yet</Text>
              <Text style={styles.emptySubtext}>Your chart analyses will appear here</Text>
            </View>
          )
        ) : activeTab === 'saved' ? (
          savedCharts.length > 0 ? (
            <FlatList
              data={savedCharts}
              renderItem={renderSavedChartItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No saved charts</Text>
              <Text style={styles.emptySubtext}>Save your favorite charts to access them later</Text>
            </View>
          )
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.totalAnalyses}</Text>
              <Text style={styles.statLabel}>Total Analyses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.accuracy}%</Text>
              <Text style={styles.statLabel}>Prediction Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.favoriteSymbol}</Text>
              <Text style={styles.statLabel}>Favorite Symbol</Text>
            </View>
            <View style={styles.advancedStats}>
              <Text style={styles.sectionTitle}>Advanced Statistics</Text>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Most Profitable:</Text>
                <Text style={styles.statData}>BTC (+24.5%)</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Best Time:</Text>
                <Text style={styles.statData}>9:30 AM - 11:00 AM</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Win Rate:</Text>
                <Text style={styles.statData}>68.2%</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbolText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartTitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  predictionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  bullishBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  bearishBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  predictionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  placeholderText: {
    color: '#6b7280',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#9ca3af',
  },
  advancedStats: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statData: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default Explore;