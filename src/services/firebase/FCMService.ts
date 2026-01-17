import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

class FCMService {
  /**
   * Request permission for notifications (iOS & Android 13+)
   */
  async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
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
      const token = await messaging().getToken();
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
    return messaging().onTokenRefresh(callback);
  }

  /**
   * Foreground message handler
   */
  onMessage(callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onMessage(callback);
  }

  /**
   * Background message handler (must be called outside of UI components)
   */
  setBackgroundMessageHandler(handler: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => Promise<any>): void {
    messaging().setBackgroundMessageHandler(handler);
  }

  /**
   * Notification opened from background state
   */
  onNotificationOpenedApp(callback: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onNotificationOpenedApp(callback);
  }

  /**
   * Check if app was opened from a notification (Quit state)
   */
  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    return messaging().getInitialNotification();
  }
  
  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
      try {
          await messaging().subscribeToTopic(topic);
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
          await messaging().unsubscribeFromTopic(topic);
          console.log(`Unsubscribed from topic: ${topic}`);
      } catch (error) {
          console.error(`Error unsubscribing from topic ${topic}:`, error);
      }
  }
}

export const fcmService = new FCMService();
