import { getAppDistribution, checkForUpdate } from '@react-native-firebase/app-distribution';
import { Platform } from 'react-native';
import { observabilityService } from '../ObservabilityService';

class AppDistributionService {
  /**
   * Check if a new tester release is available
   */
  async checkForUpdate(): Promise<void> {
    if (__DEV__) {
      return;
    }

    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      const appDistribution = getAppDistribution();

      // Secondary check: only continue if tester is actually signed in or it's a known tester environment
      // This helps avoid general production users from seeing support errors
      const isTester = await appDistribution.isTesterSignedIn();
      if (!isTester) return;

      await checkForUpdate(appDistribution);
    } catch (e: any) {
      const message = String(e?.message || e || '').toLowerCase();

      // Silence known non-critical platform messages
      if (message.includes('not supported') || message.includes('not available')) {
        if (__DEV__) console.log('[AppDistribution] Check skipped: platform not supported');
        return;
      }

      observabilityService.captureError(e, { context: 'AppDistribution_checkForUpdate' });
    }
  }
}

export const appDistributionService = new AppDistributionService();
