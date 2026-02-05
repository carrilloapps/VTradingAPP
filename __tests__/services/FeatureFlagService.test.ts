import type { FeatureCondition, RemoteConfigSchema } from '../../src/services/FeatureFlagService';
import { featureFlagService } from '../../src/services/FeatureFlagService';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    I18nManager: {
      localeIdentifier: 'en-US',
    },
    SettingsManager: {
      settings: {
        AppleLocale: 'en-US',
      },
    },
  },
}));

jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn(),
  getVersion: jest.fn(),
  getModel: jest.fn(),
  getBrand: jest.fn(),
  getFirstInstallTime: jest.fn(),
}));

jest.mock('@/services/StorageService', () => ({
  mmkvStorage: {
    getString: jest.fn(),
    getBoolean: jest.fn(),
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
  getFirstInstallTime: jest.Mock;
};

const { Platform, NativeModules } = jest.requireMock('react-native') as {
  Platform: { OS: string };
  NativeModules: {
    I18nManager: { localeIdentifier: string };
    SettingsManager: { settings: { AppleLocale: string } };
  };
};

const storageMock = jest.requireMock('@/services/StorageService') as {
  mmkvStorage: { getString: jest.Mock; getBoolean: jest.Mock; set: jest.Mock };
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
    NativeModules.I18nManager.localeIdentifier = 'en-US';
    NativeModules.SettingsManager.settings.AppleLocale = 'en-US';
    deviceInfo.getBuildNumber.mockReturnValue('10');
    deviceInfo.getVersion.mockReturnValue('1.2.3');
    deviceInfo.getModel.mockReturnValue('Pixel 7');
    deviceInfo.getBrand.mockReturnValue('Google');
    deviceInfo.getFirstInstallTime.mockResolvedValue(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    // Mock storage service
    storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
      if (key === 'user_plan_type') return 'free';
      if (key === 'session_count') return '0';
      if (key === 'vtrading_rollout_id') return null;
      return null;
    });

    storageMock.mmkvStorage.getBoolean.mockImplementation((key: string) => {
      if (key === 'has_completed_onboarding') return false;
      return false;
    });

    fcmMock.fcmService.getFCMToken.mockResolvedValue('token-123');
    fcmMock.fcmService.checkPermission.mockResolvedValue(true);
    authMock.authService.getCurrentUser.mockReturnValue({
      uid: 'user-1',
      email: 'test@example.com',
      providerData: [{ providerId: 'password' }],
    });
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

  // --- Advanced Filters Tests ---

  describe('Email Filter', () => {
    it('allows user with matching email in whitelist', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
      });
      const config = buildConfig('feature-x', true, {
        emails: ['test@example.com', 'admin@example.com'],
      });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('is case-insensitive for email matching', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'Test@Example.COM',
        providerData: [],
      });
      const config = buildConfig('feature-x', true, { emails: ['test@example.com'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies user not in email whitelist', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'other@example.com',
        providerData: [],
      });
      const config = buildConfig('feature-x', true, { emails: ['test@example.com'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('denies when user has no email', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: null,
        providerData: [],
      });
      const config = buildConfig('feature-x', true, { emails: ['test@example.com'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });
  });

  describe('Auth Provider Filter', () => {
    it('allows user with password auth provider', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [{ providerId: 'password' }],
      });
      const config = buildConfig('feature-x', true, { authProviders: ['password'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('allows user with google auth provider', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@gmail.com',
        providerData: [{ providerId: 'google.com' }],
      });
      const config = buildConfig('feature-x', true, { authProviders: ['google.com'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies user with non-matching auth provider', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [{ providerId: 'password' }],
      });
      const config = buildConfig('feature-x', true, { authProviders: ['google.com', 'apple.com'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('denies when user is not authenticated', async () => {
      authMock.authService.getCurrentUser.mockReturnValue(null);
      const config = buildConfig('feature-x', true, { authProviders: ['password'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });
  });

  describe('Plan Type Filter', () => {
    it('allows free plan users', async () => {
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'user_plan_type') return 'free';
        return null;
      });
      const config = buildConfig('feature-x', true, { planTypes: ['free'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('allows premium plan users', async () => {
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'user_plan_type') return 'premium';
        return null;
      });
      const config = buildConfig('feature-x', true, { planTypes: ['premium'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies when plan does not match', async () => {
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'user_plan_type') return 'free';
        return null;
      });
      const config = buildConfig('feature-x', true, { planTypes: ['premium'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('defaults to free plan when not set', async () => {
      storageMock.mmkvStorage.getString.mockImplementation(() => null);
      const config = buildConfig('feature-x', true, { planTypes: ['free'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });
  });

  describe('Country Code Filter', () => {
    it('allows users from US', async () => {
      NativeModules.I18nManager.localeIdentifier = 'en-US';
      const config = buildConfig('feature-x', true, { countryCodes: ['US', 'CA'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('allows users from Venezuela', async () => {
      NativeModules.I18nManager.localeIdentifier = 'es-VE';
      const config = buildConfig('feature-x', true, { countryCodes: ['VE', 'CO', 'AR'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('handles underscore separator in locale', async () => {
      NativeModules.I18nManager.localeIdentifier = 'es_VE';
      const config = buildConfig('feature-x', true, { countryCodes: ['VE'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies users from non-allowed countries', async () => {
      NativeModules.I18nManager.localeIdentifier = 'en-GB';
      const config = buildConfig('feature-x', true, { countryCodes: ['US', 'VE'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('is case-insensitive for country codes', async () => {
      NativeModules.I18nManager.localeIdentifier = 'en-us';
      const config = buildConfig('feature-x', true, { countryCodes: ['US'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });
  });

  describe('Device Language Filter', () => {
    it('allows Spanish language devices', async () => {
      NativeModules.I18nManager.localeIdentifier = 'es-VE';
      const config = buildConfig('feature-x', true, { deviceLanguages: ['es', 'en'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('allows English language devices', async () => {
      NativeModules.I18nManager.localeIdentifier = 'en-US';
      const config = buildConfig('feature-x', true, { deviceLanguages: ['en'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('handles underscore separator in locale for language', async () => {
      NativeModules.I18nManager.localeIdentifier = 'pt_BR';
      const config = buildConfig('feature-x', true, { deviceLanguages: ['pt'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies non-allowed language devices', async () => {
      NativeModules.I18nManager.localeIdentifier = 'fr-FR';
      const config = buildConfig('feature-x', true, { deviceLanguages: ['en', 'es'] });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });
  });

  describe('Days Since Install Filter', () => {
    it('allows users above minimum days threshold', async () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      deviceInfo.getFirstInstallTime.mockResolvedValue(tenDaysAgo);
      const config = buildConfig('feature-x', true, { minDaysSinceInstall: 7 });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies users below minimum days threshold', async () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      deviceInfo.getFirstInstallTime.mockResolvedValue(threeDaysAgo);
      const config = buildConfig('feature-x', true, { minDaysSinceInstall: 7 });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('allows users below maximum days threshold', async () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      deviceInfo.getFirstInstallTime.mockResolvedValue(tenDaysAgo);
      const config = buildConfig('feature-x', true, { maxDaysSinceInstall: 30 });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies users above maximum days threshold', async () => {
      const fortyDaysAgo = Date.now() - 40 * 24 * 60 * 60 * 1000;
      deviceInfo.getFirstInstallTime.mockResolvedValue(fortyDaysAgo);
      const config = buildConfig('feature-x', true, { maxDaysSinceInstall: 30 });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('validates range with both min and max', async () => {
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
      deviceInfo.getFirstInstallTime.mockResolvedValue(fifteenDaysAgo);
      const config = buildConfig('feature-x', true, {
        minDaysSinceInstall: 7,
        maxDaysSinceInstall: 30,
      });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });
  });

  describe('First Time User Filter', () => {
    it('identifies first time user correctly', async () => {
      storageMock.mmkvStorage.getBoolean.mockImplementation((key: string) => {
        if (key === 'has_completed_onboarding') return false;
        return false;
      });
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'session_count') return '1';
        return null;
      });
      const config = buildConfig('feature-x', true, { isFirstTimeUser: true });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('identifies returning user correctly', async () => {
      storageMock.mmkvStorage.getBoolean.mockImplementation((key: string) => {
        if (key === 'has_completed_onboarding') return true;
        return false;
      });
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'session_count') return '10';
        return null;
      });
      const config = buildConfig('feature-x', true, { isFirstTimeUser: false });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies first time user when targeting returning users', async () => {
      storageMock.mmkvStorage.getBoolean.mockImplementation((key: string) => {
        if (key === 'has_completed_onboarding') return false;
        return false;
      });
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'session_count') return '0';
        return null;
      });
      const config = buildConfig('feature-x', true, { isFirstTimeUser: false });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('considers user with multiple sessions as returning user', async () => {
      storageMock.mmkvStorage.getBoolean.mockImplementation((key: string) => {
        if (key === 'has_completed_onboarding') return false;
        return false;
      });
      storageMock.mmkvStorage.getString.mockImplementation((key: string) => {
        if (key === 'session_count') return '5';
        return null;
      });
      const config = buildConfig('feature-x', true, { isFirstTimeUser: true });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });
  });

  describe('Registration Date Filter', () => {
    it('allows users registered after minimum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-02-01T10:00:00Z', // February 1, 2026
        },
      });
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies users registered before minimum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2025-12-15T10:00:00Z', // December 15, 2025
        },
      });
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('allows users registered before maximum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2025-12-15T10:00:00Z', // December 15, 2025
        },
      });
      const config = buildConfig('feature-x', true, { maxRegistrationDate: '2025-12-31' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('denies users registered after maximum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-02-01T10:00:00Z', // February 1, 2026
        },
      });
      const config = buildConfig('feature-x', true, { maxRegistrationDate: '2025-12-31' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('validates registration date range (within range)', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-01-15T10:00:00Z', // January 15, 2026
        },
      });
      const config = buildConfig('feature-x', true, {
        minRegistrationDate: '2026-01-01',
        maxRegistrationDate: '2026-01-31',
      });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('validates registration date range (outside range)', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-02-15T10:00:00Z', // February 15, 2026
        },
      });
      const config = buildConfig('feature-x', true, {
        minRegistrationDate: '2026-01-01',
        maxRegistrationDate: '2026-01-31',
      });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('denies when user has no metadata', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: null,
      });
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('denies when user has no creation time', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: null,
        },
      });
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('denies when user is not authenticated', async () => {
      authMock.authService.getCurrentUser.mockReturnValue(null);
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(false);
    });

    it('compares only date part, ignoring time', async () => {
      // User registered at 11:59 PM on Jan 31, 2026
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-01-31T23:59:59Z',
        },
      });
      // Should be included when max date is Jan 31
      const config = buildConfig('feature-x', true, { maxRegistrationDate: '2026-01-31' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('handles edge case at exact minimum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-01-01T00:00:00Z',
        },
      });
      const config = buildConfig('feature-x', true, { minRegistrationDate: '2026-01-01' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });

    it('handles edge case at exact maximum date', async () => {
      authMock.authService.getCurrentUser.mockReturnValue({
        uid: 'user-1',
        email: 'test@example.com',
        providerData: [],
        metadata: {
          creationTime: '2026-01-31T23:59:59Z',
        },
      });
      const config = buildConfig('feature-x', true, { maxRegistrationDate: '2026-01-31' });

      await expect(featureFlagService.evaluate('feature-x', config)).resolves.toBe(true);
    });
  });
});
