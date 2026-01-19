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

  private lastErrorTime: number = 0;
  private errorCount: number = 0;

  /**
   * Get App Check token
   */
  async getToken(): Promise<string | undefined> {
    try {
      if (!this.appCheckInstance) {
        // Suppress warning if repeated too frequently
        if (Date.now() - this.lastErrorTime > 60000) {
            console.warn('[AppCheck] Instance not initialized. Call initialize() first.');
            this.lastErrorTime = Date.now();
        }
        return undefined;
      }
      
      // Prevent rapid retries if we are hitting "Too many attempts"
      if (this.errorCount > 3 && Date.now() - this.lastErrorTime < 60000) {
          return undefined; // Backoff for 1 minute
      }

      const result = await getToken(this.appCheckInstance);
      this.errorCount = 0; // Reset on success
      return result.token;
    } catch (error: any) {
      this.lastErrorTime = Date.now();
      this.errorCount++;

      // Handle "API not enabled" or configuration errors gracefully
      const message = error.message || '';
      
      // Silence expected development errors or quota exceeded
      if (message.includes('App Check API has not been used') || 
          message.includes('403') || 
          message.includes('Too many attempts')) {
         
         if (__DEV__ && this.errorCount === 1) { // Only warn once per backoff period
             console.warn('[AppCheck] Warning: App Check skipped (API not enabled or quota exceeded).');
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
