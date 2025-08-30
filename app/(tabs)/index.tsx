import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CustomerInfo } from 'react-native-purchases';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import AnalysisView, { FormattedAnalysis } from '../../components/AnalysisView';
import MarketResearch from '../../components/MarketResearch';
import MarketResearchReportView from '../../components/MarketResearchReportView';
import PaywallScreen from '../../components/Paywall';
import { useAnalytics } from '../../hooks/useAnalytics';
import { GetChartAnalysis, MarketResearchReport } from '../../services/aiServices';
import { initDB, saveAnalysis, saveResearch, trackAIRequest } from '../../services/dbService';
import { resolveUserId } from '../../services/userId';
import { default as SubscriptionService, default as subscriptionService } from '../../services/subscriptionService';

const { width, height } = Dimensions.get('window');

const Candlestick = ({ type, candleHeight, index }: { type: string; candleHeight: number; index: number }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, index]);

  return (
    <Animated.View 
      style={[
        styles.candlestick,
        {
          transform: [{
            scaleY: animatedValue
          }]
        }
      ]}
    >
      <View
        style={[
          styles.wick,
          {
            backgroundColor: type === 'bullish' ? '#00d4aa' : '#ff6b9d',
            height: candleHeight + 15,
            top: -7,
          },
        ]}
      />
      <View
        style={[
          styles.candleBody,
          {
            backgroundColor: type === 'bullish' ? '#00d4aa' : '#ff6b9d',
            height: candleHeight,
          },
        ]}
      />
    </Animated.View>
  );
};

const CandlestickChart = () => {
  const candlesticks = [
    { type: 'bearish', height: 48 },
    { type: 'bullish', height: 40 },
    { type: 'bullish', height: 56 },
    { type: 'bearish', height: 44 },
    { type: 'bullish', height: 64 },
    { type: 'bearish', height: 52 },
    { type: 'bullish', height: 60 },
    { type: 'bearish', height: 40 },
    { type: 'bullish', height: 68 },
    { type: 'bearish', height: 56 },
    { type: 'bullish', height: 72 },
  ];

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBackground}>
        <View style={styles.gridLines}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        
        <View style={styles.candlestickRow}>
          {candlesticks.map((candle, index) => (
            <Candlestick
              key={index}
              type={candle.type}
              candleHeight={candle.height}
              index={index}
            />
          ))}
        </View>
        
        <Svg
          style={styles.trendLine}
          width={width - 48}
          height={120}
          viewBox={`0 0 ${width - 48} 120`}
        >
          <Defs>
            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#00d4aa" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00a8ff" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={`M20,100 Q${(width - 48) * 0.25},80 ${(width - 48) * 0.4},60 T${(width - 48) * 0.7},30 T${width - 68},20`}
            stroke="url(#grad)"
            strokeWidth="3"
            fill="none"
            opacity="0.9"
          />
        </Svg>
      </View>
    </View>
  );
};

// Types
interface ImageAsset {
  uri: string;
  width?: number;
  height?: number;
}

enum AnalysisState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

enum ImageSource {
  GALLERY = 'gallery',
  CAMERA = 'camera',
}

const TradingChartApp = () => {
  const [researchReport, setResearchReport] = useState<MarketResearchReport | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [showResearchModal, setShowResearchModal] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<FormattedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Analytics tracking
  const { trackButton } = useAnalytics();

  // Animated values for micro-interactions
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const checkSubscription = async () => {
      try { 
        const status = await subscriptionService.checkSubscriptionStatus();
        const hasAccess = status.isSubscribed
        setIsSubscribed(hasAccess);
      } catch (e) {
        console.error('Error checking subscription', e);
      }
    };

    checkSubscription();

    initDB().catch(err => {
      console.error("DB Init failed:", err);
      Alert.alert("Database Error", "Could not initialize the history database.");
    });
  }, [fadeAnim, scaleAnim]);

  const handleSaveResearch = async (chatHistory: any[]) => {
    if (researchReport) {
      try {
        console.log('Saving research with chat history:', chatHistory);
        await saveResearch(researchReport, chatHistory);
        trackButton('save_research', { symbol: researchReport.symbol });
        Alert.alert('Saved', 'The research report and chat history have been saved.');
        setShowReportModal(false);
      } catch (error) {
        console.error('Failed to save research report:', error);
        Alert.alert('Error', 'Could not save the report. Please try again.');
      }
    }
  };

  const handleResearchComplete = (report: MarketResearchReport, chatHistory: any[]) => {
    setResearchReport(report);
    setChatHistory(chatHistory);
    setShowReportModal(true);
    trackButton('market_research_complete', { symbol: report.symbol, companyName: report.companyName });
  };

  // Permission handling
  const requestCameraPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permissions to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  }, []);

  const requestGalleryPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission Required',
          'Please enable gallery permissions to select photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Gallery permission request failed:', error);
      return false;
    }
  }, []);

  const handleImageSourceSelect = async (source: ImageSource) => {
    setShowImageSourceModal(false);
    
    if (source === ImageSource.CAMERA) {
      const hasPermission = await requestCameraPermissions();
      if (hasPermission) {
        await takePhoto();
      }
    } else {
      const hasPermission = await requestGalleryPermissions();
      if (hasPermission) {
        await pickImage();
      }
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setSelectedImage(selectedImage);
        await analyzeImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setSelectedImage(selectedImage);
        await analyzeImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    if (!imageUri) return;

    const startTime = Date.now();
    let userId: string;
    let isPremiumUser = false;

    try {
      userId = await resolveUserId();
    } catch (e) {
      console.error('Failed to resolve user ID:', e);
      userId = 'unknown';
    }

    // Verify subscription before allowing analysis
    try {
      const { isSubscribed } = await SubscriptionService.checkSubscriptionStatus();
      isPremiumUser = isSubscribed;
      if (!isSubscribed) {
        setShowPaywall(true);
        return;
      }
    } catch (e) {
      setShowPaywall(true);
      return;
    }

    setAnalysisState(AnalysisState.LOADING);
    setError(null);
    
    try {
      const analysisResultJson = await GetChartAnalysis(imageUri);
      const processingTime = Date.now() - startTime;
      
      if (analysisResultJson && analysisResultJson.summary) {
        const fullAnalysis: FormattedAnalysis = { 
          ...analysisResultJson,
          imageUri: imageUri 
        };
        setAnalysisResult(fullAnalysis);
        setAnalysisState(AnalysisState.SUCCESS);
        setShowAnalysisModal(true);
        trackButton('chart_analysis_complete', { trend: fullAnalysis.trend });
        await saveAnalysis(fullAnalysis);

        // Track AI request for premium users
        await trackAIRequest({
          user_id: userId,
          request_type: 'chart_analysis',
          is_premium_user: isPremiumUser,
          request_data: { imageUri },
          response_data: { trend: fullAnalysis.trend, summary: fullAnalysis.summary },
          processing_time_ms: processingTime,
          success: true
        });
      } else {
        throw new Error('Received invalid analysis format from server.');
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Error analyzing image:', error);
      setError('Failed to analyze the chart. Please try again with a clearer image.');
      setAnalysisState(AnalysisState.ERROR);
      Alert.alert('Analysis Error', 'Failed to analyze the chart. Please try again with a clearer image.');

      // Track failed AI request
      await trackAIRequest({
        user_id: userId,
        request_type: 'chart_analysis',
        is_premium_user: isPremiumUser,
        request_data: { imageUri },
        processing_time_ms: processingTime,
        success: false
      });
    } 
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0b14" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#0a0b14', '#1a1b2e', '#16213e']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Research Modal */}
      <Modal visible={showResearchModal} animationType="slide" onRequestClose={() => setShowResearchModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#0a0b14', '#1a1b2e']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Market Research</Text>
            <TouchableOpacity onPress={() => setShowResearchModal(false)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={30} color="#00d4aa" />
            </TouchableOpacity>
          </View>
          <MarketResearch 
            onResearchComplete={handleResearchComplete}
            onRequireSubscription={() => setShowPaywall(true)}
          />
        </SafeAreaView>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#0a0b14', '#1a1b2e']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Market Research Report</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={30} color="#00d4aa" />
            </TouchableOpacity>
          </View>
          <MarketResearchReportView
                  report={researchReport}
                  chatHistory={chatHistory}
                  onChatHistoryChange={setChatHistory}
                  onSaveReport={handleSaveResearch}
                  onRequireSubscription={() => setShowPaywall(true)}
                />
        </SafeAreaView>
      </Modal>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerLeft}>
          {/* <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </TouchableOpacity> */}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live</Text>
          </View>
          {isSubscribed && (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color="#ffd700" />
              <Text style={styles.proBadgeText}>Pro Active</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Chart Section */}
      <Animated.View 
        style={[
          styles.chartSection, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <CandlestickChart />
      </Animated.View>

      {/* Title Section */}
      <Animated.View style={[styles.titleSection, { opacity: fadeAnim }]}>
        <Text style={styles.mainTitle}>
          Graph<Text style={styles.titleAccent}>AI</Text>
        </Text>
        <Text style={styles.subtitle}>
          Upload a screenshot and get instant AI-powered trading analysis
        </Text>
        <View style={styles.titleUnderline} />
      </Animated.View>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          onDismiss={() => setShowPaywall(false)}
          onPurchaseCompleted={(customerInfo: CustomerInfo) => {
            setIsSubscribed(true);
            setShowPaywall(false);
          }}
          onRestoreCompleted={(customerInfo: CustomerInfo) => {
            if (typeof customerInfo.entitlements.active.pro !== 'undefined') {
              setIsSubscribed(true);
            }
            setShowPaywall(false);
          }}
        />
      </Modal>

      {/* Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAnalysisModal}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.analysisModalOverlay}>
          <LinearGradient colors={['#0a0b14', '#1a1b2e']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.analysisModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trade Analysis Report</Text>
              <TouchableOpacity onPress={() => setShowAnalysisModal(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={30} color="#00d4aa" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedImage && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="contain" />
                </View>
              )}
              {analysisResult && <AnalysisView analysis={analysisResult} />}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Source Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showImageSourceModal}
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <Pressable style={styles.bottomSheetOverlay} onPress={() => setShowImageSourceModal(false)}>
          <View style={styles.imageSourceModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.imageSourceTitle}>Select Image Source</Text>
            
            <TouchableOpacity 
              style={styles.imageSourceButton} 
              onPress={() => {
                trackButton('take_photo');
                handleImageSourceSelect(ImageSource.CAMERA);
              }}
            >
              <LinearGradient
                colors={['#00d4aa', '#00a8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.imageSourceButtonGradient}
              >
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.imageSourceButtonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageSourceButton} 
              onPress={() => {
                trackButton('choose_gallery');
                handleImageSourceSelect(ImageSource.GALLERY);
              }}
            >
              <View style={styles.imageSourceButtonSecondary}>
                <Ionicons name="images" size={24} color="#00d4aa" />
                <Text style={styles.imageSourceButtonTextSecondary}>Choose from Gallery</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageSourceButton} 
              onPress={() => setShowImageSourceModal(false)}
            >
              <View style={styles.imageSourceButtonCancel}>
                <Text style={styles.imageSourceButtonTextCancel}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Button Section */}
      <Animated.View style={[styles.buttonSection, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => {
            trackButton('upload_chart', { analysisState });
            // Let user pick/take image first; we'll gate in analyzeImage()
            setShowImageSourceModal(true);
          }}
          disabled={analysisState === AnalysisState.LOADING}
        >
          <LinearGradient
            colors={analysisState === AnalysisState.LOADING ? ['#4b5563', '#6b7280'] : ['#00d4aa', '#00a8ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {analysisState === AnalysisState.LOADING ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="white" style={styles.uploadIcon} />
                <Text style={styles.uploadButtonTitle}>Upload a Chart</Text>
                <Text style={styles.uploadButtonSubtitle}>Snap, upload and trade smarter</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity 
            style={styles.researchButton} 
            onPress={() => {
              trackButton('market_research');
              setShowResearchModal(true);
            }} 
            disabled={analysisState === AnalysisState.LOADING}
          >
            <View style={styles.researchButtonContent}>
              <Ionicons name="search-outline" size={20} color="#00d4aa" />
              <Text style={styles.researchButtonText}>Market Research</Text>
            </View>
          </TouchableOpacity>
          {isSubscribed ? (
            <View style={styles.subscribedPill}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.subscribedPillText}>Pro Active</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.proButton} onPress={() => {
              trackButton('try_pro');
              setShowPaywall(true);
            }}>
              <View style={styles.proButtonContent}>
                <Ionicons name="star-outline" size={20} color="#ffd700" />
                <Text style={styles.proButtonText}>Try Pro</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  analysisModalOverlay: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  analysisModalContent: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 170, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  modalBody: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 0,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 170, 0.2)',
    backgroundColor: 'rgba(26, 27, 46, 0.9)',
  },
  imageSourceModalContent: {
    backgroundColor: '#1a1b2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  imageSourceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  imageSourceButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageSourceButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  imageSourceButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    gap: 12,
  },
  imageSourceButtonCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  imageSourceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  imageSourceButtonTextSecondary: {
    color: '#00d4aa',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  imageSourceButtonTextCancel: {
    color: '#ff6b9d',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subscribedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  subscribedPillText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(26, 27, 46, 0.5)',
    padding: 8,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 27,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#00d4aa',
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#00d4aa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    marginLeft: 10,
  },
  proBadgeText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  chartSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    marginTop: 10,
  },
  chartContainer: {
    height: 220,
    width: width - 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(26, 27, 46, 0.3)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.1)',
  },
  gridLines: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  candlestickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 32,
    zIndex: 2,
  },
  candlestick: {
    position: 'relative',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  wick: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  candleBody: {
    width: 18,
    borderRadius: 3,
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  trendLine: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 1,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 20,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#00d4aa',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#00d4aa',
    borderRadius: 2,
    opacity: 0.8,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flex: 1,
    justifyContent: 'flex-end',
  },
  uploadButton: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    marginBottom: 8,
  },
  uploadButtonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  uploadButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  researchButton: {
    flex: 1,
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
    overflow: 'hidden',
  },
  researchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  researchButtonText: {
    color: '#00d4aa',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  proButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  proButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  proButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffd700',
    letterSpacing: 0.2,
  },
});

export default TradingChartApp;