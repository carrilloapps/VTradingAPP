const mockMessaging = { id: 'inapp' };

jest.mock('@react-native-firebase/in-app-messaging', () => ({
  getInAppMessaging: jest.fn(() => mockMessaging),
  setMessagesDisplaySuppressed: jest.fn(),
  triggerEvent: jest.fn(),
}));

describe('InAppMessagingService', () => {
  let inAppMessagingService: {
    initialize: () => Promise<void>;
    setMessagesDisplaySuppressed: (enabled: boolean) => Promise<void>;
    triggerEvent: (eventId: string) => void;
  };

  const inAppMessagingModule = jest.requireMock('@react-native-firebase/in-app-messaging') as {
    getInAppMessaging: jest.Mock;
    setMessagesDisplaySuppressed: jest.Mock;
    triggerEvent: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      ({ inAppMessagingService } = require('../../../src/services/firebase/InAppMessagingService'));
    });
  });

  it('initializes by enabling message display', async () => {
    await inAppMessagingService.initialize();

    expect(inAppMessagingModule.setMessagesDisplaySuppressed).toHaveBeenCalledWith(
      expect.any(Object),
      false,
    );
  });

  it('updates message suppression flag', async () => {
    await inAppMessagingService.setMessagesDisplaySuppressed(true);

    expect(inAppMessagingModule.setMessagesDisplaySuppressed).toHaveBeenCalledWith(
      expect.any(Object),
      true,
    );
  });

  it('triggers events', () => {
    inAppMessagingService.triggerEvent('welcome');

    expect(inAppMessagingModule.triggerEvent).toHaveBeenCalledWith(expect.any(Object), 'welcome');
  });
});
