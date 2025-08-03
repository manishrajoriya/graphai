import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const Candlestick = ({ type, candleHeight, index }: { type: string; candleHeight: number; index: number }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.candlestick,
        {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
          opacity: animatedValue,
        },
      ]}
    >
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

const TradingChartApp = () => {
  const [activeTab, setActiveTab] = useState('Analysis');
  const floatAnimation = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const TabIcon = ({ active, iconName }: { active: boolean; iconName: string }) => {
    const color = active ? '#10b981' : '#6b7280';
    
    if (iconName === 'Analysis') {
      return (
        <View style={styles.barChartIcon}>
          <View style={[styles.bar, { backgroundColor: color, height: 8 }]} />
          <View style={[styles.bar, { backgroundColor: color, height: 12 }]} />
          <View style={[styles.bar, { backgroundColor: color, height: 6 }]} />
          <View style={[styles.bar, { backgroundColor: color, height: 10 }]} />
        </View>
      );
    }
    
    return (
      <View style={[styles.clockIcon, { borderColor: color }]}>
        <View style={[styles.clockHand, { backgroundColor: color }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      <View style={styles.header}>
        <View style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </View>
      </View>

      <View style={styles.chartSection}>
        <CandlestickChart />
      </View>

      <View style={styles.titleSection}>
        <Animated.View
          style={{
            transform: [
              {
                translateY: floatAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          }}
        >
          <Text style={styles.mainTitle}>Graph AI</Text>
        </Animated.View>
        <Text style={styles.subtitle}>
          Upload a screenshot and get{'\n'}instant Trading Analysis
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.uploadButton}>
          <LinearGradient
            colors={['#10b981', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.uploadButtonTitle}>Upload a Chart</Text>
            <Text style={styles.uploadButtonSubtitle}>Snap, Upload and Trade Smarter</Text>
          </LinearGradient>
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
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
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
    marginBottom: 48,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  uploadButton: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  uploadButtonSubtitle: {
    fontSize: 16,
    color: '#374151',
  },
  proButton: {
    backgroundColor: '#1f2937',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.3)',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 14,
    marginTop: 4,
  },
  barChartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 24,
    height: 24,
    justifyContent: 'center',
  },
  bar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  clockIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHand: {
    width: 1,
    height: 6,
    position: 'absolute',
    top: 2,
  },
});

export default TradingChartApp;