const mockUseAuthStore = jest.fn();
const mockUseToastStore = jest.fn();
const mockUseNetworkStore = jest.fn();

jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

jest.mock('../../src/stores/toastStore', () => ({
  useToastStore: mockUseToastStore,
}));

jest.mock('../../src/stores/filterStore', () => ({
  useFilterStore: jest.fn(),
}));

jest.mock('../../src/stores/networkStore', () => ({
  useNetworkStore: mockUseNetworkStore,
}));

describe('stores index hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth state and actions', () => {
    const authState = {
      user: { uid: 'user-1' },
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      deleteAccount: jest.fn(),
      googleSignIn: jest.fn(),
      resetPassword: jest.fn(),
      signInAnonymously: jest.fn(),
      updateProfileName: jest.fn(),
    };

    mockUseAuthStore.mockImplementation(selector => selector(authState));

    jest.isolateModules(() => {
      const { useAuth } = require('../../src/stores');
      const result = useAuth();

      expect(result.user).toEqual(authState.user);
      expect(result.isLoading).toBe(false);
      expect(result.signIn).toBe(authState.signIn);
      expect(result.signOut).toBe(authState.signOut);
      expect(result.googleSignIn).toBe(authState.googleSignIn);
      expect(result.updateProfileName).toBe(authState.updateProfileName);
    });
  });

  it('returns toast helper', () => {
    const toastState = { showToast: jest.fn() };
    mockUseToastStore.mockImplementation(selector => selector(toastState));

    jest.isolateModules(() => {
      const { useToast } = require('../../src/stores');
      const result = useToast();

      expect(result.showToast).toBe(toastState.showToast);
    });
  });

  it('returns network helper', () => {
    const networkState = { isConnected: true };
    mockUseNetworkStore.mockImplementation(selector => selector(networkState));

    jest.isolateModules(() => {
      const { useNetwork } = require('../../src/stores');
      const result = useNetwork();

      expect(result.isConnected).toBe(true);
    });
  });
});
