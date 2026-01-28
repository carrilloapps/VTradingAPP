// Re-export Zustand stores for backward compatibility
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';
import { useFilterStore } from './filterStore';
import { useNetworkStore } from './networkStore';

export { useAuthStore, useToastStore, useFilterStore, useNetworkStore };

// Convenience hooks for accessing store values
export const useAuth = () => {
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const actions = useAuthStore((state) => ({
        signIn: state.signIn,
        signUp: state.signUp,
        signOut: state.signOut,
        deleteAccount: state.deleteAccount,
        googleSignIn: state.googleSignIn,
        resetPassword: state.resetPassword,
        signInAnonymously: state.signInAnonymously,
        updateProfileName: state.updateProfileName,
    }));
    return { user, isLoading, ...actions };
};

export const useToast = () => {
    const showToast = useToastStore((state) => state.showToast);
    return { showToast };
};

export const useFilters = () => {
    const selectedFilter = useFilterStore((state) => state.selectedFilter);
    const setFilter = useFilterStore((state) => state.setFilter);
    return {
        stockFilters: { category: selectedFilter, query: '' },
        setStockFilters: (filters: { category?: string; query?: string }) => {
            if (filters.category) setFilter(filters.category as any);
        },
    };
};

export const useNetwork = () => {
    const isConnected = useNetworkStore((state) => state.isConnected);
    return { isConnected };
};
