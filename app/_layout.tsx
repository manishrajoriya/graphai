import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppLifecycle } from '@/hooks/useAnalytics';
import SubscriptionService from '@/services/subscriptionService';
import OnboardingService from '@/services/onboardingService';
import OnboardingScreen from '@/components/OnboardingScreen';
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

  // Initialize analytics
  useAppLifecycle();

  useEffect(() => {
    SubscriptionService.initialize();
    
    // Check onboarding status
    const checkOnboardingStatus = async () => {
      const completed = await OnboardingService.hasCompletedOnboarding();
      setHasCompletedOnboarding(completed);
    };
    
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = async () => {
    await OnboardingService.completeOnboarding();
    setHasCompletedOnboarding(true);
  };

  if (!loaded || hasCompletedOnboarding === null) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
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
