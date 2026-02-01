import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
// NavigationContainer removed as it was unused

jest.mock('react-native-paper', () => {
  const Actual = jest.requireActual('react-native-paper');
  const theme = {
    ...Actual.MD3LightTheme,
    colors: {
      ...Actual.MD3LightTheme.colors,
      background: '#ffffff',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
      primary: '#6200ee',
      inversePrimary: '#b39ddb',
      outline: '#cccccc',
      elevation: {
        level1: '#f5f5f5',
      },
    },
    spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 },
    roundness: 4,
    dark: false,
  };
  return {
    ...Actual,
    useTheme: () => theme,
  };
});

const mockTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#ffffff',
    onSurface: '#000000',
    onSurfaceVariant: '#666666',
    primary: '#6200ee',
    inversePrimary: '#b39ddb',
    outline: '#cccccc',
    elevation: {
      level1: '#f5f5f5',
    },
  },
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 },
  roundness: 4,
  dark: false,
};

// Mock Auth Store (respect selector signature to keep referential stability)
jest.mock('../src/stores/authStore', () => {
  const user = {
    displayName: 'Carlos',
    email: 'carlos@test.com',
    isAnonymous: false,
  };
  return {
    useAuthStore: (selector?: (state: any) => any) => (selector ? selector({ user }) : { user }),
  };
});

// Mock Toast Store (respect selector and return stable functions)
const mockShowToast = jest.fn();
const mockHideToast = jest.fn();
jest.mock('../src/stores/toastStore', () => {
  const state = {
    showToast: mockShowToast,
    toasts: [],
    hideToast: mockHideToast,
  };
  return {
    useToastStore: (selector?: (state: typeof state) => any) =>
      selector ? selector(state) : state,
  };
});

// Mock CurrencyService
jest.mock('../src/components/dashboard/DashboardSkeleton', () => 'DashboardSkeleton');

jest.mock('../src/services/StocksService', () => ({
  StocksService: {
    getStocks: jest.fn(() => Promise.resolve([])),
    subscribe: jest.fn(callback => {
      callback([]);
      return () => {};
    }),
    isMarketOpen: jest.fn(() => true),
  },
}));

jest.mock('../src/components/dashboard/Calculator', () => {
  const { View, Text } = require('react-native');
  return () => (
    <View>
      <Text>Calculadora Rápida</Text>
    </View>
  );
});

jest.mock('../src/components/dashboard/ShareGraphic', () => 'ShareGraphic');
jest.mock('../src/components/ui/MarketStatus', () => {
  const { View, Text } = require('react-native');
  return () => (
    <View>
      <Text>MERCADO ABIERTO</Text>
    </View>
  );
});
jest.mock('../src/components/dashboard/ExchangeCard', () => {
  const { View, Text } = require('react-native');
  return ({ title }: { title: string }) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});
jest.mock('../src/components/stocks/StockItem', () => 'StockItem');
jest.mock('../src/components/ui/UnifiedHeader', () => {
  const { View, Text } = require('react-native');
  return ({ userName }: { userName: string }) => (
    <View>
      <Text>Hola, {userName}</Text>
    </View>
  );
});

jest.mock('../src/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    logShare: jest.fn(),
  },
}));

jest.mock('../src/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('../src/services/CurrencyService', () => ({
  CurrencyService: {
    getRates: jest.fn(() =>
      Promise.resolve([
        {
          id: '1',
          code: 'USD',
          name: 'Dólar Estadounidense (BCV)',
          value: 36.58,
          changePercent: 0.14,
          type: 'fiat',
          iconName: 'account-balance',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '4',
          code: 'BTC',
          name: 'Bitcoin',
          value: 2345901.0,
          changePercent: 2.45,
          type: 'crypto',
          iconName: 'currency-bitcoin',
          lastUpdated: new Date().toISOString(),
        },
      ]),
    ),
    getAvailableTargetRates: jest.fn(() => []), // Add this for AdvancedCalculatorScreen
    subscribe: jest.fn(callback => {
      // Use setTimeout to break the synchronous loop and avoid maximum update depth exceeded
      setTimeout(() => {
        callback([
          {
            id: '1',
            code: 'USD',
            name: 'Dólar BCV',
            value: 36.58,
            changePercent: 0.14,
            type: 'fiat',
            iconName: 'account-balance',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: '2',
            code: 'USDT',
            name: 'Tether',
            value: 37.0,
            changePercent: 0.05,
            type: 'crypto',
            iconName: 'attach-money',
            lastUpdated: new Date().toISOString(),
          },
        ]);
      }, 0);
      return () => {};
    }),
  },
}));

// Helper to wrap component with necessary providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(<PaperProvider theme={mockTheme}>{component}</PaperProvider>);
};

describe('HomeScreen', () => {
  it('renders correctly with user greeting', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(getByText(/Hola, Carlos/i)).toBeTruthy();
    });
  });

  it('renders market status', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('MERCADO ABIERTO')).toBeTruthy();
    });
  });

  it('renders exchange cards', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Dólar BCV')).toBeTruthy();
      expect(getByText('Tether')).toBeTruthy();
    });

    // Verify ExchangeCard props (mocked)
    // You might need to check if the correct icon name is passed
    // expect(screen.getByTestId('exchange-card-USD')).toHaveProp('iconName', 'currency-usd');
  });

  it('renders calculator section', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Calculadora Rápida')).toBeTruthy();
    });
  });
});
