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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppConfig } from '../../constants/AppConfig';

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
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await createUserWithEmailAndPassword(getAuth(), email, password);
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      if (!this.googleWebClientId) {
        throw new Error('Google Sign-In no está configurado. Actualiza AppConfig.GOOGLE_WEB_CLIENT_ID con el Web Client ID de Firebase.');
      }
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await signInWithCredential(getAuth(), googleCredential);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await signInAnonymously(getAuth());
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Google as well if signed in
      const currentUser = getAuth().currentUser;
      if (currentUser?.providerData.some(p => p.providerId === 'google.com')) {
          try {
             await GoogleSignin.signOut();
          } catch (e) {
             console.warn("Google sign out error", e);
          }
      }
      await signOut(getAuth());
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw this.handleError(error);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      await currentUser.delete();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw this.handleError(error);
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
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuth(), email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw this.handleError(error);
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
