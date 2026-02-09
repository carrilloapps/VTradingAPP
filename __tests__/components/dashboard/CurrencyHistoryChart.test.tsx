import React from 'react';
import { render } from '@testing-library/react-native';
import CurrencyHistoryChart from '@/components/dashboard/CurrencyHistoryChart';
import type { HistoryDataPoint } from '@/services/RateHistoryService';

// Mock react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
}));

// Mock theme
jest.mock('@/theme/theme', () => ({
  useAppTheme: () => ({
    colors: {
      trendUp: '#00C853',
      trendDown: '#FF1744',
      surface: '#FFFFFF',
      outline: '#79747E',
      outlineVariant: '#CAC4D0',
      onSurfaceVariant: '#49454F',
      error: '#B3261E',
      elevation: {
        level1: '#F3F3F3',
      },
    },
    dark: false,
  }),
}));

describe('CurrencyHistoryChart', () => {
  const mockData: HistoryDataPoint[] = [
    { date: '2026-02-01', price: 45.5, timestamp: '2026-02-01T12:00:00Z' },
    { date: '2026-02-02', price: 46.0, timestamp: '2026-02-02T12:00:00Z' },
    { date: '2026-02-03', price: 46.5, timestamp: '2026-02-03T12:00:00Z' },
    { date: '2026-02-04', price: 47.0, timestamp: '2026-02-04T12:00:00Z' },
    { date: '2026-02-05', price: 46.8, timestamp: '2026-02-05T12:00:00Z' },
  ];

  it('should render loading state', () => {
    const { getByText } = render(
      <CurrencyHistoryChart data={[]} loading={true} currencyCode="USD" />,
    );

    expect(getByText('Cargando historial...')).toBeTruthy();
  });

  it('should render error state', () => {
    const errorMessage = 'Error al cargar historial';
    const { getByText } = render(
      <CurrencyHistoryChart data={[]} error={errorMessage} currencyCode="USD" />,
    );

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('should render empty state when no data', () => {
    const { getByText } = render(
      <CurrencyHistoryChart data={[]} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText('No hay datos históricos disponibles')).toBeTruthy();
  });

  it('should render chart with data', () => {
    const { getByText } = render(
      <CurrencyHistoryChart data={mockData} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText(/Últimos \d+ días • USD/)).toBeTruthy();
  });

  it('should display correct currency code in footer', () => {
    const { getByText } = render(
      <CurrencyHistoryChart data={mockData} loading={false} error={null} currencyCode="EUR" />,
    );

    expect(getByText(/EUR/)).toBeTruthy();
  });

  it('should handle large dataset', () => {
    const largeData: HistoryDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      price: 45 + Math.random() * 5,
      timestamp: `2026-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
    }));

    const { getByText } = render(
      <CurrencyHistoryChart data={largeData} loading={false} error={null} currencyCode="BTC" />,
    );

    expect(getByText(/Últimos 30 días • BTC/)).toBeTruthy();
  });

  it('should handle empty data array when loading is false', () => {
    const { getByText } = render(
      <CurrencyHistoryChart data={[]} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText('No hay datos históricos disponibles')).toBeTruthy();
  });

  it('should handle undefined data', () => {
    const { getByText } = render(
      // @ts-expect-error Testing undefined data
      <CurrencyHistoryChart data={undefined} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText('No hay datos históricos disponibles')).toBeTruthy();
  });

  it('should prioritize loading state over error state', () => {
    const { getByText, queryByText } = render(
      <CurrencyHistoryChart data={[]} loading={true} error="Some error" currencyCode="USD" />,
    );

    expect(getByText('Cargando historial...')).toBeTruthy();
    expect(queryByText('Some error')).toBeNull();
  });

  it('should prioritize error state over empty data', () => {
    const { getByText, queryByText } = render(
      <CurrencyHistoryChart data={[]} loading={false} error="Network error" currencyCode="USD" />,
    );

    expect(getByText('Network error')).toBeTruthy();
    expect(queryByText('No hay datos históricos disponibles')).toBeNull();
  });

  it('should render with minimal data (2 points)', () => {
    const minimalData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 45.5, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 46.0, timestamp: '2026-02-02T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart data={minimalData} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText(/Últimos 2 días • USD/)).toBeTruthy();
  });

  it('should handle single data point', () => {
    const singlePoint: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 45.5, timestamp: '2026-02-01T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart data={singlePoint} loading={false} error={null} currencyCode="USD" />,
    );

    expect(getByText(/Últimos 1 días • USD/)).toBeTruthy();
  });

  it('should handle data with very small values', () => {
    const smallValueData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 0.001, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 0.002, timestamp: '2026-02-02T12:00:00Z' },
      { date: '2026-02-03', price: 0.0015, timestamp: '2026-02-03T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart
        data={smallValueData}
        loading={false}
        error={null}
        currencyCode="SHIB"
      />,
    );

    expect(getByText(/Últimos 3 días • SHIB/)).toBeTruthy();
  });

  it('should handle data with very large values', () => {
    const largeValueData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 50000, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 51000, timestamp: '2026-02-02T12:00:00Z' },
      { date: '2026-02-03', price: 52000, timestamp: '2026-02-03T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart
        data={largeValueData}
        loading={false}
        error={null}
        currencyCode="BTC"
      />,
    );

    expect(getByText(/Últimos 3 días • BTC/)).toBeTruthy();
  });

  it('should handle data with negative trend', () => {
    const negativeTrendData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 50.0, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 48.0, timestamp: '2026-02-02T12:00:00Z' },
      { date: '2026-02-03', price: 46.0, timestamp: '2026-02-03T12:00:00Z' },
      { date: '2026-02-04', price: 44.0, timestamp: '2026-02-04T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart
        data={negativeTrendData}
        loading={false}
        error={null}
        currencyCode="USD"
      />,
    );

    expect(getByText(/Últimos 4 días • USD/)).toBeTruthy();
  });

  it('should handle data with positive trend', () => {
    const positiveTrendData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 44.0, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 46.0, timestamp: '2026-02-02T12:00:00Z' },
      { date: '2026-02-03', price: 48.0, timestamp: '2026-02-03T12:00:00Z' },
      { date: '2026-02-04', price: 50.0, timestamp: '2026-02-04T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart
        data={positiveTrendData}
        loading={false}
        error={null}
        currencyCode="USD"
      />,
    );

    expect(getByText(/Últimos 4 días • USD/)).toBeTruthy();
  });

  it('should handle data with same values (flat trend)', () => {
    const flatTrendData: HistoryDataPoint[] = [
      { date: '2026-02-01', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
      { date: '2026-02-02', price: 45.0, timestamp: '2026-02-02T12:00:00Z' },
      { date: '2026-02-03', price: 45.0, timestamp: '2026-02-03T12:00:00Z' },
    ];

    const { getByText } = render(
      <CurrencyHistoryChart
        data={flatTrendData}
        loading={false}
        error={null}
        currencyCode="USDT"
      />,
    );

    expect(getByText(/Últimos 3 días • USDT/)).toBeTruthy();
  });

  it('should default loading to false', () => {
    const { queryByText } = render(<CurrencyHistoryChart data={mockData} currencyCode="USD" />);

    expect(queryByText('Cargando historial...')).toBeNull();
  });

  it('should default error to null', () => {
    const { queryByText } = render(
      <CurrencyHistoryChart data={mockData} loading={false} currencyCode="USD" />,
    );

    // Should render chart, not error
    expect(queryByText(/error/i)).toBeNull();
  });
});
