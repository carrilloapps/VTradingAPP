import { AppConfig } from '../../src/constants/AppConfig';

type AppConfigType = typeof AppConfig;

type ConfigValues = Record<string, string | undefined>;

const loadAppConfig = (configValues: ConfigValues): AppConfigType => {
  jest.resetModules();
  jest.doMock('react-native-config', () => configValues);
  return require('../../src/constants/AppConfig').AppConfig as AppConfigType;
};

describe('AppConfig', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native-config');
  });

  it('uses defaults when config values are missing', () => {
    const appConfig = loadAppConfig({});

    expect(appConfig.API_BASE_URL).toBe('https://api.vtrading.app');
    expect(appConfig.API_KEY).toBe('default-api-key');
    expect(appConfig.SENTRY_DSN).toBe('');
    expect(appConfig.CLARITY_PROJECT_ID).toBe('');
    expect(appConfig.PRIVACY_POLICY_URL).toBe('https://vtrading.app/privacy');
    expect(appConfig.TERMS_OF_USE_URL).toBe('https://vtrading.app/terms');
    expect(appConfig.DEFAULT_LOCALE).toBe('es-VE');
    expect(appConfig.DECIMAL_PLACES).toBe(2);
    expect(appConfig.GOOGLE_WEB_CLIENT_ID).toBe('');
    expect(appConfig.ADMOB_APP_ID_ANDROID).toBe('');
    expect(appConfig.ADMOB_APP_ID_IOS).toBe('');
    expect(appConfig.ADMOB_BANNER_ID_ANDROID).toBe('');
    expect(appConfig.ADMOB_BANNER_ID_IOS).toBe('');
    expect(appConfig.BASE_CURRENCY).toBe('USD');
    expect(appConfig.LICENSES_URL).toBe('https://vtrading.app/licenses');
    expect(appConfig.COOKIES_URL).toBe('https://vtrading.app/cookies');
    expect(appConfig.DEEP_LINK_SCHEME).toBe('vtrading://');
    expect(appConfig.DEEP_LINK_HOST).toBe('discover.vtrading.app');
    expect(appConfig.IS_DEV).toBe(__DEV__);
    expect(appConfig.IS_PROD).toBe(!__DEV__);
  });

  it('uses config values when provided', () => {
    const appConfig = loadAppConfig({
      API_BASE_URL: 'https://custom.api',
      API_KEY: 'custom-key',
      SENTRY_DSN: 'dsn-value',
      CLARITY_PROJECT_ID: 'clarity-id',
      PRIVACY_POLICY_URL: 'https://custom/privacy',
      TERMS_OF_USE_URL: 'https://custom/terms',
      DEFAULT_LOCALE: 'en-US',
      DECIMAL_PLACES: '4',
      GOOGLE_WEB_CLIENT_ID: 'google-client',
      ADMOB_APP_ID_ANDROID: 'admob-android',
      ADMOB_APP_ID_IOS: 'admob-ios',
      ADMOB_BANNER_ID_ANDROID: 'banner-android',
      ADMOB_BANNER_ID_IOS: 'banner-ios',
      BASE_CURRENCY: 'EUR',
      LICENSES_URL: 'https://custom/licenses',
      COOKIES_URL: 'https://custom/cookies',
      DEEP_LINK_SCHEME: 'custom://',
      DEEP_LINK_HOST: 'custom.host',
    });

    expect(appConfig.API_BASE_URL).toBe('https://custom.api');
    expect(appConfig.API_KEY).toBe('custom-key');
    expect(appConfig.SENTRY_DSN).toBe('dsn-value');
    expect(appConfig.CLARITY_PROJECT_ID).toBe('clarity-id');
    expect(appConfig.PRIVACY_POLICY_URL).toBe('https://custom/privacy');
    expect(appConfig.TERMS_OF_USE_URL).toBe('https://custom/terms');
    expect(appConfig.DEFAULT_LOCALE).toBe('en-US');
    expect(appConfig.DECIMAL_PLACES).toBe(4);
    expect(appConfig.GOOGLE_WEB_CLIENT_ID).toBe('google-client');
    expect(appConfig.ADMOB_APP_ID_ANDROID).toBe('admob-android');
    expect(appConfig.ADMOB_APP_ID_IOS).toBe('admob-ios');
    expect(appConfig.ADMOB_BANNER_ID_ANDROID).toBe('banner-android');
    expect(appConfig.ADMOB_BANNER_ID_IOS).toBe('banner-ios');
    expect(appConfig.BASE_CURRENCY).toBe('EUR');
    expect(appConfig.LICENSES_URL).toBe('https://custom/licenses');
    expect(appConfig.COOKIES_URL).toBe('https://custom/cookies');
    expect(appConfig.DEEP_LINK_SCHEME).toBe('custom://');
    expect(appConfig.DEEP_LINK_HOST).toBe('custom.host');
  });
});
