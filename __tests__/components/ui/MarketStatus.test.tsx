import React from 'react';
import { render } from '@testing-library/react-native';
import MarketStatus from '@/components/ui/MarketStatus';

// Mock theme
jest.mock('@/theme', () => ({
  useAppTheme: () => ({
    colors: {
      trendUp: '#006C4C',
      trendDown: '#BA1A1A',
      warning: '#E6C449',
      onSurfaceVariant: '#404944',
    },
    dark: false,
  }),
}));

describe('MarketStatus Component', () => {
  it('renders with ABIERTO status', () => {
    const { getByText } = render(
      <MarketStatus status="ABIERTO" updatedAt="10:30 AM" showBadge={true} />,
    );

    expect(getByText('MERCADO ABIERTO')).toBeTruthy();
    expect(getByText('Actualizado: 10:30 AM')).toBeTruthy();
  });

  it('renders with CERRADO status', () => {
    const { getByText } = render(
      <MarketStatus status="CERRADO" updatedAt="5:00 PM" showBadge={true} />,
    );

    expect(getByText('MERCADO CERRADO')).toBeTruthy();
    expect(getByText('Actualizado: 5:00 PM')).toBeTruthy();
  });

  it('renders with PRE-APERTURA status', () => {
    const { getByText } = render(
      <MarketStatus status="PRE-APERTURA" updatedAt="8:45 AM" showBadge={true} />,
    );

    expect(getByText('PRE-APERTURA')).toBeTruthy();
    expect(getByText('Actualizado: 8:45 AM')).toBeTruthy();
  });

  it('renders without badge when showBadge is false', () => {
    const { queryByText, getByText } = render(
      <MarketStatus status="ABIERTO" updatedAt="10:30 AM" showBadge={false} />,
    );

    expect(queryByText('MERCADO ABIERTO')).toBeNull();
    expect(getByText('Actualizado: 10:30 AM')).toBeTruthy();
  });
});
