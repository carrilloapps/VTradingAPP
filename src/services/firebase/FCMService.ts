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
  hasPermission,
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
   * Check permission status without requesting
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await hasPermission(this.messaging);
      return (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      );
    } else if (Platform.OS === 'android' && Platform.Version >= 33) {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
    return true;
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
      // Ensure topic matches regex: [a-zA-Z0-9-_.~%]+
      const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, '_');
      await this.messaging.subscribeToTopic(sanitizedTopic);
    } catch (error) {
      // Ignore error
    }
  }

  /**
   * Subscribe to demographic topics for targeted notifications
   * Captures: Build, OS, Theme, OS Version, App Version, Install Cohort
   */
  async subscribeToDemographics(topics: string[]): Promise<void> {
    try {
      await Promise.all(topics.map(topic => this.subscribeToTopic(topic)));
    } catch (error) {
      // Ignore error
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, '_');
      await this.messaging.unsubscribeFromTopic(sanitizedTopic);
    } catch (error) {
      // Ignore error
    }
  }
}

export const fcmService = new FCMService();
