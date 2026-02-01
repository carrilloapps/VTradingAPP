import { analyticsService, ANALYTICS_EVENTS } from '../../src/services/firebase/AnalyticsService';
import {
  logEvent,
  setUserProperty,
  setUserId,
  getAnalytics,
} from '@react-native-firebase/analytics';
import * as Clarity from '@microsoft/react-native-clarity';
import * as Sentry from '@sentry/react-native';

jest.mock('@microsoft/react-native-clarity', () => ({
  sendCustomEvent: jest.fn(),
  setCustomTag: jest.fn(),
  setCustomUserId: jest.fn(),
  resume: jest.fn(),
  pause: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('logs a sanitized event name', async () => {
      await analyticsService.logEvent('Custom Event-Name!', {
        param1: 'value1',
      });

      expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'custom_event_name_', {
        param1: 'value1',
      });
      expect(Clarity.sendCustomEvent).toHaveBeenCalledWith('custom_event_name_');
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });

    it('sets Clarity tag if screen_name is provided', async () => {
      await analyticsService.logEvent('test_event', {
        screen_name: 'HomeScreen',
      });
      expect(Clarity.setCustomTag).toHaveBeenCalledWith('last_event_screen', 'HomeScreen');
    });

    it('handles errors gracefully', async () => {
      (logEvent as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
      await analyticsService.logEvent('test_event');
      // Should not throw
    });
  });

  describe('logScreenView', () => {
    it('logs screen view event', async () => {
      await analyticsService.logScreenView('HomeScreen', 'HomeClass');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SCREEN_VIEW, {
        screen_name: 'HomeScreen',
        screen_class: 'HomeClass',
      });
      expect(Clarity.setCustomTag).toHaveBeenCalledWith('screen_view', 'HomeScreen');
    });

    it('defaults screen_class to screenName', async () => {
      await analyticsService.logScreenView('SettingsScreen');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SCREEN_VIEW, {
        screen_name: 'SettingsScreen',
        screen_class: 'SettingsScreen',
      });
    });
  });

  describe('Helper methods', () => {
    it('logs search', async () => {
      await analyticsService.logSearch('query');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SEARCH, {
        search_term: 'query',
      });
    });

    it('logs select content', async () => {
      await analyticsService.logSelectContent('stock', 'AAPL');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SELECT_CONTENT, {
        content_type: 'stock',
        item_id: 'AAPL',
      });
    });

    it('logs share', async () => {
      await analyticsService.logShare('article', '123', 'whatsapp');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SHARE, {
        content_type: 'article',
        item_id: '123',
        method: 'whatsapp',
      });
    });

    it('logs login', async () => {
      await analyticsService.logLogin('google');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.LOGIN, {
        method: 'google',
      });
    });

    it('logs signUp', async () => {
      await analyticsService.logSignUp('email');
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.SIGN_UP, {
        method: 'email',
      });
    });

    it('logs interaction', async () => {
      await analyticsService.logInteraction('button_click', {
        button_id: 'save',
      });
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'button_click', {
        button_id: 'save',
      });
    });

    it('logs feature usage', async () => {
      await analyticsService.logFeatureUsage('calculator', {
        mode: 'advanced',
      });
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.FEATURE_USED, {
        feature_name: 'calculator',
        mode: 'advanced',
      });
    });

    it('logs error', async () => {
      await analyticsService.logError('network', { code: 500 });
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        `${ANALYTICS_EVENTS.ERROR}_network`,
        { code: 500 },
      );
    });

    it('logs api call', async () => {
      await analyticsService.logApiCall('/users', 'GET', true, 100);
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.API_CALL, {
        endpoint: '/users',
        method: 'GET',
        success: 'true',
        duration_ms: 100,
      });
    });

    it('logs data refresh', async () => {
      await analyticsService.logDataRefresh('stocks', false);
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.DATA_REFRESH, {
        data_type: 'stocks',
        success: 'false',
      });
    });

    it('tracks operation timing', async () => {
      const endTiming = analyticsService.startTiming('heavy_op');
      // No way to mock Date.now easily here without overhead, but we can check if logEvent is called
      endTiming();
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'operation_timing',
        expect.objectContaining({ operation: 'heavy_op' }),
      );
    });

    it('logs session start/end', async () => {
      await analyticsService.logSessionStart();
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        ANALYTICS_EVENTS.V_SESSION_START,
        undefined,
      );

      await analyticsService.logSessionEnd(120000);
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.V_SESSION_END, {
        duration_ms: 120000,
        duration_minutes: 2,
      });
    });

    it('logs engagement', async () => {
      await analyticsService.logEngagement('article', 5000);
      expect(logEvent).toHaveBeenCalledWith(expect.anything(), ANALYTICS_EVENTS.USER_ENGAGEMENT, {
        content_type: 'article',
        engagement_time_ms: 5000,
      });
    });
  });

  describe('User identification', () => {
    it('sets user property', async () => {
      await analyticsService.setUserProperty('Custom Property', 'value');
      expect(setUserProperty).toHaveBeenCalledWith(expect.anything(), 'custom_property', 'value');
      expect(Clarity.setCustomTag).toHaveBeenCalledWith('custom_property', 'value');
    });

    it('sets multiple user properties', async () => {
      await analyticsService.setUserProperties({ prop1: 'v1', prop2: 'v2' });
      expect(setUserProperty).toHaveBeenCalledTimes(2);
    });

    it('sets user ID', async () => {
      await analyticsService.setUserId('user123');
      expect(setUserId).toHaveBeenCalledWith(expect.anything(), 'user123');
      expect(Clarity.setCustomUserId).toHaveBeenCalledWith('user123');
    });

    it('handles null user ID', async () => {
      await analyticsService.setUserId(null);
      expect(setUserId).toHaveBeenCalledWith(expect.anything(), null);
      expect(Clarity.setCustomUserId).not.toHaveBeenCalled();
    });
  });

  describe('Settings', () => {
    it('enables/disables analytics collection', async () => {
      const mockSetEnabled = jest.fn();
      (getAnalytics as jest.Mock).mockReturnValue({
        setAnalyticsCollectionEnabled: mockSetEnabled,
      });

      await analyticsService.setAnalyticsCollectionEnabled(true);
      expect(mockSetEnabled).toHaveBeenCalledWith(true);
      expect(Clarity.resume).toHaveBeenCalled();

      await analyticsService.setAnalyticsCollectionEnabled(false);
      expect(mockSetEnabled).toHaveBeenCalledWith(false);
      expect(Clarity.pause).toHaveBeenCalled();
    });
  });
});
