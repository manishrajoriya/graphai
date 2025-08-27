import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export class OnboardingService {
  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  }

  /**
   * Reset onboarding status (for testing purposes)
   */
  static async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }
}

export default OnboardingService;
