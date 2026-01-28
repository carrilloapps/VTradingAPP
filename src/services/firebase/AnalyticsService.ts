import { getAnalytics, logEvent, setUserProperty, setUserId } from '@react-native-firebase/analytics';
import * as Clarity from '@microsoft/react-native-clarity';
import * as Sentry from '@sentry/react-native';
import { observabilityService } from '../ObservabilityService';

class AnalyticsService {
  /**
   * Log a custom event
   */
  async logEvent(name: string, params?: Record<string, any>): Promise<void> {
    try {
      await logEvent(getAnalytics(), name, params);

      // Mirror important events to Clarity
      // Clarity custom tags are key-value pairs, or we can send a custom event
      Clarity.sendCustomEvent(name);

      Sentry.addBreadcrumb({
        category: 'analytics',
        message: name,
        data: params,
        level: 'info',
      });

      // If we have critical params, we might want to tag the session
      if (params && params.screen_name) {
        // Note: Clarity doesn't have a direct "screen_view" concept, but we can tag it
        // Clarity.setCustomTag('current_screen', params.screen_name);
      }
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
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Viewed ${screenName}`,
        level: 'info',
      });
      // Tag Clarity session with current screen to filter sessions by screen
      Clarity.setCustomTag('screen_view', screenName);
    } catch (e) {
      observabilityService.captureError(e);
      // Error logging screen view
    }
  }

  /**
   * Log search event
   */
  async logSearch(searchTerm: string): Promise<void> {
    return this.logEvent('search', { search_term: searchTerm });
  }

  /**
   * Log select content event (e.g. clicking a stock)
   */
  async logSelectContent(contentType: string, itemId: string): Promise<void> {
    return this.logEvent('select_content', {
      content_type: contentType,
      item_id: itemId
    });
  }

  /**
   * Log share event
   */
  async logShare(contentType: string, itemId: string, method: string): Promise<void> {
    return this.logEvent('share', {
      content_type: contentType,
      item_id: itemId,
      method: method // e.g. "image_square", "image_story", "text"
    });
  }

  /**
   * Log login event
   */
  async logLogin(method: string): Promise<void> {
    return this.logEvent('login', { method });
  }

  /**
   * Log sign up event
   */
  async logSignUp(method: string): Promise<void> {
    return this.logEvent('sign_up', { method });
  }

  /**
   * Set user properties
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await setUserProperty(getAnalytics(), name, value);
      Clarity.setCustomTag(name, value);
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
      if (userId) {
        Clarity.setCustomUserId(userId);
      }
    } catch (e) {
      observabilityService.captureError(e);
      // Error setting user ID
    }
  }

  /**
   * Enable or disable analytics collection
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await getAnalytics().setAnalyticsCollectionEnabled(enabled);
      // Mirror to Clarity
      if (enabled) {
        Clarity.resume();
      } else {
        Clarity.pause();
      }
    } catch (e) {
      observabilityService.captureError(e);
    }
  }
}

export const analyticsService = new AnalyticsService();
