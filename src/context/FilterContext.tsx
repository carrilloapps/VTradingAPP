import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExchangeRateFilters {
  query: string;
  type: 'all' | 'fiat' | 'crypto';
}

interface StockFilters {
  query: string;
  category: string;
}

interface FilterContextType {
  exchangeRateFilters: ExchangeRateFilters;
  stockFilters: StockFilters;
  setExchangeRateFilters: (filters: Partial<ExchangeRateFilters>) => void;
  setStockFilters: (filters: Partial<StockFilters>) => void;
  resetFilters: () => void;
}

/**
 * Default filters for Exchange Rates
 */
const defaultExchangeFilters: ExchangeRateFilters = {
  query: '',
  type: 'all',
};

/**
 * Default filters for Stocks
 */
const defaultStockFilters: StockFilters = {
  query: '',
  category: 'Todos',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

/**
 * Provider component that wraps the app and makes filter state available to any child component.
 * It persists filter state across screen navigation.
 */
export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [exchangeRateFilters, setExchangeRateFiltersState] = useState<ExchangeRateFilters>(defaultExchangeFilters);
  const [stockFilters, setStockFiltersState] = useState<StockFilters>(defaultStockFilters);

  const setExchangeRateFilters = (filters: Partial<ExchangeRateFilters>) => {
    setExchangeRateFiltersState(prev => ({ ...prev, ...filters }));
  };

  const setStockFilters = (filters: Partial<StockFilters>) => {
    setStockFiltersState(prev => ({ ...prev, ...filters }));
  };

  const resetFilters = () => {
    setExchangeRateFiltersState(defaultExchangeFilters);
    setStockFiltersState(defaultStockFilters);
  };

  return (
    <FilterContext.Provider value={{
      exchangeRateFilters,
      stockFilters,
      setExchangeRateFilters,
      setStockFilters,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
