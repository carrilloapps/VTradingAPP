import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import ForgotPasswordScreen from '../src/screens/auth/ForgotPasswordScreen';
import * as AuthContext from '../src/context/AuthContext';

jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
  },
}));

describe('ForgotPasswordScreen', () => {
  const renderScreen = () =>
    render(
      <PaperProvider>
        <ForgotPasswordScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
      </PaperProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra loading durante la recuperación', async () => {
    let resolveReset: () => void = () => {};
    const resetPromise = new Promise<void>((resolve) => {
      resolveReset = resolve;
    });

    const useAuthSpy = jest.spyOn(AuthContext, 'useAuth');
    useAuthSpy.mockReturnValue({
      resetPassword: jest.fn(() => resetPromise),
    } as any);

    const { getByLabelText, getByText, getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByLabelText('Correo electrónico'), 'test@example.com');
    fireEvent.press(getByText('Enviar Enlace'));

    await waitFor(() => {
      expect(getByTestId('auth-skeleton')).toBeTruthy();
    });

    resolveReset();

    await waitFor(() => {
      expect(queryByTestId('auth-skeleton')).toBeNull();
    });
  });
});
