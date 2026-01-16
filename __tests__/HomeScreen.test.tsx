import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';

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
      expect(getByText('Dólar MEP')).toBeTruthy();
      expect(getByText('Bitcoin')).toBeTruthy();
    });
  });

  it('renders calculator section', async () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Calculadora Rápida')).toBeTruthy();
    });
  });
});
