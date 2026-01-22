import { fcmService } from '../../src/services/firebase/FCMService';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic } from '@react-native-firebase/messaging';

describe('FCMService', () => {
  it('requests permission', async () => {
    const granted = await fcmService.requestUserPermission();
    expect(granted).toBe(true);
  });

  it('gets FCM token', async () => {
    const token = await fcmService.getFCMToken();
    expect(token).toBe('mock-token');
  });

  it('subscribes to topic', async () => {
    await fcmService.subscribeToTopic('news');
    expect(subscribeToTopic).toHaveBeenCalledWith(getMessaging(), 'news');
  });

  it('unsubscribes from topic', async () => {
    await fcmService.unsubscribeFromTopic('news');
    expect(unsubscribeFromTopic).toHaveBeenCalledWith(getMessaging(), 'news');
  });
});
