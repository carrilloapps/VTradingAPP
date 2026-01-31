import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  setNetworkState: (state: Partial<NetworkState>) => void;
  initialize: () => () => void;
}

export const useNetworkStore = create<NetworkState>()(
  devtools(
    set => ({
      isConnected: true,
      isInternetReachable: true,
      setNetworkState: newState => set(state => ({ ...state, ...newState })),
      initialize: () => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
          useNetworkStore.getState().setNetworkState({
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
          });
        });
        return unsubscribe;
      },
    }),
    { name: 'NetworkStore' },
  ),
);
