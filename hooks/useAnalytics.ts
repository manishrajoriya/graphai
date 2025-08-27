import { useEffect, useCallback } from 'react';
import { trackButtonClick, analyticsService } from '../services/analyticsService';

export function useAnalytics() {
  // Return tracking functions for use in components
  const trackButton = useCallback((buttonName: string, data?: Record<string, any>) => {
    trackButtonClick(buttonName, data);
  }, []);

  return {
    trackButton
  };
}

// Hook for app lifecycle tracking (only initializes analytics)
export function useAppLifecycle() {
  useEffect(() => {
    // Initialize analytics when app starts
    analyticsService.initialize();
  }, []);
}
