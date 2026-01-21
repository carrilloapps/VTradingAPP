import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import RegisterScreen from '../src/screens/auth/RegisterScreen';
import * as AuthContext from '../src/context/AuthContext';

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
  },
}));

describe('RegisterScreen', () => {
  const renderScreen = () =>
    render(
      <PaperProvider>
        <RegisterScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
      </PaperProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra loading durante el registro', async () => {
    let resolveSignUp: () => void = () => {};
    const signUpPromise = new Promise<void>((resolve) => {
      resolveSignUp = resolve;
    });

    const useAuthSpy = jest.spyOn(AuthContext, 'useAuth');
    useAuthSpy.mockReturnValue({
      signUp: jest.fn(() => signUpPromise),
      googleSignIn: jest.fn(),
      isLoading: false,
    } as any);

    const { getByLabelText, getByText, queryByText } = renderScreen();

    fireEvent.changeText(getByLabelText('Correo electrónico'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Contraseña'), '123456');
    fireEvent.changeText(getByLabelText('Confirmar contraseña'), '123456');

    fireEvent.press(getByText('Registrarse'));

    await waitFor(() => {
      expect(getByText('Cargando')).toBeTruthy();
    });

    resolveSignUp();

    await waitFor(() => {
      expect(queryByText('Cargando')).toBeNull();
    });
  });
});
