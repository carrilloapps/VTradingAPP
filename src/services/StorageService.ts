import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SETTINGS: 'app_settings',
  ALERTS: 'user_alerts',
};

export interface AppSettings {
  pushEnabled: boolean;
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
        return [
          { id: '1', symbol: 'USD/VES', target: '40.50', condition: 'above', isActive: true, iconName: 'currency-exchange' },
          { id: '2', symbol: 'CANTV', target: '3.20', condition: 'below', isActive: false, iconName: 'show-chart' },
        ];
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
}

export const storageService = new StorageService();
