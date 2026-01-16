import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { FilterProvider, useFilters } from '../src/context/FilterContext';

describe('FilterContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FilterProvider>{children}</FilterProvider>
  );

  it('provides default filter values', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    
    expect(result.current.exchangeRateFilters).toEqual({ query: '', type: 'all' });
    expect(result.current.stockFilters).toEqual({ query: '', category: 'Todos' });
  });

  it('updates exchange rate filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setExchangeRateFilters({ query: 'usd', type: 'fiat' });
    });

    expect(result.current.exchangeRateFilters).toEqual({ query: 'usd', type: 'fiat' });
  });

  it('updates stock filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setStockFilters({ query: 'bnc', category: 'Banca' });
    });

    expect(result.current.stockFilters).toEqual({ query: 'bnc', category: 'Banca' });
  });

  it('resets filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setExchangeRateFilters({ query: 'usd' });
      result.current.setStockFilters({ query: 'bnc' });
      result.current.resetFilters();
    });

    expect(result.current.exchangeRateFilters).toEqual({ query: '', type: 'all' });
    expect(result.current.stockFilters).toEqual({ query: '', category: 'Todos' });
  });
});
