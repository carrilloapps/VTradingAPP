import { getRemoteConfig, setDefaults, fetchAndActivate, getValue } from '@react-native-firebase/remote-config';
import { observabilityService } from '../ObservabilityService';

class RemoteConfigService {
  private remoteConfig = getRemoteConfig();

  /**
   * Initialize Remote Config with default values
   */
  async initialize(): Promise<void> {
    try {
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
   * Get a boolean value
   */
  getBoolean(key: string): boolean {
    return getValue(this.remoteConfig, key).asBoolean();
  }
}

export const remoteConfigService = new RemoteConfigService();
