import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import ForgotPasswordScreen from '../src/screens/auth/ForgotPasswordScreen';
import * as AuthStore from '../src/stores/authStore';
import * as ToastStore from '../src/stores/toastStore';

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
    logError: jest.fn(),
  },
  ANALYTICS_EVENTS: {
    PASSWORD_RESET_ATTEMPT: 'password_reset_attempt',
  },
}));

jest.mock('../src/components/auth/AuthLoading', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={props.testID || 'auth-loading'} />;
});

jest.mock('../src/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

describe('ForgotPasswordScreen', () => {
  const renderScreen = () =>
    render(
      <PaperProvider theme={mockTheme}>
        <ForgotPasswordScreen
          navigation={{ goBack: jest.fn(), navigate: jest.fn() }}
        />
      </PaperProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(ToastStore, 'useToastStore')
      .mockImplementation((selector: any) => {
        const state = { showToast: jest.fn() };
        return selector ? selector(state) : state;
      });
  });

  it('muestra loading durante la recuperación', async () => {
    let resolveReset: () => void = () => {};
    const resetPromise = new Promise<void>(resolve => {
      resolveReset = resolve;
    });

    const useAuthSpy = jest.spyOn(AuthStore, 'useAuthStore');
    useAuthSpy.mockReturnValue({
      resetPassword: jest.fn(() => resetPromise),
      isLoading: false,
    } as any);

    const { getByLabelText, getByTestId, queryByTestId, findByTestId } =
      renderScreen();

    act(() => {
      fireEvent.changeText(
        getByLabelText('Correo electrónico'),
        'test@example.com',
      );
    });

    fireEvent.press(getByTestId('forgot-password-submit'));

    expect(await findByTestId('auth-loading')).toBeTruthy();

    await act(async () => {
      resolveReset();
    });

    await waitFor(() => {
      expect(queryByTestId('auth-loading')).toBeNull();
    });
  });
});
