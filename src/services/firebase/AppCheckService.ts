import { initializeAppCheck, getToken, AppCheck } from '@react-native-firebase/app-check';
import { getApp } from '@react-native-firebase/app';

class AppCheckService {
  private appCheckInstance: AppCheck | null = null;

  /**
   * Initialize App Check
   */
  async initialize(): Promise<void> {
    try {
      const app = getApp();
      // Create a custom provider or use the default one
      // For development, we might want to use the debug provider
      // Use config object instead of class instance for modular API compatibility
      const provider = {
        providerOptions: {
          android: {
            provider: (__DEV__ ? 'debug' : 'playIntegrity') as 'debug' | 'playIntegrity',
            debugToken: '12345678-1234-1234-1234-1234567890ab', // Replace with your debug token from logs
          },
          apple: {
            provider: (__DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback') as 'debug' | 'appAttestWithDeviceCheckFallback',
            debugToken: '12345678-1234-1234-1234-1234567890ab', // Replace with your debug token from logs
          },
        }
      };

      this.appCheckInstance = await initializeAppCheck(app, {
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
      if (!this.appCheckInstance) {
        // Try to get instance if initialized previously, or re-initialize?
        // initializeAppCheck is idempotent-ish (returns existing if exists)?
        // But we need the provider config.
        // Assuming initialize() is called at app start.
        // If not, we can try to initialize here or warn.
        // For now, let's try to get it via initializeAppCheck with same config or assume initialized.
        // Actually, if we call initializeAppCheck again, it returns the promise of the instance.
        // But we need the provider.
        console.warn('[AppCheck] Instance not initialized. Call initialize() first.');
        return undefined;
      }
      
      const result = await getToken(this.appCheckInstance);
      return result.token;
    } catch (error: any) {
      // Handle "API not enabled" or configuration errors gracefully
      const message = error.message || '';
      if (message.includes('App Check API has not been used') || message.includes('403')) {
         if (__DEV__) {
             console.warn('[AppCheck] API no habilitada en Firebase Console. Se omite App Check en modo desarrollo.');
         }
         return undefined;
      }
      
      // Log as warning instead of error to avoid RedBox/interruptions
      console.warn('[AppCheck] Error obteniendo token:', message);
      return undefined;
    }
  }
}

export const appCheckService = new AppCheckService();
