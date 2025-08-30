import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FormData {
  experience: string;
  tradingStyle: string;
  cryptoFocus: string;
  riskTolerance: string;
  analysisType: string;
  timeframe: string;
  aiFeatures: string;
}

interface FormStep {
  id: number;
  title: string;
  subtitle: string;
  question: string;
  field: keyof FormData;
  icon: keyof typeof Ionicons.glyphMap;
  options: Array<{
    label: string;
    value: string;
  }>;
}

interface OnboardingScreenProps {
  onComplete: (formData: FormData) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    experience: '',
    tradingStyle: '',
    cryptoFocus: '',
    riskTolerance: '',
    analysisType: '',
    timeframe: '',
    aiFeatures: '',
  });

  const formSteps: FormStep[] = [
    {
      id: 1,
      title: "Trading Experience",
      subtitle: "AI-Powered Crypto Analysis",
      question: "What's your crypto trading experience?",
      field: "experience",
      icon: "person-outline",
      options: [
        { label: "New to Crypto Trading", value: "beginner" },
        { label: "Some Experience (6+ months)", value: "intermediate" },
        { label: "Experienced Trader (2+ years)", value: "advanced" },
        { label: "Professional/Institutional", value: "professional" },
      ],
    },
    {
      id: 2,
      title: "Trading Style",
      subtitle: "Define Your Approach",
      question: "Which trading style fits you best?",
      field: "tradingStyle",
      icon: "trending-up-outline",
      options: [
        { label: "Scalping (Minutes)", value: "scalping" },
        { label: "Day Trading (Hours)", value: "day_trading" },
        { label: "Swing Trading (Days/Weeks)", value: "swing_trading" },
        { label: "Long-term Holding", value: "hodling" },
      ],
    },
    {
      id: 3,
      title: "Crypto Focus",
      subtitle: "Market Preference",
      question: "Which crypto markets interest you?",
      field: "cryptoFocus",
      icon: "logo-bitcoin",
      options: [
        { label: "Bitcoin Only", value: "bitcoin" },
        { label: "Major Cryptos (BTC, ETH, ADA)", value: "majors" },
        { label: "Altcoins & DeFi Tokens", value: "altcoins" },
        { label: "All Cryptocurrency Markets", value: "all" },
      ],
    },
    {
      id: 4,
      title: "Risk Profile",
      subtitle: "Investment Strategy",
      question: "What's your risk tolerance?",
      field: "riskTolerance",
      icon: "shield-outline",
      options: [
        { label: "Conservative (Stable coins focus)", value: "conservative" },
        { label: "Moderate (Balanced portfolio)", value: "moderate" },
        { label: "Aggressive (High growth potential)", value: "aggressive" },
        { label: "Very High (Maximum volatility)", value: "very_high" },
      ],
    },
    {
      id: 5,
      title: "AI Analysis Type",
      subtitle: "Choose Your Tools",
      question: "Which AI analysis do you need most?",
      field: "analysisType",
      icon: "analytics-outline",
      options: [
        { label: "Technical Pattern Recognition", value: "technical" },
        { label: "Market Sentiment Analysis", value: "sentiment" },
        { label: "Price Prediction Models", value: "prediction" },
        { label: "News & Social Media Impact", value: "news_analysis" },
      ],
    },
    {
      id: 6,
      title: "Chart Timeframe",
      subtitle: "Analysis Period",
      question: "What timeframe do you analyze?",
      field: "timeframe",
      icon: "time-outline",
      options: [
        { label: "1-15 Minutes (Scalping)", value: "short" },
        { label: "1-4 Hours (Intraday)", value: "medium" },
        { label: "Daily Charts", value: "daily" },
        { label: "Weekly/Monthly (Long-term)", value: "long" },
      ],
    },
    {
      id: 7,
      title: "AI Features",
      subtitle: "Final Setup",
      question: "Which AI features interest you most?",
      field: "aiFeatures",
      icon: "flash-outline",
      options: [
        { label: "Automated Trading Signals", value: "signals" },
        { label: "Portfolio Risk Analysis", value: "risk_analysis" },
        { label: "Market Trend Predictions", value: "predictions" },
        { label: "Real-time Alert System", value: "alerts" },
      ],
    },
  ];

  const currentStepData = formSteps[currentStep];
  const progress = ((currentStep + 1) / formSteps.length) * 100;
  const isLastStep = currentStep === formSteps.length - 1;
  const canProceed = formData[currentStepData.field as keyof FormData];

  const handleNext = () => {
    if (isLastStep) {
      onComplete(formData);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkip = () => {
    // Fill with default values and complete
    const defaultData = {
      experience: formData.experience || 'intermediate',
      tradingStyle: formData.tradingStyle || 'swing_trading',
      cryptoFocus: formData.cryptoFocus || 'majors',
      riskTolerance: formData.riskTolerance || 'moderate',
      analysisType: formData.analysisType || 'technical',
      timeframe: formData.timeframe || 'daily',
      aiFeatures: formData.aiFeatures || 'signals',
    };
    onComplete(defaultData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1c" />
      
      <LinearGradient
        colors={['#0a0f1c', '#1a1f3a', '#0f1419']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>GA</Text>
            </View>
            <Text style={styles.appName}>GraphAI</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentStep + 1} of {formSteps.length}
            </Text>
            <View style={styles.progressTrack}>
              <View 
                style={[styles.progressFill, { width: `${progress}%` }]} 
              />
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconContainer}>
            <Ionicons name={currentStepData.icon} size={32} color="#00d4aa" />
          </View>
          
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentStepData.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentStepData.options.map((option, index) => {
            const isSelected = formData[currentStepData.field as keyof FormData] === option.value;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected
                ]}
                onPress={() => updateFormData(currentStepData.field as keyof FormData, option.value)}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  
                  <View style={[
                    styles.radioButton,
                    isSelected && styles.radioButtonSelected
                  ]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Completion Message */}
        {isLastStep && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              Your AI-powered crypto trading setup is ready!
            </Text>
            <Text style={styles.completionSubtext}>
              Get personalized insights, automated analysis, and smart trading signals.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.buttonSpacer} />
          
          {!isLastStep && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip Setup</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
              isLastStep && styles.completeButton
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Start Trading' : 'Continue'}
            </Text>
            <Ionicons 
              name={isLastStep ? "rocket" : "chevron-forward"} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1c',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#00d4aa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  appName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  progressTrack: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4aa',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  stepHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00d4aa',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionSelected: {
    borderColor: '#00d4aa',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#00d4aa',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00d4aa',
  },
  completionContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  completionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d4aa',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 20,
    backgroundColor: 'rgba(10, 15, 28, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonSpacer: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4aa',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completeButton: {
    backgroundColor: '#ff6b35',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default OnboardingScreen;