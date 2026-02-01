type AppDistributionMocks = {
  checkForUpdate: jest.Mock;
  getAppDistribution: jest.Mock;
  isTesterSignedIn: jest.Mock;
  isEmulator: jest.Mock;
  safeLogger: { log: jest.Mock };
  observability: { captureError: jest.Mock };
};

const loadService = (options: {
  isDev: boolean;
  isProd: boolean;
  platform: string;
  isEmulator: boolean;
  isTester: boolean;
  checkError?: Error;
}): { service: { checkForUpdate: () => Promise<void> }; mocks: AppDistributionMocks } => {
  jest.resetModules();

  (globalThis as { __DEV__?: boolean }).__DEV__ = options.isDev;

  const isTesterSignedIn = jest.fn().mockResolvedValue(options.isTester);
  const checkForUpdate = jest.fn(() => {
    if (options.checkError) {
      throw options.checkError;
    }
  });

  const getAppDistribution = jest.fn(() => ({ isTesterSignedIn }));
  const isEmulator = jest.fn().mockResolvedValue(options.isEmulator);
  const safeLogger = { log: jest.fn() };
  const observability = { captureError: jest.fn() };

  jest.doMock('react-native', () => ({ Platform: { OS: options.platform } }));
  jest.doMock('react-native-device-info', () => ({ isEmulator }));
  jest.doMock('@react-native-firebase/app-distribution', () => ({
    getAppDistribution,
    checkForUpdate,
  }));
  jest.doMock('@/constants/AppConfig', () => ({
    AppConfig: { IS_PROD: options.isProd },
  }));
  jest.doMock('@/services/ObservabilityService', () => ({
    observabilityService: observability,
  }));
  jest.doMock('@/utils/safeLogger', () => ({
    __esModule: true,
    default: safeLogger,
  }));

  let appDistributionService!: { checkForUpdate: () => Promise<void> };
  jest.isolateModules(() => {
    ({ appDistributionService } = require('../../../src/services/firebase/AppDistributionService'));
  });

  return {
    service: appDistributionService,
    mocks: {
      checkForUpdate,
      getAppDistribution,
      isTesterSignedIn,
      isEmulator,
      safeLogger,
      observability,
    },
  };
};

describe('AppDistributionService', () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

  afterAll(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it('skips in dev mode', async () => {
    const { service, mocks } = loadService({
      isDev: true,
      isProd: false,
      platform: 'android',
      isEmulator: false,
      isTester: true,
    });

    await service.checkForUpdate();

    expect(mocks.getAppDistribution).not.toHaveBeenCalled();
  });

  it('skips in production builds', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: true,
      platform: 'android',
      isEmulator: false,
      isTester: true,
    });

    await service.checkForUpdate();

    expect(mocks.getAppDistribution).not.toHaveBeenCalled();
  });

  it('skips on unsupported platforms', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'web',
      isEmulator: false,
      isTester: true,
    });

    await service.checkForUpdate();

    expect(mocks.getAppDistribution).not.toHaveBeenCalled();
  });

  it('skips on emulators', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'android',
      isEmulator: true,
      isTester: true,
    });

    await service.checkForUpdate();

    expect(mocks.getAppDistribution).not.toHaveBeenCalled();
  });

  it('skips when tester is not signed in', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'android',
      isEmulator: false,
      isTester: false,
    });

    await service.checkForUpdate();

    expect(mocks.getAppDistribution).toHaveBeenCalledTimes(1);
    expect(mocks.checkForUpdate).not.toHaveBeenCalled();
  });

  it('checks for updates when tester is signed in', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'android',
      isEmulator: false,
      isTester: true,
    });

    await service.checkForUpdate();

    expect(mocks.checkForUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ isTesterSignedIn: mocks.isTesterSignedIn }),
    );
  });

  it('logs and skips expected platform errors', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'android',
      isEmulator: false,
      isTester: true,
      checkError: new Error('Not supported on this platform'),
    });

    await service.checkForUpdate();

    expect(mocks.safeLogger.log).toHaveBeenCalled();
    expect(mocks.observability.captureError).not.toHaveBeenCalled();
  });

  it('reports unexpected errors', async () => {
    const { service, mocks } = loadService({
      isDev: false,
      isProd: false,
      platform: 'android',
      isEmulator: false,
      isTester: true,
      checkError: new Error('boom'),
    });

    await service.checkForUpdate();

    expect(mocks.observability.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'AppDistribution_checkForUpdate' }),
    );
  });
});
