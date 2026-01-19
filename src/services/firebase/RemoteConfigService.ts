import { getRemoteConfig, setDefaults, setConfigSettings, fetchAndActivate, getValue } from '@react-native-firebase/remote-config';

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
      console.log('[RemoteConfig] Initialized');
    } catch (error) {
      console.error('[RemoteConfig] Initialization error:', error);
    }
  }

  /**
   * Fetch and activate latest values
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      // In development, fetch frequently (0 seconds cache)
      // In production, use default (usually 12 hours)
      const cacheDuration = __DEV__ ? 0 : 3600; 
      await setConfigSettings(this.remoteConfig, {
        minimumFetchIntervalMillis: cacheDuration * 1000,
      });
      
      const activated = await fetchAndActivate(this.remoteConfig);
      if (activated) {
        console.log('[RemoteConfig] Fetched and activated new config');
      } else {
        console.log('[RemoteConfig] No new config found');
      }
      return activated;
    } catch (error) {
      console.error('[RemoteConfig] Error fetching config:', error);
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
