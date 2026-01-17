import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  /**
   * Log a custom event
   */
  async logEvent(name: string, params?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent(name, params);
      console.log(`[Analytics] Event logged: ${name}`, params);
    } catch (error) {
      console.error(`[Analytics] Error logging event ${name}:`, error);
    }
  }

  /**
   * Log a screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`[Analytics] Screen view logged: ${screenName}`);
    } catch (error) {
      console.error(`[Analytics] Error logging screen view ${screenName}:`, error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await analytics().setUserProperty(name, value);
    } catch (error) {
      console.error(`[Analytics] Error setting user property ${name}:`, error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.error(`[Analytics] Error setting user ID:`, error);
    }
  }
}

export const analyticsService = new AnalyticsService();
