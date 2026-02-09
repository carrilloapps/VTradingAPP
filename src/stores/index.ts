// Re-export Zustand stores for backward compatibility
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';
import { useFilterStore } from './filterStore';
import { useNetworkStore } from './networkStore';

export { useAuthStore, useToastStore, useFilterStore, useNetworkStore };

// Convenience hooks for accessing store values
export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const isGuest = useAuthStore(state => state.isGuest);
  const isPremium = useAuthStore(state => state.isPremium);
  const actions = useAuthStore(state => ({
    signIn: state.signIn,
    signUp: state.signUp,
    signOut: state.signOut,
    deleteAccount: state.deleteAccount,
    googleSignIn: state.googleSignIn,
    resetPassword: state.resetPassword,
    updateProfileName: state.updateProfileName,
  }));
  return { user, isLoading, isGuest, isPremium, ...actions };
};

export const useToast = () => {
  const showToast = useToastStore(state => state.showToast);
  return { showToast };
};

export const useNetwork = () => {
  const isConnected = useNetworkStore(state => state.isConnected);
  return { isConnected };
};
