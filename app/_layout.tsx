import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppLifecycle } from '@/hooks/useAnalytics';
import SubscriptionService from '@/services/subscriptionService';
import OnboardingService from '@/services/onboardingService';
import OnboardingScreen from '@/components/OnboardingScreen';
import PaywallScreen from '@/components/Paywall';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Initialize analytics
  useAppLifecycle();

  useEffect(() => {
    const initializeApp = async () => {
      await SubscriptionService.initialize();
      
      // Check onboarding status
      const completed = await OnboardingService.hasCompletedOnboarding();
      setHasCompletedOnboarding(completed);
      
      // If onboarding is completed, check subscription status
      if (completed) {
        const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus();
        setIsSubscribed(subscriptionStatus.isSubscribed);
        
        // Show paywall if user is not subscribed
        if (!subscriptionStatus.isSubscribed) {
          setShowPaywall(true);
        }
      }
    };
    
    initializeApp();
  }, []);

  const handleOnboardingComplete = async () => {
    await OnboardingService.completeOnboarding();
    setHasCompletedOnboarding(true);
    
    // Check subscription status after onboarding
    const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus();
    setIsSubscribed(subscriptionStatus.isSubscribed);
    
    // Show paywall if user is not subscribed
    if (!subscriptionStatus.isSubscribed) {
      setShowPaywall(true);
    }
  };

  const handlePaywallDismiss = () => {
    setShowPaywall(false);
  };

  const handlePurchaseCompleted = async () => {
    // Refresh subscription status
    const subscriptionStatus = await SubscriptionService.checkSubscriptionStatus();
    setIsSubscribed(subscriptionStatus.isSubscribed);
    setShowPaywall(false);
  };

  if (!loaded || hasCompletedOnboarding === null) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show paywall if user is not subscribed
  if (showPaywall) {
    return (
      <PaywallScreen
        onDismiss={handlePaywallDismiss}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handlePurchaseCompleted}
      />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
