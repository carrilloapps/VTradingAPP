import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

class AuthService {
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
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
      try {
          await auth().sendPasswordResetEmail(email);
      } catch (error) {
          console.error('Error sending password reset email:', error);
          throw error;
      }
  }
}

export const authService = new AuthService();
