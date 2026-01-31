import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  FirebaseAuthTypes,
  sendPasswordResetEmail
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AppConfig } from '../../constants/AppConfig';
import { observabilityService } from '../ObservabilityService';
import SafeLogger from '../../utils/safeLogger';

class AuthService {
  private googleWebClientId: string | null;

  constructor() {
    this.googleWebClientId = AppConfig.GOOGLE_WEB_CLIENT_ID?.trim() || null;
    GoogleSignin.configure({
      webClientId: this.googleWebClientId || undefined,
    });
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    return onAuthStateChanged(getAuth(), callback);
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return getAuth().currentUser;
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.signInWithEmail',
        action: 'auth_email_signin',
      });
      throw this.handleError(e);
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await createUserWithEmailAndPassword(getAuth(), email, password);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.signUpWithEmail',
        action: 'auth_email_signup',
      });
      throw this.handleError(e);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential | null> {
    try {
      // Check if Google Play Services is available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      // Validate sign-in result
      if (!signInResult || !signInResult.data) {
        SafeLogger.error('[Auth] Google Sign-In returned invalid result', {
          hasResult: !!signInResult,
          hasData: !!signInResult?.data,
        });
        throw new Error('Google Sign-In was cancelled or returned invalid data. Please try again.');
      }

      const idToken = signInResult.data?.idToken;

      // Validate ID token exists
      if (!idToken) {
        // Log additional context for debugging
        SafeLogger.error('[Auth] No ID token in sign-in result', {
          hasData: !!signInResult.data,
          dataKeys: signInResult.data ? Object.keys(signInResult.data) : [],
        });

        // Capture error with context for investigation
        observabilityService.captureError(
          new Error('No ID token found in Google Sign-In result'),
          {
            context: 'AuthService_signInWithGoogle',
            errorType: 'missing_id_token',
            hasSignInResult: !!signInResult,
            hasData: !!signInResult?.data,
          }
        );

        throw new Error('No se pudo obtener el token de autenticación de Google. Por favor, intenta nuevamente.');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await signInWithCredential(getAuth(), googleCredential);
    } catch (e: any) {
      // Check if user cancelled the sign-in
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        SafeLogger.log('[Auth] User cancelled Google Sign-In');
        throw new Error('USER_CANCELLED_LOGIN');
      } else if (e.code === statusCodes.IN_PROGRESS) {
        SafeLogger.log('[Auth] Google Sign-In already in progress');
        throw new Error('SIGN_IN_IN_PROGRESS');
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Report Play Services errors as they indicate device issues
        observabilityService.captureError(e, {
          context: 'AuthService_signInWithGoogle',
          errorType: 'play_services_unavailable',
        });
        throw new Error('Google Play Services no está disponible o está desactualizado');
      } else {
        // Report unexpected errors with context
        const isIdTokenError = e.message?.includes('No ID token') ||
          e.message?.includes('No se pudo obtener el token');

        if (!isIdTokenError) {
          // Only report if not already reported above
          observabilityService.captureError(e, {
            context: 'AuthService_signInWithGoogle',
            errorType: 'sign_in_failed',
          });
        }

        throw this.handleError(e);
      }
    }
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await signInAnonymously(getAuth());
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.signInAnonymously',
        action: 'auth_anonymous_signin'
      });
      throw this.handleError(e);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        // If signed in with Google, sign out from Google as well
        const isGoogleUser = currentUser.providerData.some(
          provider => provider.providerId === 'google.com'
        );

        if (isGoogleUser) {
          try {
            await GoogleSignin.signOut();
          } catch (googleError) {
            // Ignore Google sign out errors
            observabilityService.captureError(googleError, {
              context: 'AuthService.signOut.googleSignOut',
              action: 'google_signout_failed'
            });
          }
        }
      }

      await signOut(getAuth());
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.signOut',
        action: 'auth_signout'
      });
      throw this.handleError(e);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      await currentUser.delete();
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.deleteAccount',
        action: 'auth_delete_account'
      });
      throw this.handleError(e);
    }
  }

  async updateProfileName(displayName: string): Promise<FirebaseAuthTypes.User> {
    try {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        throw new Error('El nombre no puede estar vacío');
      }
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      await currentUser.updateProfile({ displayName: trimmedName });
      await currentUser.reload();
      const updatedUser = getAuth().currentUser;
      if (!updatedUser) {
        throw new Error('Usuario no autenticado');
      }
      return updatedUser;
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.updateProfileName',
        action: 'auth_update_profile',
        nameLength: displayName.length
      });
      throw this.handleError(e);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuth(), email);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AuthService.sendPasswordResetEmail',
        action: 'auth_password_reset',
      });
      throw this.handleError(e);
    }
  }

  private handleError(error: any): Error {
    let message = 'Ocurrió un error inesperado';
    if (error.code) {
      switch (error.code) {
        // Registro y Email
        case 'auth/email-already-in-use':
          message = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
          break;
        case 'auth/invalid-email':
          message = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/operation-not-allowed':
          message = 'El método de autenticación no está habilitado.';
          break;
        case 'auth/weak-password':
          message = 'La contraseña es muy débil. Usa al menos 6 caracteres con letras y números.';
          break;

        // Inicio de Sesión
        case 'auth/user-disabled':
          message = 'Esta cuenta ha sido deshabilitada. Contacta al soporte.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Correo o contraseña incorrectos.';
          break;
        case 'auth/too-many-requests':
          message = 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por seguridad. Intenta más tarde.';
          break;
        case 'auth/user-token-expired':
          message = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
          break;

        // Google Sign-In y Credenciales
        case 'auth/account-exists-with-different-credential':
          message = 'Ya existe una cuenta vinculada a este correo con otro método de inicio de sesión.';
          break;
        case 'auth/credential-already-in-use':
          message = 'Esta credencial ya está vinculada a otro usuario.';
          break;

        // Acciones de Usuario
        case 'auth/requires-recent-login':
          message = 'Por seguridad, debes haber iniciado sesión recientemente para realizar esta acción. Vuelve a ingresar.';
          break;
        case 'auth/no-current-user':
          message = 'No se encontró una sesión activa.';
          break;

        // Red y Errores Generales
        case 'auth/network-request-failed':
          message = 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
          break;
        case 'auth/internal-error':
          message = 'Error interno del servidor. Intenta de nuevo en unos minutos.';
          break;
        case 'auth/timeout':
          message = 'La operación ha tardado demasiado. Reintenta de nuevo.';
          break;

        // Google Sign-In específico (si el error viene con estos códigos)
        case 'SIGN_IN_CANCELLED':
          message = 'Inicio de sesión cancelado.';
          break;
        case 'PLAY_SERVICES_NOT_AVAILABLE':
          message = 'Los servicios de Google Play no están disponibles o están desactualizados.';
          break;

        default:
          // Si es un error de Firebase pero no mapeado, intentamos usar el mensaje técnico si es legible
          message = error.message || message;
      }
    } else if (error.message) {
      message = error.message;
    }
    return new Error(message);
  }
}

export const authService = new AuthService();
