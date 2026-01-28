import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authService } from '../services/firebase/AuthService';
import { getCrashlytics, setUserId, setAttributes } from '@react-native-firebase/crashlytics';
import * as Clarity from '@microsoft/react-native-clarity';
import { observabilityService } from '../services/ObservabilityService';
import { analyticsService } from '../services/firebase/AnalyticsService';
import { ToastType } from './toastStore';

interface AuthState {
    // State
    user: FirebaseAuthTypes.User | null;
    isLoading: boolean;

    // Actions
    setUser: (user: FirebaseAuthTypes.User | null) => void;
    setLoading: (isLoading: boolean) => void;
    signIn: (email: string, password: string, showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    signUp: (email: string, password: string, showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    signOut: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    deleteAccount: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    googleSignIn: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    resetPassword: (email: string, showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    signInAnonymously: (showToast: (msg: string, type: ToastType) => void) => Promise<void>;
    updateProfileName: (newName: string, showToast: (msg: string, type: ToastType) => void) => Promise<void>;
}

/**
 * Auth Store using Zustand
 * Replaces Context API with optimized state management
 */
export const useAuthStore = create<AuthState>()(
    devtools(
        (set, get) => ({
            // Initial state
            user: null,
            isLoading: true,

            // Mutations
            setUser: (user) => {
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

            setLoading: (isLoading) => set({ isLoading }),

            // Actions
            signIn: async (email, password, showToast) => {
                try {
                    await authService.signInWithEmail(email, password);
                    await analyticsService.logLogin('email');
                    showToast('Bienvenido de nuevo', 'success');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            signUp: async (email, password, showToast) => {
                try {
                    await authService.signUpWithEmail(email, password);
                    await analyticsService.logSignUp('email');
                    showToast('Cuenta creada exitosamente', 'success');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            signOut: async (showToast) => {
                try {
                    await authService.signOut();
                    await analyticsService.logEvent('logout');
                    showToast('Sesión cerrada', 'info');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            deleteAccount: async (showToast) => {
                try {
                    await authService.deleteAccount();
                    await analyticsService.logEvent('delete_account');
                    showToast('Cuenta eliminada', 'success');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            googleSignIn: async (showToast) => {
                try {
                    await authService.signInWithGoogle();
                    await analyticsService.logLogin('google');
                    showToast('Autenticado con Google', 'success');
                } catch (e: any) {
                    if (e.code === -5) { // SIGN_IN_CANCELLED
                        return;
                    }
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            resetPassword: async (email, showToast) => {
                try {
                    await authService.sendPasswordResetEmail(email);
                    await analyticsService.logEvent('reset_password_request');
                    showToast('Correo de recuperación enviado', 'success');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            signInAnonymously: async (showToast) => {
                try {
                    await authService.signInAnonymously();
                    await analyticsService.logLogin('anonymous');
                    showToast('Ingresaste como invitado', 'warning');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },

            updateProfileName: async (newName, showToast) => {
                try {
                    const updatedUser = await authService.updateProfileName(newName);
                    set({ user: updatedUser });
                    await analyticsService.logEvent('update_profile_name');
                    showToast('Perfil actualizado correctamente', 'success');
                } catch (e: any) {
                    observabilityService.captureError(e);
                    showToast(e.message, 'error');
                    throw e;
                }
            },
        }),
        { name: 'AuthStore' }
    )
);

// Initialize auth state listener
authService.onAuthStateChanged((authUser) => {
    useAuthStore.getState().setUser(authUser);
    if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
    }
});
