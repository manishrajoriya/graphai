import { supabase } from './supabase';
import { resolveUserId } from './userId';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SESSION_KEY = 'analytics_session_id';
const SESSION_START_KEY = 'session_start_time';

interface AnalyticsEvent {
  user_id: string;
  session_id: string;
  page_name: string; // Keep for database compatibility
  action_type: 'button_click';
  action_details?: Record<string, any>;
  device_info?: Record<string, any>;
}

interface DeviceInfo {
  platform: string;
  os_version: string;
  app_version: string;
  device_model?: string;
}

class AnalyticsService {
  private currentSessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private userId: string | null = null;

  // Initialize session and user ID
  async initialize(): Promise<void> {
    try {
      // Get or create user ID
      this.userId = await resolveUserId();
      
      // Get or create session ID
      const existingSessionId = await AsyncStorage.getItem(SESSION_KEY);
      const sessionStartTime = await AsyncStorage.getItem(SESSION_START_KEY);
      
      if (existingSessionId && sessionStartTime) {
        // Check if session is still valid (less than 30 minutes old)
        const startTime = parseInt(sessionStartTime);
        const now = Date.now();
        const sessionAge = now - startTime;
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (sessionAge < thirtyMinutes) {
          this.currentSessionId = existingSessionId;
          this.sessionStartTime = startTime;
        } else {
          // Session expired, create new one
          await this.createNewSession();
        }
      } else {
        // No existing session, create new one
        await this.createNewSession();
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      // Create fallback session
      this.currentSessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
    }
  }

  private async createNewSession(): Promise<void> {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    await AsyncStorage.setItem(SESSION_KEY, this.currentSessionId);
    await AsyncStorage.setItem(SESSION_START_KEY, this.sessionStartTime.toString());
    
    // Record session start in database
    await this.insertSessionRecord();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      os_version: Platform.Version.toString(),
      app_version: Constants.expoConfig?.version || '1.0.0',
      device_model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device'
    };
  }

  private async insertSessionRecord(): Promise<void> {
    try {
      if (!this.userId || !this.currentSessionId) return;

      await supabase
        .from('user_sessions')
        .insert({
          session_id: this.currentSessionId,
          user_id: this.userId,
          start_time: new Date(this.sessionStartTime!).toISOString(),
          device_info: this.getDeviceInfo()
        });
    } catch (error) {
      console.error('Failed to insert session record:', error);
    }
  }


  // Track button click
  async trackButtonClick(buttonName: string, additionalData?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      page_name: 'app', // Default page name for database compatibility
      action_type: 'button_click',
      action_details: {
        button_name: buttonName,
        ...additionalData
      }
    });
  }



  // Generic event tracking
  private async trackEvent(event: Omit<AnalyticsEvent, 'user_id' | 'session_id' | 'device_info'>): Promise<void> {
    try {
      // Ensure we have user ID and session ID
      if (!this.userId) {
        this.userId = await resolveUserId();
      }
      
      if (!this.currentSessionId) {
        await this.initialize();
      }

      const analyticsEvent: AnalyticsEvent = {
        user_id: this.userId!,
        session_id: this.currentSessionId!,
        device_info: this.getDeviceInfo(),
        ...event
      };

      // Insert into database
      const { error } = await supabase
        .from('user_analytics')
        .insert(analyticsEvent);

      if (error) {
        console.error('Analytics tracking error:', error);
      }

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }


  private async endSession(): Promise<void> {
    try {
      if (!this.currentSessionId || !this.sessionStartTime) return;

      const endTime = Date.now();
      const duration = Math.floor((endTime - this.sessionStartTime) / 1000); // in seconds

      await supabase
        .from('user_sessions')
        .update({
          end_time: new Date(endTime).toISOString(),
          total_duration: duration
        })
        .eq('session_id', this.currentSessionId);

      // Clear session from storage
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(SESSION_START_KEY);

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Get user analytics data (for admin/debugging purposes)
  async getUserAnalytics(userId?: string): Promise<any[]> {
    try {
      const targetUserId = userId || this.userId;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', targetUserId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch user analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return [];
    }
  }

  // Get user sessions data
  async getUserSessions(userId?: string): Promise<any[]> {
    try {
      const targetUserId = userId || this.userId;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Failed to fetch user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export convenience functions
export const trackButtonClick = (buttonName: string, additionalData?: Record<string, any>) => 
  analyticsService.trackButtonClick(buttonName, additionalData);
