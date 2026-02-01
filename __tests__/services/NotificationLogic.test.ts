import notifee from '@notifee/react-native';
import { handleBackgroundMessage } from '../../src/services/NotificationLogic';

jest.mock('@notifee/react-native', () => ({
  displayNotification: jest.fn(),
}));

jest.mock('@/services/StorageService', () => ({
  storageService: {
    getAlerts: jest.fn(),
    getNotifications: jest.fn(),
    saveNotifications: jest.fn(),
  },
}));

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('react-native-android-widget', () => ({
  requestWidgetUpdate: jest.fn(),
}));

jest.mock('../../src/widget/widgetTaskHandler', () => ({
  buildWidgetElement: jest.fn(),
}));

const { storageService } = jest.requireMock('@/services/StorageService') as {
  storageService: {
    getAlerts: jest.Mock;
    getNotifications: jest.Mock;
    saveNotifications: jest.Mock;
  };
};

const { observabilityService } = jest.requireMock('@/services/ObservabilityService') as {
  observabilityService: { captureError: jest.Mock };
};

const { requestWidgetUpdate } = jest.requireMock('react-native-android-widget') as {
  requestWidgetUpdate: jest.Mock;
};

describe('NotificationLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storageService.getAlerts.mockResolvedValue([]);
    storageService.getNotifications.mockResolvedValue([]);
    storageService.saveNotifications.mockResolvedValue(true);
  });

  it('returns early when there is no data payload', async () => {
    await handleBackgroundMessage({});

    expect(notifee.displayNotification).not.toHaveBeenCalled();
    expect(storageService.getAlerts).not.toHaveBeenCalled();
  });

  it('ignores invalid price values', async () => {
    await handleBackgroundMessage({ data: { symbol: 'AAPL', price: 'abc' } });

    expect(storageService.getAlerts).not.toHaveBeenCalled();
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('handles price alerts and persists notifications', async () => {
    storageService.getAlerts.mockResolvedValue([
      { symbol: 'AAPL', target: '10', condition: 'above', isActive: true },
    ]);

    await handleBackgroundMessage({
      data: { symbol: 'AAPL', price: '12' },
    });

    expect(requestWidgetUpdate).toHaveBeenCalled();
    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        android: expect.objectContaining({ channelId: 'price_alerts' }),
      }),
    );
    expect(storageService.saveNotifications).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'price_alert',
          data: { symbol: 'AAPL', price: 12 },
        }),
      ]),
    );
  });

  it('skips alerts when conditions are not met', async () => {
    storageService.getAlerts.mockResolvedValue([
      { symbol: 'AAPL', target: '10', condition: 'above', isActive: true },
    ]);

    await handleBackgroundMessage({
      data: { symbol: 'AAPL', price: '9' },
    });

    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('retries persistence for price alerts', async () => {
    storageService.getAlerts.mockResolvedValue([
      { symbol: 'AAPL', target: '10', condition: 'below', isActive: true },
    ]);

    storageService.saveNotifications
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(true);

    await handleBackgroundMessage({
      data: { symbol: 'AAPL', price: '8' },
    });

    expect(storageService.saveNotifications).toHaveBeenCalledTimes(2);
    expect(observabilityService.captureError).not.toHaveBeenCalled();
  });

  it('logs when persistence fails twice for price alerts', async () => {
    const error = new Error('persist failed');
    storageService.getAlerts.mockResolvedValue([
      { symbol: 'AAPL', target: '10', condition: 'above', isActive: true },
    ]);

    storageService.saveNotifications.mockRejectedValue(error);

    await handleBackgroundMessage({
      data: { symbol: 'AAPL', price: '12' },
    });

    expect(observabilityService.captureError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ context: 'NotificationLogic.handlePriceAlert' }),
    );
  });

  it('formats tiny prices without rounding', async () => {
    storageService.getAlerts.mockResolvedValue([
      { symbol: 'AAPL', target: '0.009', condition: 'below', isActive: true },
    ]);

    await handleBackgroundMessage({
      data: { symbol: 'AAPL', price: '0.008' },
    });

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('0.008'),
        body: expect.stringContaining('0.009'),
      }),
    );
  });

  it('handles general notifications and persists them', async () => {
    await handleBackgroundMessage({
      data: { title: 'Hello', body: 'World', type: 'system' },
    });

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello',
        body: 'World',
        android: expect.objectContaining({ channelId: 'general' }),
      }),
    );

    expect(storageService.saveNotifications).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'system',
          title: 'Hello',
          message: 'World',
        }),
      ]),
    );
  });

  it('defaults general notification type to system when missing', async () => {
    await handleBackgroundMessage({
      data: { title: 'Hello', body: 'World' },
    });

    expect(storageService.saveNotifications).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'system',
          title: 'Hello',
          message: 'World',
        }),
      ]),
    );
  });

  it('logs when persistence fails twice for general notifications', async () => {
    const error = new Error('persist failed');
    storageService.saveNotifications.mockRejectedValue(error);

    await handleBackgroundMessage({
      data: { title: 'Hello', body: 'World' },
    });

    expect(observabilityService.captureError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ context: 'NotificationLogic.handleGeneralNotification' }),
    );
  });
});
