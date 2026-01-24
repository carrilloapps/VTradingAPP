import { getAnalytics, logEvent, setUserProperty, setUserId } from '@react-native-firebase/analytics';
import { observabilityService } from '../ObservabilityService';

class AnalyticsService {
  /**
   * Log a custom event
   */
  async logEvent(name: string, params?: Record<string, any>): Promise<void> {
    try {
      await logEvent(getAnalytics(), name, params);
    } catch (e) {
      observabilityService.captureError(e);
      // Error logging event
    }
  }

  /**
   * Log a screen view
   * NOTE: logScreenView is deprecated, using logEvent('screen_view') instead
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await logEvent(getAnalytics(), 'screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (e) {
      observabilityService.captureError(e);
      // Error logging screen view
    }
  }

  /**
   * Set user properties
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await setUserProperty(getAnalytics(), name, value);
    } catch (e) {
      observabilityService.captureError(e);
      // Error setting user property
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await setUserId(getAnalytics(), userId);
    } catch (e) {
      observabilityService.captureError(e);
      // Error setting user ID
    }
  }
}

export const analyticsService = new AnalyticsService();
