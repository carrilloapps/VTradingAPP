import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
    isConnected: boolean | null;
    setConnected: (connected: boolean | null) => void;
}

export const useNetworkStore = create<NetworkState>()(
    devtools(
        (set) => ({
            isConnected: null,
            setConnected: (connected) => set({ isConnected: connected }),
        }),
        { name: 'NetworkStore' }
    )
);

// Initialize network listener
NetInfo.addEventListener((state) => {
    useNetworkStore.getState().setConnected(state.isConnected);
});
