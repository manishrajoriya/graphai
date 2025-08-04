import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GetChartAnalysis } from '../../services/aiServices';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const Candlestick = ({ type, candleHeight }: { type: string; candleHeight: number }) => {
  return (
    <View style={styles.candlestick}>
      <View
        style={[
          styles.wick,
          {
            backgroundColor: type === 'bullish' ? '#22d3ee' : '#f472b6',
            height: candleHeight + 15,
            top: -7,
          },
        ]}
      />
      <View
        style={[
          styles.candleBody,
          {
            backgroundColor: type === 'bullish' ? '#22d3ee' : '#f472b6',
            height: candleHeight,
          },
        ]}
      />
    </View>
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
      <View style={styles.candlestickRow}>
        {candlesticks.map((candle, index) => (
          <Candlestick
            key={index}
            type={candle.type}
            candleHeight={candle.height}
          />
        ))}
      </View>
      
      <Svg
        style={styles.trendLine}
        width={width - 48}
        height={120}
        viewBox={`0 0 ${width - 48} 120`}
      >
        <Path
          d={`M20,100 Q${(width - 48) * 0.25},80 ${(width - 48) * 0.4},60 T${(width - 48) * 0.7},30 T${width - 68},20`}
          stroke="#22d3ee"
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
      </Svg>
    </View>
  );
};

// Types
interface AnalysisResult {
  text: string;
  answer: string;
}

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
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    setAnalysisState(AnalysisState.LOADING);
    setError(null);
    
    try {
      const result = await GetChartAnalysis(imageUri);
      setAnalysisResult(result);
      setAnalysisState(AnalysisState.SUCCESS);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze the chart. Please try again with a clearer image.');
      setAnalysisState(AnalysisState.ERROR);
      Alert.alert('Analysis Error', 'Failed to analyze the chart. Please try again with a clearer image.');
    } 
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      <View style={styles.header}>
        <View style={styles.menuButton}>
          <View style={styles.menuIcon} />
        </View>
      </View>

      <View style={styles.chartSection}>
        <CandlestickChart />
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Graph AI</Text>
        <Text style={styles.subtitle}>
          Upload a screenshot and get instant Trading Analysis
        </Text>
      </View>

      {/* Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAnalysisModal}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trade Analysis Report</Text>
              <TouchableOpacity onPress={() => setShowAnalysisModal(false)} style={styles.closeButton}>
                <Text style={{ color: 'white', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedImage && (
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="contain" />
              )}
              {analysisResult && (
                <>
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Chart Summary</Text>
                    <Text style={styles.analysisContent}>{analysisResult.text}</Text>
                  </View>
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisSectionTitle}>Trading Insights & Strategy</Text>
                    <Text style={styles.analysisContent}>{analysisResult.answer}</Text>
                  </View>
                </>
              )}
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
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <TouchableOpacity style={styles.imageSourceButton} onPress={() => handleImageSourceSelect(ImageSource.CAMERA)}>
              <Text style={styles.imageSourceButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSourceButton} onPress={() => handleImageSourceSelect(ImageSource.GALLERY)}>
              <Text style={styles.imageSourceButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSourceButton} onPress={() => setShowImageSourceModal(false)}>
              <Text style={[styles.imageSourceButtonText, { color: '#f472b6' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowImageSourceModal(true)}
          disabled={analysisState === AnalysisState.LOADING}
        >
          <LinearGradient
            colors={['#10b981', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {analysisState === AnalysisState.LOADING ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.uploadButtonTitle}>Upload a Chart</Text>
                <Text style={styles.uploadButtonSubtitle}>Snap, Upload and Trade Smarter</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Market Research</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.proButton}>
          <Text style={styles.proButtonText}>Try PRO for free</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#111827',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
    paddingTop: 40, // Add padding for status bar
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  imageSourceModalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  imageSourceButton: {
    backgroundColor: '#374151',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageSourceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 8,
  },
  analysisContent: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 26,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  chartSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  chartContainer: {
    height: 200,
    width: width - 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  candlestickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 32,
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
  },
  candleBody: {
    width: 16,
    borderRadius: 2,
  },
  trendLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  uploadButton: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  uploadButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  proButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  proButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
});

export default TradingChartApp;