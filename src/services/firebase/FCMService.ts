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
import { PermissionsAndroid, Platform } from 'react-native';

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
