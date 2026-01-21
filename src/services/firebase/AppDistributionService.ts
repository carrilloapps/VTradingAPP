import { getAppDistribution, checkForUpdate } from '@react-native-firebase/app-distribution';
import { Platform } from 'react-native';

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not supported')) {
        return;
      }
      console.error('[AppDistribution] Error checking for update:', error);
    }
  }
}

export const appDistributionService = new AppDistributionService();
