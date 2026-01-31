import { createMMKV } from 'react-native-mmkv';
import { observabilityService } from './ObservabilityService';

// Create singleton MMKV instance with encryption
export const storage = createMMKV({
  id: 'vtrading-storage',
  // TODO: In production, use a secure key from Keychain/SecureStore
  // encryptionKey: await SecureStore.getItemAsync('mmkv-encryption-key')
});

const KEYS = {
  SETTINGS: 'app_settings',
  ALERTS: 'user_alerts',
  NOTIFICATIONS: 'user_notifications',
  WIDGET_CONFIG: 'widget_config',
  WIDGET_REFRESH_META: 'widget_refresh_meta',
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
};

export interface StoredNotification {
  id: string;
  type: 'price_alert' | 'market_news' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived?: boolean;
  trend?: 'up' | 'down';
  highlightedValue?: string;
  data?: any;
}

export interface WidgetConfig {
  title: string;
  selectedCurrencyIds: string[];
  isWallpaperDark: boolean;
  isTransparent: boolean;
  showGraph: boolean;
  isWidgetDarkMode: boolean;
  refreshInterval: '4' | '2' | '1';
}

export interface WidgetRefreshMeta {
  lastRefreshAt: number;
}

export interface AppSettings {
  pushEnabled: boolean;
  newsSubscription?: boolean;
}

export interface UserAlert {
  id: string;
  symbol: string;
  target: string;
  condition: 'above' | 'below';
  isActive: boolean;
  iconName?: string;
}

class StorageService {

  private cache: Map<string, any> = new Map();

  // Helper methods for MMKV JSON operations
  private getJSON<T>(key: string, defaultValue: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    try {
      const data = storage.getString(key);
      const parsed = data ? JSON.parse(data) : defaultValue;
      this.cache.set(key, parsed);
      return parsed;
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StorageService.getJSON',
        action: 'read_storage',
        key: key
      });
      return defaultValue;
    }
  }

  private setJSON<T>(key: string, value: T): void {
    try {
      this.cache.set(key, value);
      storage.set(key, JSON.stringify(value));
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StorageService.setJSON',
        action: 'write_storage',
        key: key
      });
    }
  }

  // Settings
  getSettings(): AppSettings {
    return this.getJSON(KEYS.SETTINGS, { pushEnabled: true });
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const newSettings = { ...current, ...settings };
    this.setJSON(KEYS.SETTINGS, newSettings);
  }

  // Alerts
  getAlerts(): UserAlert[] {
    return this.getJSON(KEYS.ALERTS, []);
  }

  saveAlerts(alerts: UserAlert[]): void {
    this.setJSON(KEYS.ALERTS, alerts);
  }

  // Notifications
  getNotifications(): StoredNotification[] {
    return this.getJSON(KEYS.NOTIFICATIONS, []);
  }

  saveNotifications(notifications: StoredNotification[]): void {
    this.setJSON(KEYS.NOTIFICATIONS, notifications);
  }

  // Widget Config
  getWidgetConfig(): WidgetConfig | null {
    try {
      const data = storage.getString(KEYS.WIDGET_CONFIG);
      if (!data) return null;
      const parsed = JSON.parse(data) as WidgetConfig;
      return {
        ...parsed,
        refreshInterval: parsed.refreshInterval || '4',
      };
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StorageService.getWidgetConfig',
        action: 'read_widget_config'
      });
      return null;
    }
  }

  saveWidgetConfig(config: WidgetConfig): void {
    this.setJSON(KEYS.WIDGET_CONFIG, config);
  }

  // Widget Refresh Meta
  getWidgetRefreshMeta(): WidgetRefreshMeta | null {
    return this.getJSON(KEYS.WIDGET_REFRESH_META, null);
  }

  saveWidgetRefreshMeta(meta: WidgetRefreshMeta): void {
    this.setJSON(KEYS.WIDGET_REFRESH_META, meta);
  }

  // Onboarding
  getHasSeenOnboarding(): boolean {
    return storage.getBoolean(KEYS.HAS_SEEN_ONBOARDING) || false;
  }

  setHasSeenOnboarding(value: boolean): void {
    storage.set(KEYS.HAS_SEEN_ONBOARDING, value);
  }

  // Utility methods
  clearAll(): void {
    try {
      this.cache.clear();
      storage.clearAll();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StorageService.clearAll',
        action: 'clear_all_storage'
      });
    }
  }

  getAllKeys(): string[] {
    return storage.getAllKeys();
  }

  delete(key: string): void {
    this.cache.delete(key);
    storage.remove(key);
  }
}

export const storageService = new StorageService();
export { storage as mmkvStorage };
