import React, { createContext, useState, useEffect, useContext } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authService } from '../services/firebase/AuthService';
import { useToast } from './ToastContext';
import { getCrashlytics, setUserId, setAttributes } from '@react-native-firebase/crashlytics';

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
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const signUp = async (email: string, pass: string) => {
    try {
      await authService.signUpWithEmail(email, pass);
      showToast('Cuenta creada exitosamente', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      showToast('Sesión cerrada', 'info');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await authService.deleteAccount();
      showToast('Cuenta eliminada', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
      showToast('Autenticado con Google', 'success');
    } catch (error: any) {
      if (error.code === -5) { // SIGN_IN_CANCELLED
         return;
      }
      showToast(error.message, 'error');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.sendPasswordResetEmail(email);
      showToast('Correo de recuperación enviado', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      await authService.signInAnonymously();
      showToast('Ingresaste como invitado', 'warning');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const updateProfileName = async (newName: string) => {
    try {
      const updatedUser = await authService.updateProfileName(newName);
      setUser(updatedUser);
      showToast('Perfil actualizado correctamente', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      throw error;
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
