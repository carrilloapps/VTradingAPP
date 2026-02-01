const mockRemoteConfig = {
  setConfigSettings: jest.fn(),
};

const mockGetValue = jest.fn();
const mockFetchAndActivate = jest.fn();
const mockSetDefaults = jest.fn();

declare const global: any;

jest.mock('@react-native-firebase/remote-config', () => ({
  getRemoteConfig: jest.fn(() => mockRemoteConfig),
  setDefaults: (...args: unknown[]) => mockSetDefaults(...args),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...args),
  getValue: (...args: unknown[]) => mockGetValue(...args),
}));

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('@/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logError: jest.fn(),
  },
}));

jest.mock('@/services/FeatureFlagService', () => ({
  featureFlagService: {
    evaluate: jest.fn(),
  },
}));

jest.mock('@/utils/safeLogger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { remoteConfigService } = require('../../../src/services/firebase/RemoteConfigService') as {
  remoteConfigService: {
    initialize: () => Promise<void>;
    fetchAndActivate: (retryCount?: number) => Promise<boolean>;
    getString: (key: string) => string;
    getNumber: (key: string) => number;
    getBoolean: (key: string) => boolean;
    getJson: <T>(key: string) => T | null;
    getFeature: (featureName: string) => Promise<boolean>;
  };
};

describe('RemoteConfigService', () => {
  let timeoutSpy: jest.SpyInstance;
  const observabilityService = jest.requireMock('@/services/ObservabilityService')
    .observabilityService as { captureError: jest.Mock };
  const analyticsService = jest.requireMock('@/services/firebase/AnalyticsService')
    .analyticsService as { logError: jest.Mock };
  const featureFlagService = jest.requireMock('@/services/FeatureFlagService')
    .featureFlagService as { evaluate: jest.Mock };
  const safeLogger = jest.requireMock('@/utils/safeLogger').default as {
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAndActivate.mockReset();
    mockRemoteConfig.setConfigSettings.mockResolvedValue(undefined);
    mockFetchAndActivate.mockResolvedValue(true);
    mockSetDefaults.mockResolvedValue(undefined);
    timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((...args: unknown[]) => {
      const [callback, delay, ...rest] = args as [
        (...callbackArgs: unknown[]) => void,
        number | undefined,
        ...unknown[],
      ];

      if (delay && delay < 10000) {
        callback(...rest);
      }

      return 0 as unknown as number;
    });
  });

  afterEach(() => {
    timeoutSpy.mockRestore();
  });

  it('initializes with dev config and defaults', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;

    jest.spyOn(remoteConfigService, 'fetchAndActivate').mockResolvedValue(true);

    await remoteConfigService.initialize();

    expect(mockRemoteConfig.setConfigSettings).toHaveBeenCalledWith({
      minimumFetchIntervalMillis: 0,
    });
    expect(mockSetDefaults).toHaveBeenCalled();
    expect(remoteConfigService.fetchAndActivate).toHaveBeenCalled();
  });

  it('reports initialization errors', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    mockRemoteConfig.setConfigSettings.mockRejectedValueOnce(new Error('fail'));

    await remoteConfigService.initialize();

    expect(observabilityService.captureError).toHaveBeenCalled();
    expect(analyticsService.logError).toHaveBeenCalledWith('remote_config_init');
  });

  it('fetches and activates successfully', async () => {
    const result = await remoteConfigService.fetchAndActivate();

    expect(result).toBe(true);
    expect(mockFetchAndActivate).toHaveBeenCalledWith(mockRemoteConfig);
  });

  it('retries on network errors and returns true when recovered', async () => {
    mockFetchAndActivate
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(true);

    const result = await remoteConfigService.fetchAndActivate();

    expect(result).toBe(true);
    expect(safeLogger.warn).toHaveBeenCalled();
  });

  it('captures non-network errors and returns false', async () => {
    mockFetchAndActivate.mockRejectedValueOnce(new Error('server error'));

    const result = await remoteConfigService.fetchAndActivate();

    expect(result).toBe(false);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'server' }),
    );
    expect(safeLogger.error).toHaveBeenCalled();
  });

  it('captures errors when retry count is already maxed', async () => {
    mockFetchAndActivate.mockRejectedValueOnce(new Error('server error'));

    const result = await remoteConfigService.fetchAndActivate(3);

    expect(result).toBe(false);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ retryCount: 3 }),
    );
  });

  it('wraps non-error rejections into Error instances', async () => {
    mockFetchAndActivate.mockRejectedValueOnce('boom');

    const result = await remoteConfigService.fetchAndActivate();

    expect(result).toBe(false);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'server' }),
    );
  });

  it('reports network errors after max retries', async () => {
    mockFetchAndActivate.mockRejectedValueOnce(new Error('timeout')); // network error

    const result = await remoteConfigService.fetchAndActivate(3);

    expect(result).toBe(false);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ errorType: 'network', retryCount: 3 }),
    );
    expect(safeLogger.error).toHaveBeenCalled();
  });

  it('reads primitive values', () => {
    mockGetValue.mockReturnValue({
      asString: () => 'hello',
      asNumber: () => 42,
      asBoolean: () => true,
    });

    expect(remoteConfigService.getString('key')).toBe('hello');
    expect(remoteConfigService.getNumber('key')).toBe(42);
    expect(remoteConfigService.getBoolean('key')).toBe(true);
  });

  it('parses JSON values and handles errors', () => {
    mockGetValue.mockReturnValueOnce({
      asString: () => '{"flag":true}',
    });

    const parsed = remoteConfigService.getJson<{ flag: boolean }>('json');
    expect(parsed).toEqual({ flag: true });

    mockGetValue.mockReturnValueOnce({
      asString: () => '{invalid}',
    });

    const fallback = remoteConfigService.getJson('json');
    expect(fallback).toBeNull();
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'RemoteConfigService.getJson' }),
    );
  });

  it('returns null when JSON value is empty', () => {
    mockGetValue.mockReturnValueOnce({
      asString: () => '',
    });

    const result = remoteConfigService.getJson('json');

    expect(result).toBeNull();
  });

  it('evaluates feature flags', async () => {
    jest.spyOn(remoteConfigService, 'getJson').mockReturnValue({ version: 1 } as never);
    featureFlagService.evaluate.mockResolvedValue(true);

    const enabled = await remoteConfigService.getFeature('new_feature');

    expect(enabled).toBe(true);
    expect(featureFlagService.evaluate).toHaveBeenCalledWith('new_feature', { version: 1 });
  });

  it('returns false when feature evaluation fails', async () => {
    jest.spyOn(remoteConfigService, 'getJson').mockImplementation(() => {
      throw new Error('bad');
    });

    const enabled = await remoteConfigService.getFeature('new_feature');

    expect(enabled).toBe(false);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'RemoteConfigService.getFeature' }),
    );
  });
});
