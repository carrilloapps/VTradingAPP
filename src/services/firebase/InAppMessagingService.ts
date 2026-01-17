import inAppMessaging from '@react-native-firebase/in-app-messaging';

class InAppMessagingService {
  /**
   * Initialize and configure In-App Messaging
   */
  async initialize(): Promise<void> {
    // In-App Messaging is enabled by default, but we can explicitly enable it
    await inAppMessaging().setMessagesDisplaySuppressed(false);
  }

  /**
   * Suppress message display (e.g., during sensitive flows)
   */
  async setMessagesDisplaySuppressed(enabled: boolean): Promise<void> {
    await inAppMessaging().setMessagesDisplaySuppressed(enabled);
  }

  /**
   * Trigger an event manually (if configured in Firebase Console)
   */
  triggerEvent(eventId: string): void {
      inAppMessaging().triggerEvent(eventId);
  }
}

export const inAppMessagingService = new InAppMessagingService();
