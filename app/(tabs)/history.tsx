import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AnalysisView, { FormattedAnalysis } from '../../components/AnalysisView';
import MarketResearchReportView from '../../components/MarketResearchReportView';
import { useAnalytics } from '../../hooks/useAnalytics';
import { MarketResearchReport } from '../../services/aiServices';
import { deleteHistoryItem, fetchHistory, HistoryItem, updateChatHistory } from '../../services/dbService';

const { width } = Dimensions.get('window');

// --- Enhanced Card Components ---
const AnalysisHistoryCard = ({ 
  item, 
  onPress, 
  onOpenOptions,
  index 
}: { 
  item: FormattedAnalysis & { id: number, timestamp: string }, 
  onPress: () => void, 
  onOpenOptions: () => void,
  index: number
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getTrendColor = (trend: string) => {
    const trendLower = trend?.toLowerCase() || '';
    if (trendLower.includes('bullish') || trendLower.includes('up')) return '#00d4aa';
    if (trendLower.includes('bearish') || trendLower.includes('down')) return '#ff6b9d';
    return '#ffd700';
  };

  const getTrendIcon = (trend: string) => {
    const trendLower = trend?.toLowerCase() || '';
    if (trendLower.includes('bullish') || trendLower.includes('up')) return 'trending-up';
    if (trendLower.includes('bearish') || trendLower.includes('down')) return 'trending-down';
    return 'remove';
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.cardTouchable}>
        <LinearGradient
          colors={['rgba(26, 27, 46, 0.8)', 'rgba(22, 33, 62, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
              <View style={styles.imageOverlay} />
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.summaryText} numberOfLines={2}>
                {item.summary}
              </Text>
              
              <View style={styles.detailRow}>
                <View style={[styles.trendBadge, { borderColor: getTrendColor(item.trend) }]}>
                  <Ionicons 
                    name={getTrendIcon(item.trend)} 
                    size={14} 
                    color={getTrendColor(item.trend)} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                    {item.trend}
                  </Text>
                </View>
              </View>
              
              <View style={styles.timestampContainer}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.timestamp}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.optionsButton} onPress={onOpenOptions}>
            <View style={styles.optionsButtonBackground}>
              <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ResearchHistoryCard = ({ 
  item, 
  onPress, 
  onOpenOptions,
  index 
}: { 
  item: MarketResearchReport & { id: number, timestamp: string }, 
  onPress: () => void, 
  onOpenOptions: () => void,
  index: number
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.cardTouchable}>
        <LinearGradient
          colors={['rgba(26, 27, 46, 0.8)', 'rgba(22, 33, 62, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.companyIconContainer}>
              <LinearGradient
                colors={['#00d4aa', '#00a8ff']}
                style={styles.companyIcon}
              >
                <Text style={styles.companyIconText}>
                  {item.symbol?.charAt(0) || 'R'}
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.companyHeader}>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <View style={styles.symbolBadge}>
                  <Text style={styles.symbolText}>{item.symbol}</Text>
                </View>
              </View>
              
              <Text style={styles.researchSummary} numberOfLines={2}>
                {item.summary}
              </Text>
              
              <View style={styles.timestampContainer}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.timestamp}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.optionsButton} onPress={onOpenOptions}>
            <View style={styles.optionsButtonBackground}>
              <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Main History Screen ---
const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'research'>('analysis');
  const [selectedItem, setSelectedItem] = useState<(Omit<HistoryItem, 'data'> & { data: FormattedAnalysis | MarketResearchReport }) | null>(null);
  const [modalChatHistory, setModalChatHistory] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Analytics tracking
  const { trackButton } = useAnalytics();

  // Animation values
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const tabSlideAnim = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(tabSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const onRefresh = useCallback(() => { setRefreshing(true); loadHistory(); }, [loadHistory]);

  const handleCloseModal = async () => {
    if (selectedItem && modalChatHistory.length > 0) {
      await updateChatHistory(selectedItem.id, modalChatHistory);
    }
    setIsModalVisible(false);
  };

  const openModal = (item: HistoryItem) => {
    const chatHistory = item.chatHistory ? JSON.parse(item.chatHistory) : [];
    setModalChatHistory(chatHistory);
    const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    setSelectedItem({ ...item, data: parsedData });
    setIsModalVisible(true);
    trackButton('view_history_item', { type: item.type, itemId: item.id });
  };

  const handleDelete = async (id: number) => {
    try {
      const itemToDelete = history.find(item => item.id === id);
      await deleteHistoryItem(id);
      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
      trackButton('delete_history_item', { type: itemToDelete?.type, itemId: id });
      Alert.alert('Deleted', 'The item has been removed from your history.');
    } catch (error) {
      console.error('Failed to delete history item:', error);
      Alert.alert('Error', 'Could not delete the item. Please try again.');
    }
  };

  const onOpenOptions = (item: HistoryItem) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'dark',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            Alert.alert(
              'Delete Item',
              'Are you sure you want to delete this item from your history?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        'Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
        ]
      );
    }
  };

  const filteredHistory = useMemo(() => 
    history.filter(item => item.type === activeTab),
    [history, activeTab]
  );

  const renderItem = ({ item, index }: { item: HistoryItem, index: number }) => {
    if (typeof item.data !== 'string' || !item.data) {
      console.error(`History item with id ${item.id} has invalid data.`);
      return null;
    }

    try {
      const cardData = JSON.parse(item.data);

      if (item.type === 'analysis') {
        return (
          <AnalysisHistoryCard
            item={{ ...item, ...cardData }}
            onPress={() => openModal(item)}
            onOpenOptions={() => onOpenOptions(item)}
            index={index}
          />
        );
      }
      if (item.type === 'research') {
        return (
          <ResearchHistoryCard
            item={{ ...item, ...cardData }}
            onPress={() => openModal(item)}
            onOpenOptions={() => onOpenOptions(item)}
            index={index}
          />
        );
      }
      return null;
    } catch (e) {
      console.error("Failed to render history item:", e);
      return (
        <View style={styles.errorCard}>
          <Ionicons name="warning" size={24} color="#ff6b9d" />
          <Text style={styles.errorText}>Error loading item</Text>
        </View>
      );
    }
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const ModalHeader = () => (
      <View style={styles.modalHeader}>
        <LinearGradient
          colors={['rgba(0, 212, 170, 0.1)', 'rgba(0, 168, 255, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.modalHeaderGradient}
        >
          <Text style={styles.modalTitle}>
            {activeTab === 'analysis' ? 'Chart Analysis' : 'Research Report'}
          </Text>
          <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
            <View style={styles.closeButtonBackground}>
              <Ionicons name="close" size={24} color="#00d4aa" />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );

    return (
      <Modal visible={isModalVisible} animationType="slide" onRequestClose={handleCloseModal}>
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#0a0b14', '#1a1b2e']} style={StyleSheet.absoluteFillObject} />
          <ModalHeader />
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {selectedItem?.data && (
              activeTab === 'analysis' ? 
              <AnalysisView analysis={selectedItem.data as FormattedAnalysis} /> : 
              <MarketResearchReportView
              report={selectedItem.data as MarketResearchReport}
              chatHistory={modalChatHistory}
              onChatHistoryChange={setModalChatHistory}
            />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(0, 212, 170, 0.1)', 'rgba(0, 168, 255, 0.1)']}
        style={styles.emptyIconContainer}
      >
        <Ionicons 
          name={activeTab === 'analysis' ? 'analytics-outline' : 'search-outline'} 
          size={48} 
          color="#00d4aa" 
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No {activeTab} history</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'analysis' 
          ? 'Upload your first chart to see analysis history here'
          : 'Create your first market research to see it here'
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0a0b14', '#1a1b2e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#00d4aa" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0b14', '#1a1b2e', '#16213e']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your analysis and research records</Text>
        </Animated.View>

        {/* Tab Container */}
        <Animated.View 
          style={[
            styles.tabContainer, 
            { transform: [{ translateY: tabSlideAnim }] }
          ]}
        >
          <View style={styles.tabBackground}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'analysis' && styles.activeTabButton]}
              onPress={() => {
                trackButton('switch_tab', { tab: 'analysis' });
                setActiveTab('analysis');
              }}
            >
              {activeTab === 'analysis' && (
                <LinearGradient
                  colors={['#00d4aa', '#00a8ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                />
              )}
              <Ionicons 
                name="analytics" 
                size={18} 
                color={activeTab === 'analysis' ? '#ffffff' : '#9ca3af'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
                Chart Analysis
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'research' && styles.activeTabButton]}
              onPress={() => {
                trackButton('switch_tab', { tab: 'research' });
                setActiveTab('research');
              }}
            >
              {activeTab === 'research' && (
                <LinearGradient
                  colors={['#00d4aa', '#00a8ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                />
              )}
              <Ionicons 
                name="search" 
                size={18} 
                color={activeTab === 'research' ? '#ffffff' : '#9ca3af'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === 'research' && styles.activeTabText]}>
                Market Research
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content */}
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#00d4aa"
              colors={['#00d4aa']}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {renderDetailModal()}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 170, 0.1)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.2,
  },
  tabContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
    gap: 8,
  },
  activeTabButton: {
    // Styles handled by gradient
  },
  activeTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  tabIcon: {
    zIndex: 1,
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
    zIndex: 1,
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: { 
    padding: 24,
    paddingTop: 8,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.1)',
    position: 'relative',
  },
  cardContent: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  thumbnail: { 
    width: 70, 
    height: 70, 
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
  },
  companyIconContainer: {
    marginRight: 16,
  },
  companyIcon: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  infoContainer: { 
    flex: 1, 
    marginRight: 40,
  },
  summaryText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#ffffff', 
    marginBottom: 12,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    letterSpacing: -0.2,
  },
  symbolBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  symbolText: {
    color: '#00d4aa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  researchSummary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: { 
    fontSize: 12, 
    color: '#9ca3af',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  optionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  optionsButtonBackground: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  errorText: { 
    color: '#ff6b9d', 
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 170, 0.2)',
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  closeButton: {
    // No additional styles needed
  },
  closeButtonBackground: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
});

export default HistoryScreen;