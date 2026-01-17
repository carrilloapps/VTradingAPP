import { firebase } from '@react-native-firebase/app-check';

class AppCheckService {
  /**
   * Initialize App Check
   */
  async initialize(): Promise<void> {
    try {
      // Create a custom provider or use the default one
      // For development, we might want to use the debug provider
      const provider = firebase.appCheck().newReactNativeFirebaseAppCheckProvider();
      provider.configure({
        android: {
          provider: __DEV__ ? 'debug' : 'playIntegrity',
          debugToken: '12345678-1234-1234-1234-1234567890ab', // Replace with your debug token from logs
        },
        apple: {
          provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
          debugToken: '12345678-1234-1234-1234-1234567890ab', // Replace with your debug token from logs
        },
      });

      await firebase.appCheck().initializeAppCheck({
        provider,
        isTokenAutoRefreshEnabled: true,
      });
      console.log('[AppCheck] Initialized');
    } catch (error) {
      console.error('[AppCheck] Initialization error:', error);
    }
  }

  /**
   * Get App Check token
   */
  async getToken(): Promise<string | undefined> {
    try {
      const result = await firebase.appCheck().getToken();
      return result.token;
    } catch (error) {
      console.error('[AppCheck] Error getting token:', error);
      return undefined;
    }
  }
}

export const appCheckService = new AppCheckService();
