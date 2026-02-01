import { notificationInitService } from '../../src/services/NotificationInitService';
import { fcmService } from '../../src/services/firebase/FCMService';
import { storageService } from '../../src/services/StorageService';

jest.mock('../../src/services/firebase/FCMService');
jest.mock('../../src/services/StorageService');
jest.mock('../../src/services/ObservabilityService');
jest.mock('../../src/services/firebase/AnalyticsService');

describe('NotificationInitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationInitService as any).isInitialized = false;
    (storageService.getSettings as jest.Mock).mockResolvedValue({
      pushEnabled: true,
    });
  });

  it('should initialize notification system when permission is granted', async () => {
    (fcmService.checkPermission as jest.Mock).mockResolvedValue(true);
    (fcmService.getFCMToken as jest.Mock).mockResolvedValue('test-token');
    (fcmService.subscribeToDemographics as jest.Mock).mockResolvedValue(
      undefined,
    );
    (storageService.getAlerts as jest.Mock).mockResolvedValue([]);

    await notificationInitService.initialize();

    expect(fcmService.checkPermission).toHaveBeenCalled();
    expect(fcmService.getFCMToken).toHaveBeenCalled();
    expect(fcmService.subscribeToDemographics).toHaveBeenCalledWith([
      'all_users',
    ]);
  });

  it('should not initialize when permission is denied', async () => {
    (fcmService.checkPermission as jest.Mock).mockResolvedValue(false);

    await notificationInitService.initialize();

    expect(fcmService.checkPermission).toHaveBeenCalled();
    expect(fcmService.getFCMToken).not.toHaveBeenCalled();
  });

  it('should resubscribe to active alerts', async () => {
    (fcmService.checkPermission as jest.Mock).mockResolvedValue(true);
    (fcmService.getFCMToken as jest.Mock).mockResolvedValue('test-token');
    (fcmService.subscribeToDemographics as jest.Mock).mockResolvedValue(
      undefined,
    );
    (fcmService.subscribeToTopic as jest.Mock).mockResolvedValue(undefined);
    (storageService.getAlerts as jest.Mock).mockResolvedValue([
      {
        id: '1',
        symbol: 'USD/VES',
        target: '40',
        condition: 'above',
        isActive: true,
      },
      {
        id: '2',
        symbol: 'USD/VES',
        target: '35',
        condition: 'below',
        isActive: true,
      },
      {
        id: '3',
        symbol: 'EUR/VES',
        target: '45',
        condition: 'above',
        isActive: true,
      },
    ]);

    await notificationInitService.initialize();

    // Should subscribe to 2 unique topics: USD/VES and EUR/VES
    expect(fcmService.subscribeToTopic).toHaveBeenCalledWith('ticker_usd_ves');
    expect(fcmService.subscribeToTopic).toHaveBeenCalledWith('ticker_eur_ves');
    expect(fcmService.subscribeToTopic).toHaveBeenCalledTimes(2);
  });

  it('should request permission and initialize if granted', async () => {
    (fcmService.requestUserPermission as jest.Mock).mockResolvedValue(true);
    (fcmService.checkPermission as jest.Mock).mockResolvedValue(true);
    (fcmService.getFCMToken as jest.Mock).mockResolvedValue('test-token');
    (fcmService.subscribeToDemographics as jest.Mock).mockResolvedValue(
      undefined,
    );
    (storageService.getAlerts as jest.Mock).mockResolvedValue([]);

    const granted = await notificationInitService.requestPermission();

    expect(granted).toBe(true);
    expect(fcmService.requestUserPermission).toHaveBeenCalled();
    expect(fcmService.getFCMToken).toHaveBeenCalled();
  });

  it('should return correct status', async () => {
    (fcmService.checkPermission as jest.Mock).mockResolvedValue(true);
    (fcmService.getFCMToken as jest.Mock).mockResolvedValue('test-token');
    (storageService.getAlerts as jest.Mock).mockResolvedValue([
      {
        id: '1',
        symbol: 'USD/VES',
        target: '40',
        condition: 'above',
        isActive: true,
      },
      {
        id: '2',
        symbol: 'EUR/VES',
        target: '45',
        condition: 'below',
        isActive: false,
      },
    ]);

    const status = await notificationInitService.checkStatus();

    expect(status).toEqual({
      hasPermission: true,
      hasToken: true,
      isInitialized: expect.any(Boolean),
      activeAlertsCount: 1,
    });
  });
});
