import {
  getInAppMessaging,
  setMessagesDisplaySuppressed,
  triggerEvent,
} from '@react-native-firebase/in-app-messaging';

class InAppMessagingService {
  private inAppMessaging = getInAppMessaging();

  /**
   * Initialize and configure In-App Messaging
   */
  async initialize(): Promise<void> {
    // In-App Messaging is enabled by default, but we can explicitly enable it
    await setMessagesDisplaySuppressed(this.inAppMessaging, false);
  }

  /**
   * Suppress message display (e.g., during sensitive flows)
   */
  async setMessagesDisplaySuppressed(enabled: boolean): Promise<void> {
    await setMessagesDisplaySuppressed(this.inAppMessaging, enabled);
  }

  /**
   * Trigger an event manually (if configured in Firebase Console)
   */
  triggerEvent(eventId: string): void {
    triggerEvent(this.inAppMessaging, eventId);
  }
}

export const inAppMessagingService = new InAppMessagingService();
