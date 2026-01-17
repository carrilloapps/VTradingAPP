import appDistribution from '@react-native-firebase/app-distribution';

class AppDistributionService {
  /**
   * Check if a new tester release is available
   */
  async checkForUpdate(): Promise<void> {
    try {
      if (!__DEV__) { // Only check in release builds usually
        await appDistribution().checkForUpdate();
      }
    } catch (error) {
      console.error('[AppDistribution] Error checking for update:', error);
    }
  }
}

export const appDistributionService = new AppDistributionService();
