import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

class AuthService {
  constructor() {
    GoogleSignin.configure({
      // Reemplaza con tu Web Client ID de la consola de Firebase -> Autenticación -> Sign-in method -> Google
      webClientId: 'YOUR_WEB_CLIENT_ID', 
    });
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await auth().signInWithEmailAndPassword(email, password);
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
      return await auth().createUserWithEmailAndPassword(email, password);
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
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await auth().signInWithCredential(googleCredential);
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
      return await auth().signInAnonymously();
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
      const currentUser = auth().currentUser;
      if (currentUser?.providerData.some(p => p.providerId === 'google.com')) {
          try {
             await GoogleSignin.signOut();
          } catch (e) {
             console.warn("Google sign out error", e);
          }
      }
      await auth().signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    let message = 'Ocurrió un error inesperado';
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'El correo electrónico ya está en uso.';
                break;
            case 'auth/invalid-email':
                message = 'El correo electrónico no es válido.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Operación no permitida.';
                break;
            case 'auth/weak-password':
                message = 'La contraseña es muy débil.';
                break;
            case 'auth/user-disabled':
                message = 'El usuario ha sido deshabilitado.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                message = 'Credenciales inválidas.';
                break;
            case 'auth/too-many-requests':
                message = 'Demasiados intentos fallidos. Intente más tarde.';
                break;
             case 'auth/network-request-failed':
                message = 'Error de conexión. Verifique su internet.';
                break;
            default:
                message = error.message || message;
        }
    } else if (error.message) {
        message = error.message;
    }
    return new Error(message);
  }
}

export const authService = new AuthService();
