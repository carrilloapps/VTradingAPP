import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AdvancedCalculatorCTA from '@/components/dashboard/AdvancedCalculatorCTA';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe('AdvancedCalculatorCTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with positive spread', () => {
    const { getByText } = render(<AdvancedCalculatorCTA spread={2.5} />);

    expect(getByText('Calculadora profesional')).toBeTruthy();
    expect(getByText('Herramienta para trading y comercio')).toBeTruthy();
    expect(getByText('SPREAD')).toBeTruthy();
    expect(getByText('2.50%')).toBeTruthy();
    // USD is more expensive than USDT
    expect(getByText('Spread: USD es mayor a USDT en VES')).toBeTruthy();
  });

  it('renders correctly with negative spread (USDT more expensive)', () => {
    const { getByText } = render(<AdvancedCalculatorCTA spread={-29.798} />);

    expect(getByText('Calculadora profesional')).toBeTruthy();
    expect(getByText('SPREAD')).toBeTruthy();
    // Should show absolute value
    expect(getByText('29.80%')).toBeTruthy();
    // USDT is more expensive than USD
    expect(getByText('Spread: USDT es mayor a USD en VES')).toBeTruthy();
  });

  it('renders correctly without spread', () => {
    const { queryByText, getByText } = render(<AdvancedCalculatorCTA spread={null} />);

    expect(getByText('Calculadora profesional')).toBeTruthy();
    expect(getByText('Herramienta para trading y comercio')).toBeTruthy();
    // Badge should not be visible
    expect(queryByText('SPREAD')).toBeNull();
    // Should show default description
    expect(getByText('Spread: Brecha de precio entre USD y USDT')).toBeTruthy();
  });

  it('navigates to AdvancedCalculator on press', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AdvancedCalculatorCTA spread={5.0} />
      </NavigationContainer>,
    );

    const calculatorTitle = getByText('Calculadora profesional');
    fireEvent.press(calculatorTitle);

    expect(mockNavigate).toHaveBeenCalledWith('AdvancedCalculator');
  });

  it('displays correct indicator for zero spread', () => {
    const { getByText } = render(<AdvancedCalculatorCTA spread={0} />);

    expect(getByText('SPREAD')).toBeTruthy();
    expect(getByText('0.00%')).toBeTruthy();
    // Equal spread message
    expect(getByText('Spread: USDT es igual a USD en VES')).toBeTruthy();
  });

  it('handles very small spreads correctly', () => {
    const { getByText } = render(<AdvancedCalculatorCTA spread={0.05} />);

    expect(getByText('SPREAD')).toBeTruthy();
    expect(getByText('0.05%')).toBeTruthy();
    expect(getByText('Spread: USD es mayor a USDT en VES')).toBeTruthy();
  });

  it('handles large negative spreads correctly', () => {
    const { getByText } = render(<AdvancedCalculatorCTA spread={-50.123} />);

    expect(getByText('SPREAD')).toBeTruthy();
    // Should show absolute value with 2 decimals
    expect(getByText('50.12%')).toBeTruthy();
    expect(getByText('Spread: USDT es mayor a USD en VES')).toBeTruthy();
  });
});
