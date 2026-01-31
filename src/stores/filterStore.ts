import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ExchangeRateFilters {
    query: string;
    type: 'all' | 'fiat' | 'crypto' | 'border';
}

export interface StockFilters {
    query: string;
    category: string;
}

interface FilterState {
    exchangeRateFilters: ExchangeRateFilters;
    stockFilters: StockFilters;
    setExchangeRateFilters: (filters: Partial<ExchangeRateFilters>) => void;
    setStockFilters: (filters: Partial<StockFilters>) => void;
    resetFilters: () => void;
}

const defaultExchangeFilters: ExchangeRateFilters = {
    query: '',
    type: 'all',
};

const defaultStockFilters: StockFilters = {
    query: '',
    category: 'Todos',
};

export const useFilterStore = create<FilterState>()(
    devtools(
        (set) => ({
            exchangeRateFilters: defaultExchangeFilters,
            stockFilters: defaultStockFilters,
            setExchangeRateFilters: (filters) =>
                set((state) => ({
                    exchangeRateFilters: { ...state.exchangeRateFilters, ...filters },
                })),
            setStockFilters: (filters) =>
                set((state) => ({
                    stockFilters: { ...state.stockFilters, ...filters },
                })),
            resetFilters: () =>
                set({
                    exchangeRateFilters: defaultExchangeFilters,
                    stockFilters: defaultStockFilters,
                }),
        }),
        { name: 'FilterStore' }
    )
);
