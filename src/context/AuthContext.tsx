import React, { createContext, useState, useEffect, useContext } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authService } from '../services/firebase/AuthService';
import { useToast } from './ToastContext';
import { getCrashlytics, setUserId, setAttributes } from '@react-native-firebase/crashlytics';
import * as Clarity from '@microsoft/react-native-clarity';
import { observabilityService } from '../services/ObservabilityService';

interface AuthContextData {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (isLoading) setIsLoading(false);
    });
    return unsubscribe;
  }, [isLoading]);

  useEffect(() => {
    const crashlytics = getCrashlytics();
    if (user) {
      setUserId(crashlytics, user.uid || 'unknown');
      setAttributes(crashlytics, {
        user_name: user.displayName || '',
        user_email: user.email || '',
      });
      // Identificar usuario en Clarity para repetición de sesiones
      Clarity.setCustomUserId(user.uid || 'unknown');
    } else {
      setUserId(crashlytics, '');
      setAttributes(crashlytics, {
        user_name: '',
        user_email: '',
      });
    }
  }, [user]);

  const signIn = async (email: string, pass: string) => {
    try {
      await authService.signInWithEmail(email, pass);
      showToast('Bienvenido de nuevo', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const signUp = async (email: string, pass: string) => {
    try {
      await authService.signUpWithEmail(email, pass);
      showToast('Cuenta creada exitosamente', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      showToast('Sesión cerrada', 'info');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const deleteAccount = async () => {
    try {
      await authService.deleteAccount();
      showToast('Cuenta eliminada', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const googleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
      showToast('Autenticado con Google', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      if (e.code === -5) { // SIGN_IN_CANCELLED
         return;
      }
      showToast(e.message, 'error');
      throw e;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.sendPasswordResetEmail(email);
      showToast('Correo de recuperación enviado', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const signInAnonymously = async () => {
    try {
      await authService.signInAnonymously();
      showToast('Ingresaste como invitado', 'warning');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  const updateProfileName = async (newName: string) => {
    try {
      const updatedUser = await authService.updateProfileName(newName);
      setUser(updatedUser);
      showToast('Perfil actualizado correctamente', 'success');
    } catch (e: any) {
      observabilityService.captureError(e);
      showToast(e.message, 'error');
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      googleSignIn,
      resetPassword,
      signInAnonymously,
      updateProfileName,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
