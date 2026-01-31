import { createMMKV, MMKV } from 'react-native-mmkv';
import { observabilityService } from './ObservabilityService';
import { InteractionManager } from 'react-native';
import { KeyService } from './KeyService';

// Lazy initialized MMKV instance
let _storage: MMKV | undefined;

/**
 * Initializes the storage service.
 * Should be called at app startup (e.g. in App.tsx).
 */
export const initializeStorage = async (): Promise<void> => {
  if (_storage) return;

  const encryptionKey = await KeyService.getEncryptionKey();
  
  try {
    _storage = createMMKV({
      id: 'vtrading-storage',
      encryptionKey: encryptionKey
    });
  } catch (e) {
    // If initialization fails (e.g. wrong key due to migration/reinstall),
    // we might need to fallback to non-encrypted or recreate.
    // WARNING: This deletes data if key is lost.
    observabilityService.captureError(e, { context: 'StorageService.initialize', action: 'createMMKV_failed' });
    console.error('Failed to create MMKV with encryption, falling back to clear storage', e);
    
    // Fallback: Try creating without encryption (if key was removed) or re-create
    _storage = createMMKV({
        id: 'vtrading-storage',
        // No key
    });
  }
};

export const getStorage = (): MMKV => {
  if (!_storage) {
    // Fallback for sync calls before async init finishes (mainly DEV/Tests)
    // In PROD, initializeStorage should be awaited in App.tsx
    _storage = createMMKV({
      id: 'vtrading-storage',
      // No encryption for sync fallback to avoid blocking
    });
  }
  return _storage;
};

// Export for backward compatibility (though direct usage should be avoided)
export const storage = getStorage();

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
  // Cache removed in favor of direct MMKV access
  // private cache: Map<string, any> = new Map();

  // Helper methods for MMKV JSON operations
  private getJSON<T>(key: string, defaultValue: T): T {
    // Removed duplicate memory cache (Map) to reduce memory usage. 
    // MMKV is already memory-mapped and very fast.
    try {
      const data = getStorage().getString(key);
      if (!data) return defaultValue;
      
      const parsed = JSON.parse(data);
      // Check for schema version if needed in future
      return parsed as T;
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
    // Use InteractionManager to defer heavy serialization/writes
    InteractionManager.runAfterInteractions(() => {
        try {
            getStorage().set(key, JSON.stringify(value));
        } catch (e) {
            observabilityService.captureError(e, {
                context: 'StorageService.setJSON',
                action: 'write_storage',
                key: key
            });
        }
    });
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
      const data = getStorage().getString(KEYS.WIDGET_CONFIG);
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
    return getStorage().getBoolean(KEYS.HAS_SEEN_ONBOARDING) || false;
  }

  setHasSeenOnboarding(value: boolean): void {
    getStorage().set(KEYS.HAS_SEEN_ONBOARDING, value);
  }

  // Utility methods
  clearAll(): void {
    try {
      getStorage().clearAll();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StorageService.clearAll',
        action: 'clear_all_storage'
      });
    }
  }

  getAllKeys(): string[] {
    return getStorage().getAllKeys();
  }

  delete(key: string): void {
    getStorage().remove(key);
  }
}

export const storageService = new StorageService();
// Deprecated export
export { storage as mmkvStorage };
