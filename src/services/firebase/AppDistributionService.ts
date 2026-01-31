import { getAppDistribution, checkForUpdate } from '@react-native-firebase/app-distribution';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { observabilityService } from '../ObservabilityService';
import { AppConfig } from '../../constants/AppConfig';

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

    // Skip in production builds for general users to avoid "platform not supported" noise
    // App Distribution is intended for pre-release testing.
    if (AppConfig.IS_PROD) {
      return;
    }

    // Only supported on Android and iOS
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      // Skip on emulators/simulators
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        return;
      }

      const appDistribution = getAppDistribution();

      // Only check if user is a signed-in tester
      const isTester = await appDistribution.isTesterSignedIn();
      if (!isTester) {
        return;
      }

      await checkForUpdate(appDistribution);
    } catch (e: any) {
      const message = String(e?.message || e || '').toLowerCase();

      // Proactively silence expected platform errors from reaching Sentry
      const isExpectedError =
        message.includes('not supported') ||
        message.includes('not available') ||
        message.includes('unsupported') ||
        message.includes('platform') ||
        message.includes('framework');

      if (isExpectedError) {
        console.log('[AppDistribution] Service not available on this device/environment (Safe Skip)');
        return;
      }

      // Report only real unexpected errors
      observabilityService.captureError(e, { context: 'AppDistribution_checkForUpdate' });
    }
  }
}

export const appDistributionService = new AppDistributionService();
