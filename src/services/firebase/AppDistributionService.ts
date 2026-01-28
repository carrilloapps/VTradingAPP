import { getAppDistribution, checkForUpdate } from '@react-native-firebase/app-distribution';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { observabilityService } from '../ObservabilityService';

class AppDistributionService {
  /**
   * Check if a new tester release is available
   * Skips check on emulators and unsupported platforms
   */
  async checkForUpdate(): Promise<void> {
    // Skip in development mode
    if (__DEV__) {
      return;
    }

    // Only supported on Android and iOS
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      console.log('[AppDistribution] Skipping - not supported on platform:', Platform.OS);
      return;
    }

    try {
      // Skip on emulators/simulators as App Distribution is typically not available
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        console.log('[AppDistribution] Skipping - running on emulator/simulator');
        return;
      }

      const appDistribution = getAppDistribution();

      // Only check for updates if user is a signed-in tester
      // This prevents errors for regular production users
      const isTester = await appDistribution.isTesterSignedIn();
      if (!isTester) {
        console.log('[AppDistribution] User is not a signed-in tester');
        return;
      }

      await checkForUpdate(appDistribution);
    } catch (e: any) {
      const message = String(e?.message || e || '').toLowerCase();

      // Don't report platform-specific errors to Sentry
      // These are expected in certain environments
      if (message.includes('not supported') || message.includes('not available')) {
        console.warn('[AppDistribution] Service not available on this platform/device');
        return;
      }

      // Report unexpected errors for investigation
      observabilityService.captureError(e, { context: 'AppDistribution_checkForUpdate' });
    }
  }
}

export const appDistributionService = new AppDistributionService();
