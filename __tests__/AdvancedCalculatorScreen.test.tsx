import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AdvancedCalculatorScreen from '../src/screens/AdvancedCalculatorScreen';
import { Provider as PaperProvider } from 'react-native-paper';

// --- Mocks ---

// Mock Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock SafeAreaContext
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

// Mock Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock CurrencyService
const mockRates = [
  { code: 'USD', value: 1, name: 'Dollar', iconName: 'attach-money' },
  { code: 'VES', value: 36.5, name: 'Bolivar', iconName: 'attach-money' },
  { code: 'EUR', value: 1.1, name: 'Euro', iconName: 'euro' },
  { code: 'USDT', value: 1.01, name: 'Tether', iconName: 'attach-money' },
];

jest.mock('../src/services/CurrencyService', () => ({
  CurrencyService: {
    subscribe: jest.fn((callback) => {
      callback(mockRates);
      return () => {};
    }),
    getRates: jest.fn(() => Promise.resolve(mockRates)),
  },
}));

// Mock Toast
const mockShowToast = jest.fn();
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock UnifiedHeader
jest.mock('../src/components/ui/UnifiedHeader', () => {
  const { Text } = require('react-native');
  return ({ title }: any) => <Text>{title}</Text>;
});

// Mock BottomSheetModal
jest.mock('../src/components/ui/BottomSheetModal', () => {
    const { View, Text } = require('react-native');
    return {
        BottomSheetModal: ({ visible, children, title }: any) => visible ? (
            <View testID="bottom-sheet-modal">
                <Text>{title}</Text>
                {children}
            </View>
        ) : null
    };
});

describe('AdvancedCalculatorScreen', () => {
  const renderScreen = () => {
    return render(
      <PaperProvider>
        <AdvancedCalculatorScreen />
      </PaperProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    
    // Check Header
    expect(getByText('Calculadora')).toBeTruthy();
    
    // Check Initial State
    expect(getByText('MONEDA BASE')).toBeTruthy();
    expect(getByText('USD')).toBeTruthy(); // Default base
    expect(getByPlaceholderText('0')).toBeTruthy();
    
    // Check Target List (initial targets)
    expect(getByText('VES')).toBeTruthy();
    expect(getByText('EUR')).toBeTruthy();
  });

  it('handles keypad input correctly', async () => {
    const { getByText, getByDisplayValue, getByTestId } = renderScreen();
    
    // Clear initial '1'
    fireEvent.press(getByTestId('btn-backspace'));
    
    // Press 1, 2, 3
    fireEvent.press(getByText('1'));
    fireEvent.press(getByText('2'));
    fireEvent.press(getByText('3'));
    
    expect(getByDisplayValue('123')).toBeTruthy();
    
    // Press comma
    fireEvent.press(getByText(','));
    fireEvent.press(getByText('5'));
    
    expect(getByDisplayValue('123,5')).toBeTruthy();
  });

  it('prevents multiple commas', () => {
    const { getByText, getByDisplayValue, getByTestId } = renderScreen();
    
    // Clear initial '1'
    fireEvent.press(getByTestId('btn-backspace'));

    fireEvent.press(getByText('1'));
    fireEvent.press(getByText(','));
    fireEvent.press(getByText('5'));
    fireEvent.press(getByText(',')); // Should be ignored
    
    expect(getByDisplayValue('1,5')).toBeTruthy();
  });

  it('updates conversions when base amount changes', async () => {
    const { getByText, getByTestId } = renderScreen();
    
    // 1 USD = 36.5 VES
    // We expect to see 36,50 (or similar formatting)
    // Using regex to be locale-agnostic or flexible
    await waitFor(() => {
       expect(getByText(/36[,.]50/)).toBeTruthy();
    });
    
    // Change input to 10
    // Clear first
    fireEvent.press(getByTestId('btn-backspace'));
    
    fireEvent.press(getByText('1'));
    fireEvent.press(getByText('0'));
    
    // 10 USD = 365.0 VES
    await waitFor(() => {
        expect(getByText(/365[,.]00/)).toBeTruthy();
    });
  });

  it('opens picker and allows adding currency', async () => {
    const { getByText, getByTestId } = renderScreen();
    
    // Open picker
    fireEvent.press(getByText('AÑADIR OTRA DIVISA'));
    
    await waitFor(() => {
        expect(getByTestId('bottom-sheet-modal')).toBeTruthy();
        expect(getByText('Añadir a la lista')).toBeTruthy();
    });
  });

  it('deletes digits correctly', () => {
      const { getByText, getByDisplayValue, getByTestId } = renderScreen();
      
      // Clear initial '1' -> '0'
      fireEvent.press(getByTestId('btn-backspace'));
      
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      
      fireEvent.press(getByTestId('btn-backspace'));
      
      expect(getByDisplayValue('1')).toBeTruthy();
  });
});
