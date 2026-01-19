import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  requestPermission,
  AuthorizationStatus,
  RemoteMessage,
  Messaging
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Appearance } from 'react-native';
import DeviceInfo from 'react-native-device-info';

class FCMService {
  private messaging: Messaging;

  constructor() {
    this.messaging = getMessaging();
  }

  /**
   * Request permission for notifications (iOS & Android 13+)
   */
  async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(this.messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      return enabled;
    } else if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  /**
   * Get the FCM token for the device
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(this.messaging);
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Refresh FCM token listener
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    return onTokenRefresh(this.messaging, callback);
  }

  /**
   * Foreground message handler
   */
  onMessage(callback: (remoteMessage: RemoteMessage) => void): () => void {
    return onMessage(this.messaging, callback);
  }

  /**
   * Background message handler (must be called outside of UI components)
   */
  setBackgroundMessageHandler(handler: (remoteMessage: RemoteMessage) => Promise<any>): void {
    setBackgroundMessageHandler(this.messaging, handler);
  }

  /**
   * Notification opened from background state
   */
  onNotificationOpenedApp(callback: (remoteMessage: RemoteMessage) => void): () => void {
    return onNotificationOpenedApp(this.messaging, callback);
  }

  /**
   * Check if app was opened from a notification (Quit state)
   */
  async getInitialNotification(): Promise<RemoteMessage | null> {
    return getInitialNotification(this.messaging);
  }
  
  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
      try {
          await subscribeToTopic(this.messaging, topic);
          console.log(`Subscribed to topic: ${topic}`);
      } catch (error) {
          console.error(`Error subscribing to topic ${topic}:`, error);
      }
  }

  /**
   * Subscribe to demographic topics for targeted notifications
   * Captures: Build, OS, Theme, OS Version, App Version, Install Cohort
   */
  async subscribeToDemographics(): Promise<void> {
    try {
      const buildNumber = DeviceInfo.getBuildNumber();
      const appVersion = DeviceInfo.getVersion();
      const systemVersion = DeviceInfo.getSystemVersion();
      const colorScheme = Appearance.getColorScheme() || 'light';
      const date = new Date();
      // Cohort: Year_Month (e.g. cohort_2024_05)
      const cohort = `cohort_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Sanitize function to ensure valid FCM topic format
      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9-_.~%]/g, '_').toLowerCase();

      const topics = [
        `build_${sanitize(buildNumber)}`,
        `os_${sanitize(Platform.OS)}`,
        `theme_${sanitize(colorScheme)}`,
        `os_ver_${sanitize(systemVersion)}`,
        `app_ver_${sanitize(appVersion)}`,
        sanitize(cohort)
      ];

      console.log('Subscribing to demographic topics:', topics);

      // Subscribe in parallel
      await Promise.all(topics.map(topic => this.subscribeToTopic(topic)));
    } catch (error) {
      console.error('Error subscribing to demographics:', error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
      try {
          await unsubscribeFromTopic(this.messaging, topic);
          console.log(`Unsubscribed from topic: ${topic}`);
      } catch (error) {
          console.error(`Error unsubscribing from topic ${topic}:`, error);
      }
  }
}

export const fcmService = new FCMService();
