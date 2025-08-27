import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import PaywallScreen from '../../components/Paywall';
import { useAnalytics } from '../../hooks/useAnalytics';
import SubscriptionService from '../../services/subscriptionService';

const { width, height } = Dimensions.get('window');

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, ...string[]];
  benefits: string[];
  demoComponent?: React.ReactNode;
  isAvailable?: boolean;
  isDisclaimer?: boolean;
  isPremium?: boolean;
  confidence?: string;
  accuracy?: string;
}

const FeaturesScreen = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { trackButton } = useAnalytics();

  // Individual card animations
  const cardAnims = useRef(
    Array.from({ length: 7 }, () => ({
      fadeAnim: new Animated.Value(0),
      slideAnim: new Animated.Value(30),
    }))
  ).current;

  React.useEffect(() => {
    const checkAccess = async () => {
      const access = await SubscriptionService.hasAccess('premium');
      setHasAccess(access);
    };
    checkAccess();
  }, []);

  React.useEffect(() => {
    // Staggered animation for cards
    const animations = cardAnims.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.slideAnim, {
          toValue: 0,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(50, animations).start();

    // Header animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const StaticIcon = ({ name, size = 24, color = 'white' }: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string }) => {
    return (
      <Ionicons name={name} size={size} color={color} />
    );
  };

  const ChartAnalysisDemo = () => (
    <View style={styles.demoContainer}>
      <View style={styles.demoHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>LIVE ANALYSIS</Text>
        </View>
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyText}>95% Accuracy</Text>
        </View>
      </View>
      
      <Svg width={300} height={220} viewBox="0 0 300 220">
        <Defs>
          <SvgLinearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00d4aa" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00a8ff" stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffd700" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#ff6b9d" stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Chart bars with glow effect */}
        <Path d="M40,180 L40,140 L60,140 L60,180 Z" fill="url(#chartGrad)" opacity="0.9" />
        <Path d="M75,180 L75,120 L95,120 L95,180 Z" fill="url(#chartGrad)" opacity="0.95" />
        <Path d="M110,180 L110,100 L130,100 L130,180 Z" fill="url(#chartGrad)" />
        <Path d="M145,180 L145,130 L165,130 L165,180 Z" fill="url(#chartGrad)" opacity="0.9" />
        <Path d="M180,180 L180,80 L200,80 L200,180 Z" fill="url(#chartGrad)" />
        <Path d="M215,180 L215,110 L235,110 L235,180 Z" fill="url(#chartGrad)" opacity="0.95" />
        <Path d="M250,180 L250,70 L270,70 L270,180 Z" fill="url(#chartGrad)" />
        
        {/* Trend line with glow */}
        <Path
          d="M40,160 Q90,140 155,90 T270,60"
          stroke="url(#glowGrad)"
          strokeWidth="4"
          fill="none"
          opacity="0.9"
        />
        
        {/* Analysis points with pulse effect */}
        <Circle cx="90" cy="130" r="6" fill="#00d4aa" opacity="0.9" />
        <Circle cx="190" cy="80" r="6" fill="#00a8ff" opacity="0.9" />
        <Circle cx="270" cy="65" r="6" fill="#ffd700" opacity="0.9" />
      </Svg>
      
      <View style={styles.analysisResults}>
        <View style={styles.resultCard}>
          <Ionicons name="trending-up" size={20} color="#00d4aa" />
          <Text style={styles.resultText}>
            <Text style={styles.resultHighlight}>Bullish Pattern</Text> Detected
          </Text>
        </View>
        <View style={styles.resultCard}>
          <Ionicons name="shield-checkmark" size={20} color="#00a8ff" />
          <Text style={styles.resultText}>
            <Text style={styles.resultHighlight}>High Confidence</Text> Signal
          </Text>
        </View>
        <View style={styles.resultCard}>
          <Ionicons name="rocket" size={20} color="#ffd700" />
          <Text style={styles.resultText}>
            <Text style={styles.resultHighlight}>Entry Point</Text> Identified
          </Text>
        </View>
      </View>
    </View>
  );

  const MarketResearchDemo = () => (
    <View style={styles.demoContainer}>
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>AAPL</Text>
          <Text style={styles.stockName}>Apple Inc.</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.stockPrice}>$175.43</Text>
          <View style={styles.changeContainer}>
            <Ionicons name="trending-up" size={14} color="#00d4aa" />
            <Text style={styles.priceChange}>+2.1%</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>P/E Ratio</Text>
          <Text style={styles.metricValue}>28.5</Text>
          <Text style={styles.metricStatus}>Moderate</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Market Cap</Text>
          <Text style={styles.metricValue}>$2.8T</Text>
          <Text style={styles.metricStatus}>Large Cap</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>AI Rating</Text>
          <Text style={[styles.metricValue, styles.buyRating]}>BUY</Text>
          <Text style={styles.metricStatus}>Strong</Text>
        </View>
      </View>
      
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Ionicons name="bulb" size={18} color="#ffd700" />
          <Text style={styles.insightTitle}>AI Insight</Text>
        </View>
        <Text style={styles.insightText}>
          Strong fundamentals with growing services revenue. AI integration driving future innovation and market expansion.
        </Text>
      </View>
    </View>
  );

  const RealTimeDemo = () => (
    <View style={styles.demoContainer}>
      <View style={styles.marketHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>REAL-TIME DATA</Text>
        </View>
        <Text style={styles.updateTime}>Updated 2s ago</Text>
      </View>
      
      <View style={styles.cryptoGrid}>
        <View style={styles.cryptoCard}>
          <View style={styles.cryptoHeader}>
            <Text style={styles.cryptoSymbol}>BTC</Text>
            <View style={styles.cryptoTrend}>
              <Ionicons name="trending-up" size={16} color="#00d4aa" />
            </View>
          </View>
          <Text style={styles.cryptoPrice}>$43,250</Text>
          <Text style={[styles.cryptoChange, styles.positive]}>+3.2%</Text>
        </View>
        
        <View style={styles.cryptoCard}>
          <View style={styles.cryptoHeader}>
            <Text style={styles.cryptoSymbol}>ETH</Text>
            <View style={styles.cryptoTrend}>
              <Ionicons name="trending-up" size={16} color="#00d4aa" />
            </View>
          </View>
          <Text style={styles.cryptoPrice}>$2,680</Text>
          <Text style={[styles.cryptoChange, styles.positive]}>+1.8%</Text>
        </View>
        
        <View style={styles.cryptoCard}>
          <View style={styles.cryptoHeader}>
            <Text style={styles.cryptoSymbol}>SPY</Text>
            <View style={styles.cryptoTrend}>
              <Ionicons name="trending-down" size={16} color="#ff6b9d" />
            </View>
          </View>
          <Text style={styles.cryptoPrice}>$485.20</Text>
          <Text style={[styles.cryptoChange, styles.negative]}>-0.5%</Text>
        </View>
      </View>
      
      <View style={styles.riskMeter}>
        <Text style={styles.riskTitle}>Market Risk Level</Text>
        <View style={styles.riskBar}>
          <View style={[styles.riskFill, { width: '35%' }]} />
        </View>
        <Text style={styles.riskLevel}>Low Risk • Favorable Conditions</Text>
      </View>
    </View>
  );

  const features: Feature[] = [
    {
      id: 'ai-analysis',
      title: 'Smart Pattern Recognition',
      description: 'Advanced AI instantly identifies chart patterns, support/resistance levels, and trend formations with industry-leading accuracy.',
      icon: 'analytics-outline',
      gradient: ['#00d4aa', '#00a8ff', '#10b981'],
      benefits: [
        'Detects 25+ chart patterns automatically',
        'Identifies key support & resistance zones',
        'Advanced trend channel recognition',
        'Real-time pattern reliability scoring'
      ],
      demoComponent: <ChartAnalysisDemo />,
      isAvailable: true,
      isPremium: false,
      accuracy: '95%',
      confidence: 'High'
    },
    {
      id: 'trading-signals',
      title: 'AI Trading Signals',
      description: 'Receive precise buy/sell/hold recommendations with confidence levels and optimal entry/exit points.',
      icon: 'flash-outline',
      gradient: ['#ff6b9d', '#ffd700', '#ff8a65'],
      benefits: [
        'Crystal clear buy/sell/hold signals',
        'Confidence scoring (0-100%)',
        'Optimal entry & exit targets',
        'Smart stop-loss recommendations'
      ],
      demoComponent: <MarketResearchDemo />,
      isAvailable: true,
      isPremium: true,
      accuracy: '87%',
      confidence: 'Very High'
    },
    {
      id: 'risk-management',
      title: 'Smart Risk Assessment',
      description: 'Comprehensive AI-powered risk analysis including volatility scoring, position sizing, and market sentiment.',
      icon: 'shield-checkmark-outline',
      gradient: ['#8b5cf6', '#ec4899', '#06b6d4'],
      benefits: [
        'Advanced volatility analysis',
        'Intelligent position sizing',
        'Risk-reward optimization',
        'Real-time sentiment tracking'
      ],
      demoComponent: <RealTimeDemo />,
      isAvailable: true,
      isPremium: true,
      accuracy: '92%',
      confidence: 'High'
    },
    {
      id: 'market-context',
      title: 'Market Intelligence',
      description: 'Deep market context analysis with sector correlations, economic indicators, and cross-asset insights.',
      icon: 'globe-outline',
      gradient: ['#00a8ff', '#ffd700', '#00d4aa'],
      benefits: [
        'Sector performance analysis',
        'Economic indicator correlation',
        'Multi-timeframe context',
        'Cross-asset relationship mapping'
      ],
      isAvailable: true,
      isPremium: true,
      accuracy: '89%',
      confidence: 'High'
    },
    {
      id: 'price-action',
      title: 'Advanced Price Action',
      description: 'Sophisticated candlestick analysis, volume profiling, and momentum indicators for precise market timing.',
      icon: 'pulse-outline',
      gradient: ['#10b981', '#00d4aa', '#06b6d4'],
      benefits: [
        'Expert candlestick interpretation',
        'Volume profile analysis',
        'Momentum indicator synthesis',
        'Market timing optimization'
      ],
      isAvailable: true,
      isPremium: true,
      accuracy: '91%',
      confidence: 'Very High'
    },
    {
      id: 'learning-ai',
      title: 'Personalized AI Learning',
      description: 'Get detailed explanations of AI decisions and personalized trading education to improve your skills.',
      icon: 'school-outline',
      gradient: ['#ec4899', '#8b5cf6', '#06b6d4'],
      benefits: [
        'AI decision explanations',
        'Personalized learning paths',
        'Trading psychology insights',
        'Performance improvement tracking'
      ],
      isAvailable: true,
      isPremium: true,
      accuracy: 'N/A',
      confidence: 'Educational'
    },
    {
      id: 'disclaimer',
      title: 'GraphAI Risk Disclosure & Terms',
      description: 'Important legal information, company policies, and risk disclosures specific to GraphAI trading platform usage.',
      icon: 'warning-outline',
      gradient: ['#ff6b9d', '#ffa726', '#f57c00'],
      benefits: [
        'GraphAI provides educational AI analysis tools only, not investment advice',
        'Trading cryptocurrencies and stocks involves substantial risk of loss',
        'You may lose some or all of your invested capital',
        'AI predictions are not guaranteed and may be inaccurate',
        'GraphAI is not a registered investment advisor or broker-dealer',
        'Users must be 18+ and comply with local trading regulations',
        'Platform availability may be limited in certain jurisdictions',
        'AI algorithms are experimental and subject to technical failures',
        'Market data delays may affect analysis accuracy (up to 15 minutes)',
        'GraphAI collects usage data to improve AI models and services',
        'Subscription fees are non-refundable after 7-day trial period',
        'Users are responsible for their own tax reporting and compliance',
        'GraphAI reserves the right to suspend accounts for policy violations',
        'No guarantee of platform uptime or continuous service availability',
        'Third-party data providers may experience outages affecting our service',
        'Users must not engage in market manipulation or illegal trading activities',
        'GraphAI liability is limited to subscription fees paid in the last 12 months',
        'Disputes must be resolved through binding arbitration, not court litigation',
        'By using GraphAI, you acknowledge reading and accepting these terms',
        'Consult licensed financial professionals before making investment decisions'
      ],
      isAvailable: true,
      isDisclaimer: true,
    },
  ];

  const handleFeaturePress = (feature: Feature) => {
    setSelectedFeature(feature);
    setShowModal(true);
    trackEvent('feature_viewed', {
      feature_id: feature.id,
      feature_title: feature.title
    });
  };

  const handleUpgradePress = (feature: Feature) => {
    setShowPaywall(true);
    trackEvent('paywall_triggered', {
      feature_id: feature.id,
      feature_title: feature.title,
      source: 'upgrade_button'
    });
  };

  const trackEvent = (eventName: string, properties: any) => {
    trackButton(eventName, properties);
  };

  const renderFeatureCard = (feature: Feature, index: number) => {
    const cardAnim = cardAnims[index];
    
    return (
      <Animated.View
        key={feature.id}
        style={[
          styles.featureCard,
          {
            opacity: cardAnim.fadeAnim,
            transform: [{ translateY: cardAnim.slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleFeaturePress(feature)}
          style={styles.cardTouchable}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={feature.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.iconRow}>
                <View style={[styles.iconContainer, feature.isDisclaimer && styles.disclaimerIcon]}>
                  <StaticIcon name={feature.icon} size={28} color="white" />
                </View>
                {feature.accuracy && (
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.accuracyText}>{feature.accuracy}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.statusContainer}>
                {feature.isAvailable && !feature.isDisclaimer && (
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={12} color="#ffd700" />
                    <Text style={styles.aiTagText}>AI POWERED</Text>
                  </View>
                )}
                {feature.isPremium && !hasAccess && (
                  <View style={styles.premiumTag}>
                    <Ionicons name="diamond" size={12} color="#ffd700" />
                    <Text style={styles.premiumTagText}>PRO</Text>
                  </View>
                )}
                {feature.isDisclaimer && (
                  <View style={styles.disclaimerTag}>
                    <Text style={styles.disclaimerTagText}>IMPORTANT</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              
              {/* Quick Benefits */}
              <View style={styles.quickBenefits}>
                {feature.benefits.slice(0, 2).map((benefit, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Footer */}
            <View style={styles.cardFooter}>
              {feature.isPremium && !hasAccess && !feature.isDisclaimer ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleFeaturePress(feature)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {feature.demoComponent && feature.isAvailable ? 'View Demo' : 'Learn More'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleUpgradePress(feature)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="diamond" size={16} color="white" />
                      <Text style={styles.primaryButtonText}>Upgrade to Pro</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleFeaturePress(feature)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    {feature.demoComponent && feature.isAvailable ? 'View Demo' : 
                     feature.isDisclaimer ? 'Read Important Info' : 'Learn More'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0b14" />
      
      {/* Background */}
      <LinearGradient
        colors={['#0a0b14', '#1a1b2e', '#0a0b14']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Trading Features</Text>
            <Text style={styles.headerSubtitle}>
              Powered by advanced machine learning algorithms
            </Text>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>95%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>25+</Text>
                <Text style={styles.statLabel}>Patterns</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24/7</Text>
                <Text style={styles.statLabel}>Analysis</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => renderFeatureCard(feature, index))}
        </View>
        
        {/* Bottom CTA */}
        <View style={styles.bottomCTA}>
          <LinearGradient
            colors={['rgba(0,212,170,0.1)', 'rgba(0,168,255,0.1)']}
            style={styles.ctaContainer}
          >
            <Text style={styles.ctaTitle}>Ready to elevate your trading?</Text>
            <Text style={styles.ctaDescription}>
              Join thousands of traders using AI-powered insights
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setShowPaywall(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4aa', '#00a8ff']}
                style={styles.ctaButtonGradient}
              >
                <Ionicons name="rocket" size={20} color="white" />
                <Text style={styles.ctaButtonText}>Upgrade to Pro</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Feature Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#0a0b14', '#1a1b2e', '#0a0b14']}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <LinearGradient
                  colors={selectedFeature?.gradient || ['#00d4aa', '#00a8ff']}
                  style={styles.modalIconContainer}
                >
                  <Ionicons name={selectedFeature?.icon || 'apps'} size={24} color="white" />
                </LinearGradient>
                <View style={styles.modalTitleContent}>
                  <Text style={styles.modalTitle}>{selectedFeature?.title}</Text>
                  {selectedFeature?.confidence && (
                    <Text style={styles.modalConfidence}>
                      {selectedFeature.confidence} Confidence • {selectedFeature.accuracy} Accuracy
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDescription}>{selectedFeature?.description}</Text>
              
              {selectedFeature?.demoComponent && selectedFeature?.isAvailable && (
                <View style={styles.demoSection}>
                  {selectedFeature.demoComponent}
                </View>
              )}
              
              <View style={styles.modalBenefits}>
                <Text style={styles.benefitsTitle}>
                  {selectedFeature?.isDisclaimer ? 'Important Information:' : 'Key Features:'}
                </Text>
                {selectedFeature?.benefits.map((benefit, index) => (
                  <View key={index} style={styles.modalBenefitItem}>
                    <Ionicons 
                      name={selectedFeature.isDisclaimer ? "warning" : "checkmark-circle"} 
                      size={20} 
                      color={selectedFeature.isDisclaimer ? "#ff6b9d" : "#00d4aa"} 
                    />
                    <Text style={styles.modalBenefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
              
              {selectedFeature?.isPremium && !hasAccess && !selectedFeature.isDisclaimer && (
                <View style={styles.proFeatureNotice}>
                  <View style={styles.proNoticeHeader}>
                    <Ionicons name="diamond" size={20} color="#ffd700" />
                    <Text style={styles.proNoticeTitle}>Pro Feature</Text>
                  </View>
                  <Text style={styles.proNoticeText}>
                    This is a premium feature. Upgrade to Pro to unlock full access and advanced capabilities.
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => {
                      setShowModal(false);
                      setShowPaywall(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#ffd700', '#ff6b9d']}
                      style={styles.upgradeButtonGradient}
                    >
                      <Ionicons name="diamond" size={18} color="white" />
                      <Text style={styles.upgradeButtonText}>Unlock Pro Features</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          onDismiss={() => setShowPaywall(false)}
          onPurchaseCompleted={async (customerInfo) => {
            console.log('Purchase completed:', customerInfo);
            const access = await SubscriptionService.hasAccess('premium');
            setHasAccess(access);
            setShowPaywall(false);
          }}
          onRestoreCompleted={async (customerInfo) => {
            console.log('Restore completed:', customerInfo);
            const access = await SubscriptionService.hasAccess('premium');
            setHasAccess(access);
            setShowPaywall(false);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00d4aa',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  featuresContainer: {
    paddingHorizontal: 20,
  },
  featureCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    padding: 24,
    minHeight: 240,
  },
  cardHeader: {
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disclaimerIcon: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderColor: 'rgba(255, 107, 157, 0.4)',
  },
  accuracyBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  accuracyText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 4,
  },
  aiTagText: {
    color: '#ffd700',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
    gap: 4,
  },
  premiumTagText: {
    color: '#ff6b9d',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disclaimerTag: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.4)',
  },
  disclaimerTagText: {
    color: '#ff6b9d',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  featureDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 20,
  },
  quickBenefits: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  bottomCTA: {
    margin: 20,
    marginTop: 32,
  },
  ctaContainer: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  ctaDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0a0b14',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalTitleContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalConfidence: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  closeButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalScrollContent: {
    paddingBottom: 60,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: 24,
  },
  demoSection: {
    marginBottom: 32,
    marginTop: 8,
  },
  modalBenefits: {
    marginTop: 24,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  modalBenefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  modalBenefitText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    lineHeight: 22,
  },
  upgradeButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 8,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Demo Components Styles
  demoContainer: {
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00d4aa',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00d4aa',
    letterSpacing: 1,
  },
  updateTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  analysisResults: {
    marginTop: 24,
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  resultText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  resultHighlight: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Market Research Demo Styles
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4aa',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  buyRating: {
    color: '#00d4aa',
  },
  metricStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd700',
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  // Real-time Demo Styles
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cryptoGrid: {
    gap: 12,
    marginBottom: 24,
  },
  cryptoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  cryptoTrend: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cryptoChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#00d4aa',
  },
  negative: {
    color: '#ff6b9d',
  },
  riskMeter: {
    alignItems: 'center',
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  riskBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  riskFill: {
    height: '100%',
    backgroundColor: '#00d4aa',
    borderRadius: 4,
  },
  riskLevel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  proFeatureNotice: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  proNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  proNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffd700',
  },
  proNoticeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
});

export default FeaturesScreen;