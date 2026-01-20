import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SETTINGS: 'app_settings',
  ALERTS: 'user_alerts',
  NOTIFICATIONS: 'user_notifications',
  WIDGET_CONFIG: 'widget_config',
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
}

export interface AppSettings {
  pushEnabled: boolean;
  newsSubscription?: boolean;
}

export interface UserAlert {
  id: string;
  symbol: string;
  target: string;
  condition: 'above' | 'below'; // 'Sube' | 'Baja' mapped
  isActive: boolean;
  iconName?: string;
}

class StorageService {
  
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : { pushEnabled: true };
    } catch (e) {
      console.error('Failed to load settings', e);
      return { pushEnabled: true };
    }
  }

  async saveSettings(settings: Partial<AppSettings>) {
    try {
      const current = await this.getSettings();
      const newSettings = { ...current, ...settings };
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  async getAlerts(): Promise<UserAlert[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ALERTS);
      // Return default mocks if empty for demo purposes, or empty array
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load alerts', e);
      return [];
    }
  }

  async saveAlerts(alerts: UserAlert[]) {
    try {
      await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Failed to save alerts', e);
    }
  }

  async getNotifications(): Promise<StoredNotification[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load notifications', e);
      return [];
    }
  }

  async saveNotifications(notifications: StoredNotification[]) {
    try {
      await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  async getWidgetConfig(): Promise<WidgetConfig | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.WIDGET_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load widget config', e);
      return null;
    }
  }

  async saveWidgetConfig(config: WidgetConfig) {
    try {
      await AsyncStorage.setItem(KEYS.WIDGET_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save widget config', e);
    }
  }
}

export const storageService = new StorageService();
