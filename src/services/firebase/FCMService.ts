import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import SafeLogger from '../../utils/safeLogger';
import { observabilityService } from '../ObservabilityService';

class FCMService {
  private messaging: ReturnType<typeof messaging>;

  constructor() {
    this.messaging = messaging();
  }

  /**
   * Check permission status without requesting
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await this.messaging.hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
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
      const authStatus = await this.messaging.requestPermission();
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
      const token = await this.messaging.getToken();
      SafeLogger.sensitive('FCM', token);
      return token;
    } catch (e) {
      observabilityService.captureError(e);
      return null;
    }
  }

  /**
   * Refresh FCM token listener
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    return this.messaging.onTokenRefresh(callback);
  }

  /**
   * Foreground message handler
   */
  onMessage(callback: (remoteMessage: any) => void): () => void {
    return this.messaging.onMessage(callback);
  }

  /**
   * Background message handler (must be called outside of UI components)
   */
  setBackgroundMessageHandler(handler: (remoteMessage: any) => Promise<any>): void {
    this.messaging.setBackgroundMessageHandler(handler);
  }

  /**
   * Notification opened from background state
   */
  onNotificationOpenedApp(callback: (remoteMessage: any) => void): () => void {
    return this.messaging.onNotificationOpenedApp(callback);
  }

  /**
   * Check if app was opened from a notification (Quit state)
   */
  async getInitialNotification(): Promise<any | null> {
    return this.messaging.getInitialNotification();
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Ensure topic matches regex: [a-zA-Z0-9-_.~%]+
      const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, '_');
      await this.messaging.subscribeToTopic(sanitizedTopic);
    } catch (e) {
      observabilityService.captureError(e);
      // Ignore error
    }
  }

  /**
   * Subscribe to demographic topics for targeted notifications
   * Captures: Build, OS, Theme, OS Version, App Version, Install Cohort
   */
  async subscribeToDemographics(extraTopics: string[] = []): Promise<void> {
    try {
      const topics = [...extraTopics];

      // Technical Topics
      topics.push(`os_${Platform.OS}`);
      topics.push(`app_version_${DeviceInfo.getVersion().replace(/\./g, '_')}`);
      topics.push(`build_${DeviceInfo.getBuildNumber()}`);
      topics.push(`sys_version_${Platform.Version}`);

      // Get Device Type (tablet/phone)
      if (DeviceInfo.isTablet()) {
        topics.push('device_tablet');
      } else {
        topics.push('device_phone');
      }

      await Promise.all(topics.map(topic => this.subscribeToTopic(topic)));
      SafeLogger.log('[FCM] Subscribed to demographics', { topicsCount: topics.length });
    } catch (e) {
      observabilityService.captureError(e);
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
    } catch (e) {
      observabilityService.captureError(e);
      // Ignore error
    }
  }
}

export const fcmService = new FCMService();
