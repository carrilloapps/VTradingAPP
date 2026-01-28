import Config from 'react-native-config';

export const AppConfig = {
  API_BASE_URL: Config.API_BASE_URL || 'https://api.example.com',
  API_KEY: Config.API_KEY || 'default-api-key',
  SENTRY_DSN: Config.SENTRY_DSN || '',
  CLARITY_PROJECT_ID: Config.CLARITY_PROJECT_ID || '',
  PRIVACY_POLICY_URL: Config.PRIVACY_POLICY_URL || 'https://vtrading.app/privacy',
  TERMS_OF_USE_URL: Config.TERMS_OF_USE_URL || 'https://vtrading.app/terms',
  DEFAULT_LOCALE: Config.DEFAULT_LOCALE || 'es-VE',
  DECIMAL_PLACES: parseInt(Config.DECIMAL_PLACES || '2', 10),
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID || '',
  ADMOB_APP_ID_ANDROID: Config.ADMOB_APP_ID_ANDROID || '',
  ADMOB_APP_ID_IOS: Config.ADMOB_APP_ID_IOS || '',
  ADMOB_BANNER_ID_ANDROID: Config.ADMOB_BANNER_ID_ANDROID || '',
  ADMOB_BANNER_ID_IOS: Config.ADMOB_BANNER_ID_IOS || '',
  BASE_CURRENCY: Config.BASE_CURRENCY || 'USD',
  LICENSES_URL: Config.LICENSES_URL || 'https://vtrading.app/licenses',
  COOKIES_URL: Config.COOKIES_URL || 'https://vtrading.app/cookies',
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
} as const;
