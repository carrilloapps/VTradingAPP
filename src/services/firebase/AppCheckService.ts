import { initializeAppCheck, getToken, AppCheck } from '@react-native-firebase/app-check';
import { getApp } from '@react-native-firebase/app';
import { observabilityService } from '../ObservabilityService';

class AppCheckService {
  private appCheckInstance: AppCheck | null = null;

  /**
   * Initialize App Check
   */
  async initialize(): Promise<void> {
    try {
      const app = getApp();
      
      // Manually construct the provider object to match ReactNativeFirebaseAppCheckProvider structure
      // since the class is not exported as a value in the modular API.
      const provider = {
        getToken: () => Promise.reject(new Error('Native provider handled internally')),
        providerOptions: {
          android: {
            provider: (__DEV__ ? 'debug' : 'playIntegrity'),
            // debugToken: '...', 
          },
          apple: {
            provider: (__DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback'),
            // debugToken: '...', 
          },
        }
      };

      // @ts-ignore - provider matches AppCheckProvider interface at runtime
      this.appCheckInstance = await initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e: any) {
      const message = e.message || String(e);
      if (__DEV__ && (message.includes('Debug') || message.includes('token'))) {
         // Ignore initialization errors in DEV with invalid tokens
      } else {
         observabilityService.captureError(e);
      }
      // Ignore error
    }
  }

  private lastErrorTime: number = 0;
  private errorCount: number = 0;
  private lastErrorMessage: string = '';

  /**
   * Get App Check token
   */
  async getToken(): Promise<string | undefined> {
    try {
      if (!this.appCheckInstance) {
        // Suppress warning if repeated too frequently
        if (Date.now() - this.lastErrorTime > 60000) {
            // Instance not initialized
            this.lastErrorTime = Date.now();
        }
        return undefined;
      }
      
      // Prevent rapid retries if we are hitting "Too many attempts"
      // Exponential backoff: 1min, 2min, 4min, etc. capped at 1 hour
      const backoffTime = Math.min(60000 * Math.pow(2, this.errorCount - 3), 3600000);
      
      if (this.errorCount > 3 && Date.now() - this.lastErrorTime < backoffTime) {
          return undefined; 
      }

      const result = await getToken(this.appCheckInstance);
      this.errorCount = 0; // Reset on success
      this.lastErrorMessage = '';
      return result.token;
    } catch (e: any) {
      const message = e.message || String(e);
      // Suppress specific App Check errors that are expected in development or when quota is exceeded
      const isExpectedError = 
          message.includes('App Check API has not been used') || 
          message.includes('403') || 
          message.includes('Too many attempts') ||
          (message.includes('token-error') && __DEV__);

      if (!isExpectedError) {
          observabilityService.captureError(e);
      }
      
      this.lastErrorTime = Date.now();
      this.errorCount++;

      // Handle "API not enabled" or configuration errors gracefully
      
      // Silence expected development errors or quota exceeded
      if (isExpectedError) {
         if (__DEV__ && this.errorCount === 1) { 
             // Optional: console.log('App Check warning suppressed:', message);
         }
         return undefined;
      }

      // Avoid spamming the same error
      if (message !== this.lastErrorMessage) {
          this.lastErrorMessage = message;
      }
      
      return undefined;
    }
  }
}

export const appCheckService = new AppCheckService();
