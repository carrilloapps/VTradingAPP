import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Carlos', email: 'carlos@test.com', isAnonymous: false },
  }),
}));

// Mock ToastContext
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Mock CurrencyService
jest.mock('../src/components/dashboard/DashboardSkeleton', () => 'DashboardSkeleton');

jest.mock('../src/services/CurrencyService', () => ({
  CurrencyService: {
    getRates: jest.fn(() => Promise.resolve([
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
        value: 2345901.00,
        changePercent: 2.45,
        type: 'crypto',
        iconName: 'currency-bitcoin',
        lastUpdated: new Date().toISOString(),
      }
    ])),
    subscribe: jest.fn((callback) => {
        // Immediately callback with data to simulate load
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
            value: 37.00,
            changePercent: 0.05,
            type: 'crypto',
            iconName: 'attach-money',
            lastUpdated: new Date().toISOString(),
          }
        ]);
        return () => {};
    }),
  },
}));

// Helper to wrap component with necessary providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <NavigationContainer>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </NavigationContainer>
  );
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
  });

  it('renders calculator section', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Calculadora Rápida')).toBeTruthy();
    });
  });
});
