import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getCrashlytics, setUserId, setAttributes } from '@react-native-firebase/crashlytics';
import * as Clarity from '@microsoft/react-native-clarity';
import * as Sentry from '@sentry/react-native';

import { authService } from '@/services/firebase/AuthService';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import { storageService } from '@/services/StorageService';
import { anonymousIdentityService } from '@/services/AnonymousIdentityService';
import SafeLogger from '@/utils/safeLogger';
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
          // ════════════════════════════════════════════════════
          // FASE 1: CAPTURAR UUID PREVIO
          // ════════════════════════════════════════════════════

          const previousAnonymousId = storageService.getString('anonymous_user_id');
          const hasAnonymousHistory = previousAnonymousId?.startsWith('anon_');

          SafeLogger.info('[Auth] Setting user:', {
            uid: user.uid,
            email: user.email,
            hasAnonymousHistory,
            previousAnonymousId: previousAnonymousId?.substring(0, 25) + '...',
          });

          // ════════════════════════════════════════════════════
          // FASE 2: PROCESO DE MIGRACIÓN
          // ════════════════════════════════════════════════════

          if (hasAnonymousHistory) {
            SafeLogger.info('[Auth] 🔄 Initiating UUID → Firebase UID migration');

            const loginMethod = user.providerData[0]?.providerId || 'unknown';
            const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

            // 2.1 Firebase Analytics - User Properties
            analyticsService.setUserProperty('original_anonymous_id', previousAnonymousId!);
            analyticsService.setUserProperty('account_linked_at', new Date().toISOString());
            analyticsService.setUserProperty('conversion_method', loginMethod.replace('.com', ''));

            // 2.2 Firebase Analytics - Evento de Conversión
            analyticsService.logEvent('user_account_linked', {
              method: loginMethod.replace('.com', ''),
              previous_anonymous_id: previousAnonymousId!,
              firebase_uid: user.uid,
              is_new_user: isNewUser,
              timestamp: Date.now(),
            });

            SafeLogger.info('[Auth] ✅ Conversion event logged:', {
              method: loginMethod,
              isNewUser,
            });

            // 2.3 Crashlytics - Atributos personalizados
            setAttributes(crashlytics, {
              original_anonymous_id: previousAnonymousId!,
              conversion_method: loginMethod,
            });

            // 2.4 Clarity - Tag personalizado
            Clarity.setCustomTag('prev_anon_id', previousAnonymousId!);

            // 2.5 Sentry - Contexto de usuario
            Sentry.setUser({
              id: user.uid,
              email: user.email || undefined,
              username: user.displayName || undefined,
              anonymous_id_legacy: previousAnonymousId!,
            });

            // 2.6 Guardar mapeo en MMKV (para debugging)
            try {
              const mapping = {
                uuid: previousAnonymousId,
                firebaseUid: user.uid,
                linkedAt: Date.now(),
                loginMethod,
                isNewUser,
              };
              storageService.setString('uuid_to_firebase_map', JSON.stringify(mapping));

              SafeLogger.info('[Auth] 💾 Migration mapping saved');
            } catch (error) {
              SafeLogger.error('[Auth] Failed to save mapping:', error);
            }
          }

          // ════════════════════════════════════════════════════
          // FASE 3: ACTUALIZAR userId EN TODOS LOS SERVICIOS
          // ════════════════════════════════════════════════════

          // Firebase Analytics
          analyticsService.setUserId(user.uid || null);

          // Crashlytics
          setUserId(crashlytics, user.uid || 'unknown');
          setAttributes(crashlytics, {
            user_name: user.displayName || '',
            user_email: user.email || '',
            provider: user.providerData[0]?.providerId || '',
          });

          // Clarity
          Clarity.setCustomUserId(user.uid || 'unknown');

          // Sentry (si no se hizo en migración)
          if (!hasAnonymousHistory) {
            Sentry.setUser({
              id: user.uid,
              email: user.email || undefined,
              username: user.displayName || undefined,
            });
          }

          SafeLogger.info('[Auth] ✅ User ID updated in all analytics services');
        } else {
          // ════════════════════════════════════════════════════
          // LOGOUT: Limpiar servicios y regenerar UUID
          // ════════════════════════════════════════════════════

          SafeLogger.info('[Auth] 🚪 User logout - clearing data');

          // Limpiar servicios
          setUserId(crashlytics, '');
          setAttributes(crashlytics, { user_name: '', user_email: '' });
          analyticsService.setUserId(null);
          Sentry.setUser(null);

          // Regenerar UUID anónimo
          const newAnonymousId = anonymousIdentityService.resetAnonymousId();

          // Configurar nuevo UUID en servicios
          analyticsService.setUserId(newAnonymousId);
          Clarity.setCustomUserId(newAnonymousId);

          SafeLogger.info('[Auth] ✅ New anonymous session started:', newAnonymousId);
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
