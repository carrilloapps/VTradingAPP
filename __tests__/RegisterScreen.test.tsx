import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import RegisterScreen from '../src/screens/auth/RegisterScreen';
import * as AuthStore from '../src/stores/authStore';
import * as ToastStore from '../src/stores/toastStore';

// Mock theme with spacing
const mockTheme = {
  ...MD3LightTheme,
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
  },
  colors: {
    ...MD3LightTheme.colors,
    trendUp: '#00C853',
    trendDown: '#D32F2F',
    skeleton: '#E0E0E0',
    skeletonHighlight: '#F5F5F5',
    success: '#4CAF50',
    successContainer: '#E8F5E9',
    info: '#2196F3',
    infoContainer: '#E3F2FD',
    neutral: '#9E9E9E',
    neutralContainer: '#F5F5F5',
    danger: '#D32F2F',
    warning: '#FFC107',
    buttonBorder: '#BDBDBD',
    exchangeCardBorder: '#E0E0E0',
  },
};

jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    logError: jest.fn(),
  },
  ANALYTICS_EVENTS: {
    SIGN_UP_ATTEMPT: 'sign_up_attempt',
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

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: () => null,
  BannerAdSize: {},
  TestIds: {},
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react');
  const MOCK_INITIAL_METRICS = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children(MOCK_INITIAL_METRICS.insets),
    SafeAreaInsetsContext: ReactMock.createContext(MOCK_INITIAL_METRICS.insets),
    useSafeAreaInsets: () => MOCK_INITIAL_METRICS.insets,
    useSafeAreaFrame: () => MOCK_INITIAL_METRICS.frame,
    initialWindowMetrics: MOCK_INITIAL_METRICS,
  };
});

describe('RegisterScreen', () => {
  const renderScreen = () =>
    render(
      <PaperProvider theme={mockTheme}>
        <RegisterScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
      </PaperProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ToastStore, 'useToastStore').mockImplementation((selector: any) => {
      const state = { showToast: jest.fn() };
      return selector ? selector(state) : state;
    });
  });

  it('muestra loading durante el registro', async () => {
    let resolveSignUp: () => void = () => {};
    const signUpPromise = new Promise<void>(resolve => {
      resolveSignUp = resolve;
    });

    const useAuthSpy = jest.spyOn(AuthStore, 'useAuthStore');
    useAuthSpy.mockReturnValue({
      signUp: jest.fn(() => signUpPromise),
      googleSignIn: jest.fn(),
      isLoading: false,
    } as any);

    const { getByLabelText, getByText, getByTestId, queryByTestId } = renderScreen();

    act(() => {
      fireEvent.changeText(getByLabelText('Correo electrónico'), 'test@example.com');
      fireEvent.changeText(getByLabelText('Contraseña'), '123456');
      fireEvent.changeText(getByLabelText('Confirmar contraseña'), '123456');
    });

    fireEvent.press(getByText('Registrarse'));

    await waitFor(() => {
      expect(getByTestId('auth-loading')).toBeTruthy();
    });

    resolveSignUp();

    await waitFor(() => {
      expect(queryByTestId('auth-loading')).toBeNull();
    });
  });
});
