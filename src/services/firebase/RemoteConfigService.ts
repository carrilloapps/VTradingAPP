import {
  getRemoteConfig,
  setDefaults,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';

import { observabilityService } from '@/services/ObservabilityService';
import {
  featureFlagService,
  RemoteConfigSchema,
} from '@/services/FeatureFlagService';
import { analyticsService } from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';

class RemoteConfigService {
  private remoteConfig = getRemoteConfig();

  /**
   * Initialize Remote Config with default values
   */
  async initialize(): Promise<void> {
    try {
      // Configure settings: 0 interval for dev (instant updates), 15 min for production
      await this.remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 3 * 300000,
      });

      await setDefaults(this.remoteConfig, {
        welcome_message: 'Bienvenido a VTrading',
        enable_new_feature: false,
        api_timeout: 5000,
        refresh_interval: 60,
      });

      // Fetch and activate
      await this.fetchAndActivate();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'RemoteConfigService.initialize',
        action: 'init_remote_config',
      });
      await analyticsService.logError('remote_config_init');
      // Initialization error
    }
  }

  /**
   * Fetch and activate latest values
   * Implements retry logic with exponential backoff for network errors
   */
  async fetchAndActivate(retryCount = 0): Promise<boolean> {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 10000; // 10 seconds

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Remote Config fetch timeout')),
          TIMEOUT_MS,
        ),
      );

      // Race between fetch and timeout
      const fetchPromise = fetchAndActivate(this.remoteConfig);
      const fetched = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as boolean;

      return fetched;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      const errorMessage = error.message.toLowerCase();

      // Check if it's a network/timeout error
      const isNetworkError =
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection');

      // Retry on network errors
      if (isNetworkError && retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        SafeLogger.warn(
          `[RemoteConfig] Fetch failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          errorMessage,
        );

        await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
        return this.fetchAndActivate(retryCount + 1);
      }

      // Only report to Sentry after all retries failed
      if (retryCount >= MAX_RETRIES || !isNetworkError) {
        observabilityService.captureError(error, {
          context: 'RemoteConfig_fetchAndActivate',
          retryCount,
          errorType: isNetworkError ? 'network' : 'server',
        });
      }

      SafeLogger.error('[RemoteConfig] Fetch failed after retries:', {
        errorMessage,
      });

      // Return false instead of throwing to prevent app crash
      // App will use default values
      return false;
    }
  }

  /**
   * Get a string value
   */
  getString(key: string): string {
    return getValue(this.remoteConfig, key).asString();
  }

  /**
   * Get a number value
   */
  getNumber(key: string): number {
    return getValue(this.remoteConfig, key).asNumber();
  }

  /**
   * Get a object value parsed from JSON string
   */
  getJson<T>(key: string): T | null {
    try {
      const value = getValue(this.remoteConfig, key).asString();
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'RemoteConfigService.getJson',
        key,
        action: 'parse_remote_config',
      });
      return null;
    }
  }

  /**
   * Get a boolean value
   */
  getBoolean(key: string): boolean {
    return getValue(this.remoteConfig, key).asBoolean();
  }

  /**
   * Evaluate a feature flag using advanced segmentation rules
   */
  async getFeature(featureName: string): Promise<boolean> {
    try {
      const configJson = this.getJson<RemoteConfigSchema>('feature_flags');
      return await featureFlagService.evaluate(featureName, configJson);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'RemoteConfigService.getFeature',
        featureName,
        action: 'evaluate_feature_flag',
      });
      return false;
    }
  }
}

export const remoteConfigService = new RemoteConfigService();
