import { getRemoteConfig, setDefaults, fetchAndActivate, getValue } from '@react-native-firebase/remote-config';
import { observabilityService } from '../ObservabilityService';
import { featureFlagService, RemoteConfigSchema } from '../FeatureFlagService';

class RemoteConfigService {
  private remoteConfig = getRemoteConfig();

  /**
   * Initialize Remote Config with default values
   */
  async initialize(): Promise<void> {
    try {
      // Configure settings: 0 interval for dev (instant updates), 30 min for production
      await this.remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 1800000,
      });

      await setDefaults(this.remoteConfig, {
        welcome_message: 'Bienvenido a VTradingAPP',
        enable_new_feature: false,
        api_timeout: 5000,
        refresh_interval: 60,
      });

      // Fetch and activate
      await this.fetchAndActivate();
    } catch (e) {
      observabilityService.captureError(e);
      // Initialization error
    }
  }

  /**
   * Fetch and activate latest values
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      const fetched = await fetchAndActivate(this.remoteConfig);
      return fetched;
    } catch (e) {
      observabilityService.captureError(e);
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
      observabilityService.captureError(e);
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
      const configJson = this.getJson<RemoteConfigSchema>('settings');
      return await featureFlagService.evaluate(featureName, configJson);
    } catch (e) {
      observabilityService.captureError(e);
      return false;
    }
  }
}

export const remoteConfigService = new RemoteConfigService();
