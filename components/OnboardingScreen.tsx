import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  illustration: React.ReactNode;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const ChartIllustration = () => (
    <View style={styles.illustrationContainer}>
      <Svg width={200} height={150} viewBox="0 0 200 150">
        <Defs>
          <SvgLinearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00d4aa" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00a8ff" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        {/* Chart bars */}
        <Path d="M20,120 L20,80 L35,80 L35,120 Z" fill="url(#chartGrad)" opacity="0.8" />
        <Path d="M45,120 L45,60 L60,60 L60,120 Z" fill="url(#chartGrad)" opacity="0.9" />
        <Path d="M70,120 L70,40 L85,40 L85,120 Z" fill="url(#chartGrad)" />
        <Path d="M95,120 L95,70 L110,70 L110,120 Z" fill="url(#chartGrad)" opacity="0.8" />
        <Path d="M120,120 L120,30 L135,30 L135,120 Z" fill="url(#chartGrad)" />
        <Path d="M145,120 L145,50 L160,50 L160,120 Z" fill="url(#chartGrad)" opacity="0.9" />
        <Path d="M170,120 L170,25 L185,25 L185,120 Z" fill="url(#chartGrad)" />
        
        {/* Trend line */}
        <Path
          d="M20,100 Q60,80 100,50 T180,20"
          stroke="#ffd700"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
        
        {/* Floating elements */}
        <Circle cx="50" cy="70" r="3" fill="#00d4aa" opacity="0.7" />
        <Circle cx="120" cy="40" r="4" fill="#00a8ff" opacity="0.8" />
        <Circle cx="160" cy="30" r="3" fill="#ffd700" opacity="0.9" />
      </Svg>
    </View>
  );

  const AIIllustration = () => (
    <View style={styles.illustrationContainer}>
      <Svg width={200} height={150} viewBox="0 0 200 150">
        <Defs>
          <SvgLinearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ff6b9d" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00d4aa" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Brain/AI representation */}
        <Path
          d="M100,30 C120,30 140,45 140,70 C140,85 130,95 120,100 C110,105 90,105 80,100 C70,95 60,85 60,70 C60,45 80,30 100,30 Z"
          fill="url(#aiGrad)"
          opacity="0.8"
        />
        
        {/* Neural network nodes */}
        <Circle cx="80" cy="60" r="4" fill="#00d4aa" />
        <Circle cx="100" cy="50" r="5" fill="#00a8ff" />
        <Circle cx="120" cy="65" r="4" fill="#ffd700" />
        <Circle cx="90" cy="80" r="3" fill="#ff6b9d" />
        <Circle cx="110" cy="75" r="4" fill="#00d4aa" />
        
        {/* Connections */}
        <Path d="M80,60 L100,50" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
        <Path d="M100,50 L120,65" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
        <Path d="M80,60 L90,80" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
        <Path d="M100,50 L110,75" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
        <Path d="M120,65 L110,75" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
        
        {/* Data streams */}
        <Path d="M30,120 Q50,110 70,105" stroke="#00d4aa" strokeWidth="2" fill="none" opacity="0.7" />
        <Path d="M170,120 Q150,110 130,105" stroke="#00a8ff" strokeWidth="2" fill="none" opacity="0.7" />
      </Svg>
    </View>
  );

  const MoneyIllustration = () => (
    <View style={styles.illustrationContainer}>
      <Svg width={200} height={150} viewBox="0 0 200 150">
        <Defs>
          <SvgLinearGradient id="moneyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00d4aa" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Coins */}
        <Circle cx="70" cy="80" r="20" fill="url(#moneyGrad)" opacity="0.9" />
        <Circle cx="130" cy="60" r="25" fill="url(#moneyGrad)" opacity="0.8" />
        <Circle cx="100" cy="100" r="18" fill="url(#moneyGrad)" />
        
        {/* Dollar signs - using SVG Text elements */}
        <SvgText x="65" y="88" fontSize="16" fill="#0a0b14" fontWeight="bold">$</SvgText>
        <SvgText x="123" y="70" fontSize="20" fill="#0a0b14" fontWeight="bold">$</SvgText>
        <SvgText x="95" y="108" fontSize="14" fill="#0a0b14" fontWeight="bold">$</SvgText>
        
        {/* Growth arrow */}
        <Path
          d="M40,120 Q80,100 120,80 Q140,70 160,50"
          stroke="#00d4aa"
          strokeWidth="4"
          fill="none"
          opacity="0.9"
        />
        <Path d="M150,55 L160,50 L155,45" stroke="#00d4aa" strokeWidth="4" fill="none" />
        
        {/* Sparkles */}
        <Circle cx="50" cy="50" r="2" fill="#ffd700" opacity="0.8" />
        <Circle cx="150" cy="90" r="3" fill="#00a8ff" opacity="0.7" />
        <Circle cx="180" cy="70" r="2" fill="#ff6b9d" opacity="0.8" />
      </Svg>
    </View>
  );

  const slides: OnboardingSlide[] = [
    {
      id: 1,
      title: "Welcome to GraphAI",
      subtitle: "AI-Powered Trading Analysis",
      description: "Transform your trading decisions with advanced AI chart analysis. Upload any trading chart and get instant, professional insights.",
      icon: "trending-up",
      gradient: ['#00d4aa', '#00a8ff'],
      illustration: <ChartIllustration />,
    },
    {
      id: 2,
      title: "Smart AI Analysis",
      subtitle: "Advanced Pattern Recognition",
      description: "Our AI analyzes chart patterns, trends, and market signals to provide you with actionable insights.",
      icon: "bulb",
      gradient: ['#ff6b9d', '#00d4aa'],
      illustration: <AIIllustration />,
    },
    {
      id: 3,
      title: "Grow Your Wealth",
      subtitle: "Make Informed Decisions",
      description: "Turn market insights into profitable trades.",
      icon: "cash",
      gradient: ['#ffd700', '#00d4aa'],
      illustration: <MoneyIllustration />,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
      
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotPress = (index: number) => {
    setCurrentSlide(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0b14" />
      
      <LinearGradient
        colors={['#0a0b14', '#1a1b2e', '#16213e'] as const}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Skip Button */}
      <Animated.View style={[styles.skipContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <Animated.View
            key={slide.id}
            style={[
              styles.slide,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Illustration */}
            <View style={styles.illustrationSection}>
              {slide.illustration}
              
              {/* Floating elements for visual appeal */}
              <View style={[styles.floatingElement, styles.element1]}>
                <Ionicons name="analytics" size={20} color="#00d4aa" />
              </View>
              <View style={[styles.floatingElement, styles.element2]}>
                <Ionicons name="trending-up" size={16} color="#00a8ff" />
              </View>
              <View style={[styles.floatingElement, styles.element3]}>
                <Ionicons name="flash" size={14} color="#ffd700" />
              </View>
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={slide.gradient as [string, string, ...string[]]}
                  style={styles.iconGradient}
                >
                  <Ionicons name={slide.icon} size={32} color="white" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={[
                styles.dot,
                currentSlide === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
          <LinearGradient
            colors={slides[currentSlide].gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentSlide === slides.length - 1 ? 'rocket' : 'arrow-forward'} 
              size={20} 
              color="white" 
              style={styles.actionButtonIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  illustrationSection: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 27, 46, 0.3)',
    borderRadius: 100,
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  element1: {
    top: 20,
    right: 20,
  },
  element2: {
    bottom: 30,
    left: 10,
  },
  element3: {
    top: 60,
    left: -10,
  },
  contentSection: {
    flex: 0.5,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d4aa',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#00d4aa',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtonIcon: {
    marginLeft: 12,
  },
});

export default OnboardingScreen;
