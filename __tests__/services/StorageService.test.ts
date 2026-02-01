type MockStorage = {
  getString: jest.Mock;
  set: jest.Mock;
  getBoolean: jest.Mock;
  clearAll: jest.Mock;
  getAllKeys: jest.Mock;
  remove: jest.Mock;
};

type StorageModule = {
  initializeStorage: () => Promise<void>;
  getStorage: () => MockStorage;
  storageService: {
    getSettings: () => { pushEnabled: boolean; newsSubscription?: boolean };
    saveSettings: (settings: Partial<{ pushEnabled: boolean; newsSubscription?: boolean }>) => void;
    getAlerts: () => Array<{ id: string }>;
    saveAlerts: (alerts: Array<{ id: string }>) => void;
    getNotifications: () => Array<{ id: string }>;
    saveNotifications: (notifications: Array<{ id: string }>) => void;
    getWidgetConfig: () => WidgetConfig | null;
    saveWidgetConfig: (config: WidgetConfig) => void;
    getWidgetRefreshMeta: () => { lastRefreshAt: number } | null;
    saveWidgetRefreshMeta: (meta: { lastRefreshAt: number }) => void;
    getHasSeenOnboarding: () => boolean;
    setHasSeenOnboarding: (value: boolean) => void;
    clearAll: () => void;
    getAllKeys: () => string[];
    delete: (key: string) => void;
  };
};

type WidgetConfig = {
  title: string;
  selectedCurrencyIds: string[];
  isWallpaperDark: boolean;
  isTransparent: boolean;
  showGraph: boolean;
  isWidgetDarkMode: boolean;
  refreshInterval: '4' | '2' | '1';
};

type ModuleMocks = {
  createMMKV: jest.Mock;
  storage: MockStorage;
  getEncryptionKey: jest.Mock;
  captureError: jest.Mock;
  safeLoggerError: jest.Mock;
  runAfterInteractions: jest.Mock;
};

const buildModule = () => {
  jest.resetModules();

  const storage: MockStorage = {
    getString: jest.fn(),
    set: jest.fn(),
    getBoolean: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(),
    remove: jest.fn(),
  };

  const createMMKV = jest.fn();
  createMMKV.mockImplementationOnce(() => undefined);

  createMMKV.mockImplementation(() => storage);

  const getEncryptionKey = jest.fn().mockResolvedValue('secret');
  const captureError = jest.fn();
  const safeLoggerError = jest.fn();
  const runAfterInteractions = jest.fn(callback => callback());

  jest.doMock('react-native-mmkv', () => ({
    createMMKV,
    MMKV: jest.fn(),
  }));

  jest.doMock('@/services/KeyService', () => ({
    KeyService: { getEncryptionKey },
  }));

  jest.doMock('@/services/ObservabilityService', () => ({
    observabilityService: { captureError },
  }));

  jest.doMock('@/utils/safeLogger', () => ({
    __esModule: true,
    default: { error: safeLoggerError },
  }));

  jest.doMock('react-native', () => ({
    InteractionManager: { runAfterInteractions },
  }));

  let module!: StorageModule;
  jest.isolateModules(() => {
    module = require('../../src/services/StorageService');
  });

  return {
    module: module as StorageModule,
    mocks: {
      createMMKV,
      storage,
      getEncryptionKey,
      captureError,
      safeLoggerError,
      runAfterInteractions,
    } as ModuleMocks,
  };
};

describe('StorageService', () => {
  it('initializes storage with encryption', async () => {
    const { module, mocks } = buildModule();

    await module.initializeStorage();

    expect(mocks.getEncryptionKey).toHaveBeenCalled();
    expect(mocks.createMMKV).toHaveBeenCalledWith({
      id: 'vtrading-storage',
      encryptionKey: 'secret',
    });
  });

  it('skips initialization when already initialized', async () => {
    const { module, mocks } = buildModule();

    await module.initializeStorage();
    mocks.getEncryptionKey.mockClear();

    await module.initializeStorage();

    expect(mocks.getEncryptionKey).not.toHaveBeenCalled();
  });

  it('falls back to clear storage when encrypted init fails', async () => {
    const fail = () => {
      throw new Error('fail');
    };
    const { module, mocks } = buildModule();

    mocks.createMMKV.mockImplementationOnce(fail);

    await module.initializeStorage();

    expect(mocks.captureError).toHaveBeenCalled();
    expect(mocks.safeLoggerError).toHaveBeenCalled();
    expect(mocks.createMMKV).toHaveBeenCalledWith({ id: 'vtrading-storage' });
  });

  it('returns storage even when accessed before init', () => {
    const { module, mocks } = buildModule();

    const storage = module.getStorage();

    expect(storage).toBe(mocks.storage);
    expect(mocks.createMMKV).toHaveBeenCalledWith({ id: 'vtrading-storage' });
  });

  it('reads settings and merges on save', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockReturnValue(JSON.stringify({ pushEnabled: false }));

    expect(module.storageService.getSettings()).toEqual({ pushEnabled: false });

    module.storageService.saveSettings({ newsSubscription: true });

    expect(mocks.runAfterInteractions).toHaveBeenCalled();
    expect(mocks.storage.set).toHaveBeenCalledWith(
      'app_settings',
      JSON.stringify({ pushEnabled: false, newsSubscription: true }),
    );
  });

  it('returns defaults when storage read fails', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockImplementation(() => {
      throw new Error('read fail');
    });

    expect(module.storageService.getAlerts()).toEqual([]);
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StorageService.getJSON' }),
    );
  });

  it('returns defaults when storage is empty', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockReturnValueOnce(null);

    expect(module.storageService.getAlerts()).toEqual([]);
  });

  it('stores alerts and notifications', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockReturnValueOnce(JSON.stringify([{ id: 'notif-0' }]));
    expect(module.storageService.getNotifications()).toEqual([{ id: 'notif-0' }]);

    module.storageService.saveAlerts([{ id: 'alert-1' }]);
    module.storageService.saveNotifications([{ id: 'notif-1' }]);

    expect(mocks.storage.set).toHaveBeenCalledWith(
      'user_alerts',
      JSON.stringify([{ id: 'alert-1' }]),
    );
    expect(mocks.storage.set).toHaveBeenCalledWith(
      'user_notifications',
      JSON.stringify([{ id: 'notif-1' }]),
    );
  });

  it('captures errors when write fails', () => {
    const { module, mocks } = buildModule();

    mocks.storage.set.mockImplementation(() => {
      throw new Error('write fail');
    });

    module.storageService.saveAlerts([{ id: 'alert-2' }]);

    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StorageService.setJSON' }),
    );
  });

  it('handles widget config parsing and defaults', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockReturnValueOnce(JSON.stringify({ isWidgetDarkMode: true }));

    expect(module.storageService.getWidgetConfig()).toEqual({
      isWidgetDarkMode: true,
      refreshInterval: '4',
    });

    mocks.storage.getString.mockReturnValueOnce(null);
    expect(module.storageService.getWidgetConfig()).toBeNull();

    mocks.storage.getString.mockReturnValueOnce('{bad');
    expect(module.storageService.getWidgetConfig()).toBeNull();
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StorageService.getWidgetConfig' }),
    );

    module.storageService.saveWidgetConfig({
      refreshInterval: '2',
      isWidgetDarkMode: true,
      showGraph: true,
      selectedCurrencyIds: [],
      title: 'Widget',
      isTransparent: false,
      isWallpaperDark: false,
    });
    expect(mocks.storage.set).toHaveBeenCalledWith('widget_config', expect.any(String));
  });

  it('reads and writes widget refresh metadata', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getString.mockReturnValueOnce(JSON.stringify({ lastRefreshAt: 123 }));
    expect(module.storageService.getWidgetRefreshMeta()).toEqual({ lastRefreshAt: 123 });

    module.storageService.saveWidgetRefreshMeta({ lastRefreshAt: 999 });
    expect(mocks.storage.set).toHaveBeenCalledWith(
      'widget_refresh_meta',
      JSON.stringify({ lastRefreshAt: 999 }),
    );
  });

  it('handles onboarding flags', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getBoolean.mockReturnValueOnce(true);
    expect(module.storageService.getHasSeenOnboarding()).toBe(true);

    mocks.storage.getBoolean.mockReturnValueOnce(undefined);
    expect(module.storageService.getHasSeenOnboarding()).toBe(false);

    module.storageService.setHasSeenOnboarding(false);
    expect(mocks.storage.set).toHaveBeenCalledWith('has_seen_onboarding', false);
  });

  it('clears storage and handles failures', () => {
    const { module, mocks } = buildModule();

    module.storageService.clearAll();
    expect(mocks.storage.clearAll).toHaveBeenCalled();

    mocks.storage.clearAll.mockImplementationOnce(() => {
      throw new Error('clear fail');
    });

    module.storageService.clearAll();
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StorageService.clearAll' }),
    );
  });

  it('returns keys and deletes values', () => {
    const { module, mocks } = buildModule();

    mocks.storage.getAllKeys.mockReturnValueOnce(['a', 'b']);
    expect(module.storageService.getAllKeys()).toEqual(['a', 'b']);

    module.storageService.delete('a');
    expect(mocks.storage.remove).toHaveBeenCalledWith('a');
  });
});
