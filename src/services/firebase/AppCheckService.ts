import { initializeAppCheck, getToken, AppCheck } from '@react-native-firebase/app-check';
import { getApp } from '@react-native-firebase/app';
import { observabilityService } from '../ObservabilityService';
import SafeLogger from '../../utils/safeLogger';

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
        observabilityService.captureError(e, {
          context: 'AppCheckService.initialize',
          action: 'init_app_check',
          isDev: __DEV__
        });
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

      // Check for "App not registered" error - this is a configuration issue
      if (message.includes('App not registered') ||
        (message.includes('code: 400') && message.includes('App not registered'))) {
        SafeLogger.error('[AppCheck] App not registered in Firebase Console');
        SafeLogger.error('[AppCheck] Please verify the Android/iOS app is registered in Firebase');
        SafeLogger.error('[AppCheck] Error details:', { message });

        // Only report this configuration error once to avoid spam
        if (this.errorCount === 0) {
          observabilityService.captureError(
            new Error(`AppCheck configuration error: App not registered in Firebase Console`),
            {
              context: 'AppCheck_getToken',
              errorDetails: message,
              recommendation: 'Verify app registration in Firebase Console'
            }
          );
        }

        this.lastErrorTime = Date.now();
        this.errorCount++;
        this.lastErrorMessage = message;

        // Return undefined to allow app to continue without App Check
        return undefined;
      }

      // Check for other expected errors
      const isExpectedError =
        message.includes('App Check API has not been used') ||
        message.includes('403') ||
        message.includes('Too many attempts') ||
        (message.includes('token-error') && __DEV__);

      // Report unexpected errors to Sentry
      if (!isExpectedError) {
        observabilityService.captureError(e, {
          context: 'AppCheck_getToken',
          errorCount: this.errorCount
        });
      }

      this.lastErrorTime = Date.now();
      this.errorCount++;

      // Silence expected development errors or quota exceeded
      if (isExpectedError) {
        if (__DEV__) {
          // Use debug instead of log to keep console clean
          SafeLogger.log('[AppCheck] Suppressed:', message);
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
