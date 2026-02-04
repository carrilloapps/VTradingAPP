import {
  getAnalytics,
  logEvent,
  setUserProperty,
  setUserId,
} from '@react-native-firebase/analytics';
import * as Clarity from '@microsoft/react-native-clarity';
import * as Sentry from '@sentry/react-native';

import { observabilityService } from '@/services/ObservabilityService';

/**
 * Standard event names - Use these constants for consistency
 */
export const ANALYTICS_EVENTS = {
  // Screen Views
  SCREEN_VIEW: 'screen_view',
  TAB_NAVIGATION_ENTER: 'tab_navigation_enter',
  STACK_SCREEN_ENTER: 'stack_screen_enter',

  // User Actions
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',
  SEARCH: 'search',
  SELECT_CONTENT: 'select_content',
  SHARE: 'share',

  // Auth Attempts (for funnel tracking)
  LOGIN_ATTEMPT: 'login_attempt',
  SIGN_UP_ATTEMPT: 'sign_up_attempt',
  PASSWORD_RESET_ATTEMPT: 'password_reset_attempt',
  RESET_PASSWORD_REQUEST: 'reset_password_request',

  // Account Management
  DELETE_ACCOUNT: 'delete_account',
  UPDATE_PROFILE_NAME: 'update_profile_name',
  EDIT_PROFILE_CLICK: 'edit_profile_click',

  // Interactions
  BUTTON_CLICK: 'button_click',
  CARD_TAP: 'card_tap',
  FILTER_APPLIED: 'filter_applied',
  SORT_CHANGED: 'sort_changed',
  DIALOG_OPENED: 'dialog_opened',
  DIALOG_CLOSED: 'dialog_closed',

  // Data Operations
  DATA_REFRESH: 'data_refresh',
  API_CALL: 'api_call',

  // Features
  FEATURE_USED: 'feature_used',
  USER_ENGAGEMENT: 'user_engagement',

  // Custom Session Tracking (Avoids reserved 'session_start'/'session_end')
  V_SESSION_START: 'v_session_start',
  V_SESSION_END: 'v_session_end',

  // Errors
  ERROR: 'error',

  // Widgets
  WIDGET_ADDED: 'widget_added',
  WIDGET_DELETED: 'widget_deleted',
  WIDGET_REFRESH: 'widget_refresh_manual',
  WIDGET_SAVE_CONFIG: 'widget_save_config',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received_foreground',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_PERMISSION_REQUESTED: 'notification_permission_requested',
  NOTIFICATION_SYSTEM_INITIALIZED: 'notification_system_initialized',
  NOTIFICATION_ALERTS_RESUBSCRIBED: 'notification_alerts_resubscribed',
  NOTIFICATION_PERMISSION_RESULT: 'notification_permission_result',

  // Calculator
  CALCULATOR_ADD_CURRENCY: 'calculator_add_currency',
  CALCULATOR_ADD_CURRENCY_PRESSED: 'calculator_add_currency_pressed',
  CALCULATOR_SET_BASE: 'calculator_set_base',
  CALCULATOR_CLEAR: 'calculator_clear',
  CALCULATOR_SAVE_CONFIG: 'calculator_save_config',
  CALCULATOR_REVERT_CONFIG: 'calculator_revert_config',

  // Alerts
  CREATE_ALERT: 'create_alert',
  CREATE_ALERT_CLICK: 'create_alert_click',
  UPDATE_ALERT: 'update_alert',
  DELETE_ALERT: 'delete_alert',
  TOGGLE_ALERT: 'toggle_alert',

  // Settings
  OPEN_EXTERNAL_LINK: 'open_external_link',
  TOGGLE_PUSH: 'toggle_push',
  CHANGE_THEME: 'change_theme',

  // Data Refresh Operations
  BANK_RATES_REFRESH: 'bank_rates_refresh',

  // Onboarding
  ONBOARDING_START: 'onboarding_start',
  ONBOARDING_STEP_VIEW: 'onboarding_step_view',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  NOTIFICATION_PERMISSION_SKIPPED: 'notification_permission_skipped',

  // Deep Links
  DEEP_LINK_OPENED: 'deep_link_opened',

  // Article/Content
  ARTICLE_SHARED: 'article_shared',

  // Stock Operations
  SEARCH_STOCK: 'search_stock',
} as const;

/**
 * Standard event parameter types
 */
export interface AnalyticsEventParams {
  screen_name?: string;
  screen_class?: string;
  method?: string;
  content_type?: string;
  item_id?: string;
  search_term?: string;
  currency?: string;
  symbol?: string;
  action?: string;
  errorCode?: string | number;
  [key: string]: any;
}

/**
 * User interaction event types
 */
export type UserInteractionEvent =
  | 'button_click'
  | 'card_tap'
  | 'filter_applied'
  | 'sort_changed'
  | 'refresh_triggered'
  | 'dialog_opened'
  | 'dialog_closed';

class AnalyticsService {
  /**
   * Log a custom event with structured parameters
   * @param name Event name (use snake_case convention)
   * @param params Event parameters (optional)
   */
  async logEvent(name: string, params?: AnalyticsEventParams): Promise<void> {
    try {
      // Sanitize event name (Firebase Analytics requires alphanumeric + underscore)
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

      await logEvent(getAnalytics(), sanitizedName, params);

      // Mirror important events to Clarity
      Clarity.sendCustomEvent(sanitizedName);

      Sentry.addBreadcrumb({
        category: 'analytics',
        message: sanitizedName,
        data: params,
        level: 'info',
      });

      // Tag Clarity session with screen context if available
      if (params?.screen_name) {
        Clarity.setCustomTag('last_event_screen', params.screen_name);
      }
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AnalyticsService.logEvent',
        eventName: name,
        hasParams: !!params,
        paramCount: params ? Object.keys(params).length : 0,
      });
    }
  }

  /**
   * Log a screen view
   * NOTE: logScreenView is deprecated, using logEvent('screen_view') instead
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await logEvent(getAnalytics(), ANALYTICS_EVENTS.SCREEN_VIEW, {
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
      observabilityService.captureError(e, {
        context: 'AnalyticsService.logScreenView',
        screenName: screenName,
      });
    }
  }

  /**
   * Log search event
   */
  async logSearch(searchTerm: string): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.SEARCH, { search_term: searchTerm });
  }

  /**
   * Log select content event (e.g. clicking a stock)
   */
  async logSelectContent(contentType: string, itemId: string): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.SELECT_CONTENT, {
      content_type: contentType,
      item_id: itemId,
    });
  }

  /**
   * Log share event
   */
  async logShare(contentType: string, itemId: string, method: string): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.SHARE, {
      content_type: contentType,
      item_id: itemId,
      method: method, // e.g. "image_square", "image_story", "text"
    });
  }

  /**
   * Log login event
   */
  async logLogin(method: string): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.LOGIN, { method });
  }

  /**
   * Log sign up event
   */
  async logSignUp(method: string): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.SIGN_UP, { method });
  }

  /**
   * Log user interaction (button clicks, taps, etc.)
   */
  async logInteraction(
    interactionType: UserInteractionEvent,
    params?: AnalyticsEventParams,
  ): Promise<void> {
    return this.logEvent(interactionType, params);
  }

  /**
   * Log feature usage
   */
  async logFeatureUsage(featureName: string, params?: AnalyticsEventParams): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: featureName,
      ...params,
    });
  }

  /**
   * Log error event with standardized format
   */
  async logError(errorType: string, params?: AnalyticsEventParams): Promise<void> {
    return this.logEvent(`${ANALYTICS_EVENTS.ERROR}_${errorType}`, params);
  }

  /**
   * Log API call metrics
   */
  async logApiCall(
    endpoint: string,
    method: string,
    success: boolean,
    durationMs?: number,
  ): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.API_CALL, {
      endpoint,
      method,
      success: success.toString(),
      duration_ms: durationMs,
    });
  }

  /**
   * Log data refresh event
   */
  async logDataRefresh(dataType: string, success: boolean): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.DATA_REFRESH, {
      data_type: dataType,
      success: success.toString(),
    });
  }

  /**
   * Start timing an operation
   * @returns Function to call when operation completes
   */
  startTiming(operationName: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.logEvent('operation_timing', {
        operation: operationName,
        duration_ms: duration,
      });
    };
  }

  /**
   * Log app session start (Custom event to avoid reserved 'session_start')
   */
  async logSessionStart(): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.V_SESSION_START);
  }

  /**
   * Log app session end with duration (Custom event to avoid reserved 'session_end')
   */
  async logSessionEnd(durationMs: number): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.V_SESSION_END, {
      duration_ms: durationMs,
      duration_minutes: Math.round(durationMs / 60000),
    });
  }

  /**
   * Log when user engages with content
   */
  async logEngagement(contentType: string, engagementTime: number): Promise<void> {
    return this.logEvent(ANALYTICS_EVENTS.USER_ENGAGEMENT, {
      content_type: contentType,
      engagement_time_ms: engagementTime,
    });
  }

  /**
   * Set user properties
   * @param name Property name (use snake_case)
   * @param value Property value (converted to string)
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      // Sanitize property name
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      await setUserProperty(getAnalytics(), sanitizedName, value);
      Clarity.setCustomTag(sanitizedName, value);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AnalyticsService.setUserProperty',
        propertyName: name,
      });
    }
  }

  /**
   * Set multiple user properties at once
   */
  async setUserProperties(properties: Record<string, string>): Promise<void> {
    const promises = Object.entries(properties).map(([name, value]) =>
      this.setUserProperty(name, value),
    );
    await Promise.all(promises);
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
      observabilityService.captureError(e, {
        context: 'AnalyticsService.setUserId',
        hasUserId: !!userId,
      });
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
      observabilityService.captureError(e, {
        context: 'AnalyticsService.setAnalyticsCollectionEnabled',
        enabled: enabled,
      });
    }
  }
}

export const analyticsService = new AnalyticsService();
