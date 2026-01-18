import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { Button, Text, View } from 'react-native';
import { ToastProvider } from '../../src/context/ToastContext';
import { authService } from '../../src/services/firebase/AuthService';

// Mock AuthService methods
const mockSignIn = jest.spyOn(authService, 'signInWithEmail').mockResolvedValue({} as any);
const mockSignOut = jest.spyOn(authService, 'signOut').mockResolvedValue();
const mockOnAuthStateChanged = jest.spyOn(authService, 'onAuthStateChanged');

const TestComponent = () => {
  const { user, signIn, signOut, isLoading } = useAuth();
  
  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text testID="user-email">{user ? user.email : 'No User'}</Text>
      <Button title="Login" onPress={() => signIn('test@test.com', '123456')} />
      <Button title="Logout" onPress={signOut} />
    </View>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user email when authenticated', async () => {
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback({ email: 'test@example.com' } as any);
      return () => {};
    });

    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(queryByText('Loading...')).toBeNull();
    });

    expect(getByTestId('user-email').props.children).toBe('test@example.com');
  });

  it('handles login interaction', async () => {
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null); // Initially no user
      return () => {};
    });

    const { getByText } = render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
       expect(getByText('Login')).toBeTruthy();
    });

    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', '123456');
    });
  });

  it('handles logout interaction', async () => {
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback({ email: 'test@example.com' } as any); 
        return () => {};
      });
  
      const { getByText } = render(
        <ToastProvider>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </ToastProvider>
      );
  
      await waitFor(() => {
         expect(getByText('Logout')).toBeTruthy();
      });
  
      fireEvent.press(getByText('Logout'));
  
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
});
