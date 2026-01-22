import { appCheckService } from '../../src/services/firebase/AppCheckService';
import { initializeAppCheck } from '@react-native-firebase/app-check';

describe('AppCheckService', () => {
  it('initializes correctly', async () => {
    await appCheckService.initialize();
    expect(initializeAppCheck).toHaveBeenCalled();
  });

  it('gets token', async () => {
    const token = await appCheckService.getToken();
    expect(token).toBe('mock-app-check-token');
  });
});
