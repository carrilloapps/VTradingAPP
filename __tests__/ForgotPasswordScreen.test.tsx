import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import ForgotPasswordScreen from '../src/screens/auth/ForgotPasswordScreen';
import * as AuthContext from '../src/context/AuthContext';

const mockTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#ffffff',
    onSurface: '#000000',
    onSurfaceVariant: '#666666',
    primary: '#6200ee',
  },
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 },
  roundness: 4,
};

jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
  },
}));

jest.mock('../src/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

describe('ForgotPasswordScreen', () => {
  const renderScreen = () =>
    render(
      <PaperProvider theme={mockTheme}>
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
      isLoading: false,
    } as any);

    const { getByLabelText, getByText, getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByLabelText('Correo electrónico'), 'test@example.com');
    fireEvent.press(getByText('Enviar enlace'));

    await waitFor(() => {
      expect(getByTestId('auth-loading')).toBeTruthy();
    });

    resolveReset();

    await waitFor(() => {
      expect(queryByTestId('auth-loading')).toBeNull();
    });
  });
});
