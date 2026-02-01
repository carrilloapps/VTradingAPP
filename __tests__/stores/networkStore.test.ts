import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../../src/stores/networkStore';

type NetInfoListener = (state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) => void;

let mockListener: NetInfoListener | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((callback: NetInfoListener) => {
      mockListener = callback;
      return mockUnsubscribe;
    }),
  },
}));

describe('useNetworkStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListener = null;
    useNetworkStore.setState({ isConnected: true, isInternetReachable: true });
  });

  it('merges network state updates', () => {
    useNetworkStore.getState().setNetworkState({ isConnected: false });

    expect(useNetworkStore.getState().isConnected).toBe(false);
    expect(useNetworkStore.getState().isInternetReachable).toBe(true);
  });

  it('initializes and listens for network changes', () => {
    const stop = useNetworkStore.getState().initialize();

    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(typeof stop).toBe('function');

    mockListener?.({ isConnected: false, isInternetReachable: false });

    expect(useNetworkStore.getState().isConnected).toBe(false);
    expect(useNetworkStore.getState().isInternetReachable).toBe(false);

    stop();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
