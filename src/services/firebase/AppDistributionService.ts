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
      await checkForUpdate(appDistribution);
    } catch (e) {
      observabilityService.captureError(e);
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('not supported')) {
        return;
      }
    }
  }
}

export const appDistributionService = new AppDistributionService();
