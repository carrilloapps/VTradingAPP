import type { FeatureCondition, RemoteConfigSchema } from '../../src/services/FeatureFlagService';
import { featureFlagService } from '../../src/services/FeatureFlagService';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn(),
  getVersion: jest.fn(),
  getModel: jest.fn(),
  getBrand: jest.fn(),
}));

jest.mock('@/services/StorageService', () => ({
  mmkvStorage: {
    getString: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/services/firebase/FCMService', () => ({
  fcmService: {
    getFCMToken: jest.fn(),
    checkPermission: jest.fn(),
  },
}));

jest.mock('@/services/firebase/AuthService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('@/utils/safeLogger', () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    sensitive: jest.fn(),
  },
}));

const deviceInfo = jest.requireMock('react-native-device-info') as {
  getBuildNumber: jest.Mock;
  getVersion: jest.Mock;
  getModel: jest.Mock;
  getBrand: jest.Mock;
};

const { Platform } = jest.requireMock('react-native') as { Platform: { OS: string } };

const storageMock = jest.requireMock('@/services/StorageService') as {
  mmkvStorage: { getString: jest.Mock; set: jest.Mock };
};

const fcmMock = jest.requireMock('@/services/firebase/FCMService') as {
  fcmService: { getFCMToken: jest.Mock; checkPermission: jest.Mock };
};

const authMock = jest.requireMock('@/services/firebase/AuthService') as {
  authService: { getCurrentUser: jest.Mock };
};

const buildConfig = (featureName: string, enabled: boolean, conditions?: FeatureCondition) => ({
  features: [
    {
      name: featureName,
      enabled,
      rules: conditions
        ? [
            {
              action: 'enable' as const,
              conditions,
            },
          ]
        : undefined,
    },
  ],
});

describe('FeatureFlagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (featureFlagService as unknown as { rolloutId: number | null }).rolloutId = null;
    Platform.OS = 'android';
    deviceInfo.getBuildNumber.mockReturnValue('10');
    deviceInfo.getVersion.mockReturnValue('1.2.3');
    deviceInfo.getModel.mockReturnValue('Pixel 7');
    deviceInfo.getBrand.mockReturnValue('Google');
    storageMock.mmkvStorage.getString.mockReturnValue(null);
    fcmMock.fcmService.getFCMToken.mockResolvedValue('token-123');
    fcmMock.fcmService.checkPermission.mockResolvedValue(true);
    authMock.authService.getCurrentUser.mockReturnValue({ uid: 'user-1' });
  });

  it('returns default when config is null', async () => {
    await expect(featureFlagService.evaluate('feature-x', null, true)).resolves.toBe(true);
  });

  it('returns default when feature is not defined', async () => {
    const config: RemoteConfigSchema = { features: [] };

    await expect(featureFlagService.evaluate('missing', config, false)).resolves.toBe(false);
  });

  it('returns false when feature is disabled globally', async () => {
    const config = buildConfig('feature-x', false);

    await expect(featureFlagService.evaluate('feature-x', config, true)).resolves.toBe(false);
  });

  it('returns true when enabled without rules', async () => {
    const config = buildConfig('feature-x', true);

    await expect(featureFlagService.evaluate('feature-x', config, false)).resolves.toBe(true);
  });

  it('denies when rule conditions do not match', async () => {
    const config = buildConfig('feature-x', true, { platform: 'ios' });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
  });

  it('applies rule without conditions immediately', async () => {
    const config: RemoteConfigSchema = {
      features: [
        {
          name: 'feature-x',
          enabled: true,
          rules: [{ action: 'disable' }],
        },
      ],
    };

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
  });

  it('uses higher priority rule first', async () => {
    const config: RemoteConfigSchema = {
      features: [
        {
          name: 'feature-x',
          enabled: true,
          rules: [
            { action: 'enable', priority: 1, conditions: { platform: 'android' } },
            { action: 'disable', priority: 2 },
          ],
        },
      ],
    };

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
  });

  it('validates build range conditions', async () => {
    deviceInfo.getBuildNumber.mockReturnValue('5');
    const config = buildConfig('feature-x', true, { minBuild: 10 });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);

    deviceInfo.getBuildNumber.mockReturnValue('15');
    const maxConfig = buildConfig('feature-x', true, { maxBuild: 10 });

    await expect(featureFlagService.evaluate('feature-x', maxConfig)).resolves.toBe(false);
  });

  it('validates minimum version', async () => {
    deviceInfo.getVersion.mockReturnValue('1.0.0');
    const config = buildConfig('feature-x', true, { minVersion: '1.2.0' });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);

    deviceInfo.getVersion.mockReturnValue('1.2.0');
    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
  });

  it('matches device models when provided', async () => {
    deviceInfo.getBrand.mockReturnValue('Samsung');
    deviceInfo.getModel.mockReturnValue('S24 Ultra');
    const config = buildConfig('feature-x', true, { models: ['s24'] });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
  });

  it('checks user id allowlist', async () => {
    const config = buildConfig('feature-x', true, { userIds: ['user-2'] });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);

    authMock.authService.getCurrentUser.mockReturnValue({ uid: 'user-2' });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
  });

  it('checks FCM token allowlist', async () => {
    const config = buildConfig('feature-x', true, { fcmTokens: ['token-999'] });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);

    fcmMock.fcmService.getFCMToken.mockResolvedValue('token-999');

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
  });

  it('validates notification permission condition', async () => {
    fcmMock.fcmService.checkPermission.mockResolvedValue(false);
    const config = buildConfig('feature-x', true, { notificationsEnabled: true });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
  });

  it('uses stored rollout id when available', async () => {
    storageMock.mmkvStorage.getString.mockReturnValue('50');
    const config = buildConfig('feature-x', true, { rolloutPercentage: 40 });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    expect(storageMock.mmkvStorage.set).not.toHaveBeenCalled();
  });

  it('generates rollout id when missing and persists it', async () => {
    storageMock.mmkvStorage.getString.mockReturnValue('invalid');
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    const config = buildConfig('feature-x', true, { rolloutPercentage: 10 });

    await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    expect(storageMock.mmkvStorage.set).toHaveBeenCalledWith('vtrading_rollout_id', '5');

    (Math.random as jest.Mock).mockRestore();
  });
});
