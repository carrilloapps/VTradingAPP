import { appCheckService } from '../../src/services/firebase/AppCheckService';
import { firebase } from '@react-native-firebase/app-check';

describe('AppCheckService', () => {
  it('initializes correctly', async () => {
    await appCheckService.initialize();
    expect(firebase.appCheck().initializeAppCheck).toHaveBeenCalled();
  });

  it('gets token', async () => {
    const token = await appCheckService.getToken();
    expect(token).toBe('mock-app-check-token');
  });
});
