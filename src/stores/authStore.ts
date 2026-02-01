import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getCrashlytics, setUserId, setAttributes } from '@react-native-firebase/crashlytics';
import * as Clarity from '@microsoft/react-native-clarity';

import { authService } from '@/services/firebase/AuthService';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import { ToastType } from './toastStore';

interface AuthState {
  // State
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;

  // Actions
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (isLoading: boolean) => void;
  signIn: (
    email: string,
    password: string,
    showToast: (msg: string, type: ToastType) => void,
  ) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    showToast: (msg: string, type: ToastType) => void,
  ) => Promise<void>;
  signOut: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
  deleteAccount: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
  googleSignIn: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
  resetPassword: (
    email: string,
    showToast: (msg: string, type: ToastType) => void,
  ) => Promise<void>;
  signInAnonymously: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
  updateProfileName: (
    newName: string,
    showToast: (msg: string, type: ToastType) => void,
  ) => Promise<void>;
}

/**
 * Auth Store using Zustand
 * Replaces Context API with optimized state management
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    set => ({
      // Initial state
      user: null,
      isLoading: true,

      // Mutations
      setUser: user => {
        const crashlytics = getCrashlytics();
        if (user) {
          setUserId(crashlytics, user.uid || 'unknown');
          setAttributes(crashlytics, {
            user_name: user.displayName || '',
            user_email: user.email || '',
          });
          Clarity.setCustomUserId(user.uid || 'unknown');
          analyticsService.setUserId(user.uid || null);
        } else {
          setUserId(crashlytics, '');
          setAttributes(crashlytics, {
            user_name: '',
            user_email: '',
          });
          analyticsService.setUserId(null);
        }
        set({ user });
      },

      setLoading: isLoading => set({ isLoading }),

      // Actions
      signIn: async (email, password, showToast) => {
        try {
          await authService.signInWithEmail(email, password);
          await analyticsService.logLogin('email');
          showToast('Bienvenido de nuevo', 'success');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.signIn',
            method: 'email',
            errorMessage: err.message,
          });
          await analyticsService.logError('sign_in', { method: 'email' });
          showToast(err.message, 'error');
          throw e;
        }
      },

      signUp: async (email, password, showToast) => {
        try {
          await authService.signUpWithEmail(email, password);
          await analyticsService.logSignUp('email');
          showToast('Cuenta creada exitosamente', 'success');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.signUp',
            method: 'email',
            errorMessage: err.message,
          });
          await analyticsService.logError('sign_up', { method: 'email' });
          showToast(err.message, 'error');
          throw e;
        }
      },

      signOut: async showToast => {
        try {
          await authService.signOut();
          await analyticsService.logEvent(ANALYTICS_EVENTS.LOGOUT);
          showToast('Sesión cerrada', 'info');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.signOut',
            errorMessage: err.message,
          });
          await analyticsService.logError('logout');
          showToast(err.message, 'error');
          throw e;
        }
      },

      deleteAccount: async showToast => {
        try {
          await authService.deleteAccount();
          await analyticsService.logEvent(ANALYTICS_EVENTS.DELETE_ACCOUNT);
          showToast('Cuenta eliminada', 'success');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.deleteAccount',
            action: 'delete_account',
            errorMessage: err.message,
          });
          await analyticsService.logError('delete_account');
          showToast(err.message, 'error');
          throw e;
        }
      },

      googleSignIn: async showToast => {
        try {
          await authService.signInWithGoogle();
          await analyticsService.logLogin('google');
          showToast('Autenticado con Google', 'success');
        } catch (e) {
          const err = e as any;
          if (err.code === -5) {
            // SIGN_IN_CANCELLED
            return;
          }
          observabilityService.captureError(e, {
            context: 'authStore.googleSignIn',
            method: 'google',
            errorCode: err.code,
            errorMessage: err.message,
          });
          await analyticsService.logError('google_sign_in', {
            errorCode: err.code,
          });
          showToast(err.message, 'error');
          throw e;
        }
      },

      resetPassword: async (email, showToast) => {
        try {
          await authService.sendPasswordResetEmail(email);
          await analyticsService.logEvent(ANALYTICS_EVENTS.RESET_PASSWORD_REQUEST);
          showToast('Correo de recuperación enviado', 'success');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.resetPassword',
            action: 'password_reset',
            email: email,
            errorMessage: err.message,
          });
          await analyticsService.logError('reset_password');
          showToast(err.message, 'error');
          throw e;
        }
      },

      signInAnonymously: async showToast => {
        try {
          await authService.signInAnonymously();
          await analyticsService.logLogin('anonymous');
          showToast('Ingresaste como invitado', 'warning');
        } catch (e) {
          observabilityService.captureError(e, {
            context: 'authStore.signInAnonymously',
            method: 'anonymous',
            errorMessage: (e as Error).message,
          });
          await analyticsService.logError('anonymous_sign_in');
          showToast((e as Error).message, 'error');
          throw e;
        }
      },

      updateProfileName: async (newName, showToast) => {
        try {
          const updatedUser = await authService.updateProfileName(newName);
          set({ user: updatedUser });
          await analyticsService.logEvent(ANALYTICS_EVENTS.UPDATE_PROFILE_NAME);
          showToast('Perfil actualizado correctamente', 'success');
        } catch (e) {
          const err = e as any;
          observabilityService.captureError(e, {
            context: 'authStore.updateProfileName',
            action: 'update_profile',
            nameLength: newName.length,
            errorMessage: err.message,
          });
          await analyticsService.logError('update_profile_name');
          showToast(err.message, 'error');
          throw e;
        }
      },
    }),
    { name: 'AuthStore', enabled: __DEV__ },
  ),
);

// Initialize auth state listener
authService.onAuthStateChanged(authUser => {
  useAuthStore.getState().setUser(authUser);
  if (useAuthStore.getState().isLoading) {
    useAuthStore.getState().setLoading(false);
  }
});
