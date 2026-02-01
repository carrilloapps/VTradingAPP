export {};
declare const global: any;

type RemoteConfigMocks = {
  remoteConfig: { setConfigSettings: jest.Mock };
  getValue: jest.Mock;
  fetchAndActivate: jest.Mock;
  setDefaults: jest.Mock;
  observability: { captureError: jest.Mock };
  analytics: { logError: jest.Mock };
  featureFlags: { evaluate: jest.Mock };
  safeLogger: { warn: jest.Mock; error: jest.Mock };
};

const loadService = (options?: { triggerTimeout?: boolean }) => {
  jest.resetModules();

  const remoteConfig = { setConfigSettings: jest.fn() };
  const getValue = jest.fn();
  const fetchAndActivate = jest.fn();
  const setDefaults = jest.fn();
  const observability = { captureError: jest.fn() };
  const analytics = { logError: jest.fn() };
  const featureFlags = { evaluate: jest.fn() };
  const safeLogger = { warn: jest.fn(), error: jest.fn() };

  jest.doMock('@react-native-firebase/remote-config', () => ({
    getRemoteConfig: jest.fn(() => remoteConfig),
    setDefaults: (...args: unknown[]) => setDefaults(...args),
    fetchAndActivate: (...args: unknown[]) => fetchAndActivate(...args),
    getValue: (...args: unknown[]) => getValue(...args),
  }));

  jest.doMock('@/services/ObservabilityService', () => ({
    observabilityService: observability,
  }));

  jest.doMock('@/services/firebase/AnalyticsService', () => ({
    analyticsService: analytics,
  }));

  jest.doMock('@/services/FeatureFlagService', () => ({
    featureFlagService: featureFlags,
  }));

  jest.doMock('@/utils/safeLogger', () => ({
    __esModule: true,
    default: safeLogger,
  }));

  const timeoutSpy = jest
    .spyOn(globalThis, 'setTimeout')
    .mockImplementation((...args: unknown[]) => {
      const [callback, delay, ...rest] = args as [
        (...callbackArgs: unknown[]) => void,
        number | undefined,
        ...unknown[],
      ];

      if (delay && (options?.triggerTimeout || delay < 10000)) {
        callback(...rest);
      }

      return 0 as unknown as number;
    });

  let remoteConfigService!: {
    initialize: () => Promise<void>;
    fetchAndActivate: (retryCount?: number) => Promise<boolean>;
    getString: (key: string) => string;
    getNumber: (key: string) => number;
    getBoolean: (key: string) => boolean;
    getJson: <T>(key: string) => T | null;
    getFeature: (featureName: string) => Promise<boolean>;
  };

  jest.isolateModules(() => {
    ({ remoteConfigService } = require('../../../src/services/firebase/RemoteConfigService'));
  });

  return {
    service: remoteConfigService,
    mocks: {
      remoteConfig,
      getValue,
      fetchAndActivate,
      setDefaults,
      observability,
      analytics,
      featureFlags,
      safeLogger,
    } as RemoteConfigMocks,
    timeoutSpy,
  };
};

describe('RemoteConfigService', () => {
  it('initializes with dev config and defaults', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const { service, mocks, timeoutSpy } = loadService();
    jest.spyOn(service, 'fetchAndActivate').mockResolvedValue(true);

    await service.initialize();

    expect(mocks.remoteConfig.setConfigSettings).toHaveBeenCalledWith({
      minimumFetchIntervalMillis: 0,
    });
    expect(mocks.setDefaults).toHaveBeenCalled();
    expect(service.fetchAndActivate).toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it('reports initialization errors', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    const { service, mocks, timeoutSpy } = loadService();
    mocks.remoteConfig.setConfigSettings.mockRejectedValueOnce(new Error('fail'));

    await service.initialize();

    expect(mocks.observability.captureError).toHaveBeenCalled();
    expect(mocks.analytics.logError).toHaveBeenCalledWith('remote_config_init');
    timeoutSpy.mockRestore();
  });

  it('fetches and activates successfully', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate.mockResolvedValueOnce(true);

    const result = await service.fetchAndActivate();

    expect(result).toBe(true);
    expect(mocks.fetchAndActivate).toHaveBeenCalledWith(mocks.remoteConfig);
    timeoutSpy.mockRestore();
  });

  it('retries on network errors and returns true when recovered', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(true);

    const result = await service.fetchAndActivate();

    expect(result).toBe(true);
    expect(mocks.safeLogger.warn).toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it('captures non-network errors and returns false', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate.mockRejectedValueOnce(new Error('server error'));

    const result = await service.fetchAndActivate();

    expect(result).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'server' }),
    );
    expect(mocks.safeLogger.error).toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it('captures errors when retry count is already maxed', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate.mockRejectedValueOnce(new Error('server error'));

    const result = await service.fetchAndActivate(3);

    expect(result).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ retryCount: 3 }),
    );
    timeoutSpy.mockRestore();
  });

  it('wraps non-error rejections into Error instances', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate.mockRejectedValueOnce('boom');

    const result = await service.fetchAndActivate();

    expect(result).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'server' }),
    );
    timeoutSpy.mockRestore();
  });

  it('reports network errors after max retries', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.fetchAndActivate.mockRejectedValueOnce(new Error('timeout')); // network error

    const result = await service.fetchAndActivate(3);

    expect(result).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'network', retryCount: 3 }),
    );
    expect(mocks.safeLogger.error).toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it('handles timeout errors and reports as network failures', async () => {
    const { service, mocks, timeoutSpy } = loadService({ triggerTimeout: true });
    mocks.fetchAndActivate.mockReturnValueOnce(new Promise(() => {}));

    const result = await service.fetchAndActivate(3);

    expect(result).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'network', retryCount: 3 }),
    );
    timeoutSpy.mockRestore();
  });

  it('reads primitive values', () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.getValue.mockReturnValue({
      asString: () => 'hello',
      asNumber: () => 42,
      asBoolean: () => true,
    });

    expect(service.getString('key')).toBe('hello');
    expect(service.getNumber('key')).toBe(42);
    expect(service.getBoolean('key')).toBe(true);
    timeoutSpy.mockRestore();
  });

  it('parses JSON values and handles errors', () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.getValue.mockReturnValueOnce({
      asString: () => '{"flag":true}',
    });

    const parsed = service.getJson<{ flag: boolean }>('json');
    expect(parsed).toEqual({ flag: true });

    mocks.getValue.mockReturnValueOnce({
      asString: () => '{invalid}',
    });

    const fallback = service.getJson('json');
    expect(fallback).toBeNull();
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'RemoteConfigService.getJson' }),
    );
    timeoutSpy.mockRestore();
  });

  it('returns null when JSON value is empty', () => {
    const { service, mocks, timeoutSpy } = loadService();
    mocks.getValue.mockReturnValueOnce({
      asString: () => '',
    });

    const result = service.getJson('json');

    expect(result).toBeNull();
    timeoutSpy.mockRestore();
  });

  it('evaluates feature flags', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    jest.spyOn(service, 'getJson').mockReturnValue({ version: 1 } as never);
    mocks.featureFlags.evaluate.mockResolvedValue(true);

    const enabled = await service.getFeature('new_feature');

    expect(enabled).toBe(true);
    expect(mocks.featureFlags.evaluate).toHaveBeenCalledWith('new_feature', { version: 1 });
    timeoutSpy.mockRestore();
  });

  it('returns false when feature evaluation fails', async () => {
    const { service, mocks, timeoutSpy } = loadService();
    jest.spyOn(service, 'getJson').mockImplementation(() => {
      throw new Error('bad');
    });

    const enabled = await service.getFeature('new_feature');

    expect(enabled).toBe(false);
    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'RemoteConfigService.getFeature' }),
    );
    timeoutSpy.mockRestore();
  });
});
