import { useFilterStore } from '../../src/stores/filterStore';

describe('useFilterStore', () => {
  beforeEach(() => {
    useFilterStore.setState({
      exchangeRateFilters: { query: '', type: 'all' },
      stockFilters: { query: '', category: 'Todos' },
    });
  });

  it('provides default filters', () => {
    const state = useFilterStore.getState();

    expect(state.exchangeRateFilters).toEqual({ query: '', type: 'all' });
    expect(state.stockFilters).toEqual({ query: '', category: 'Todos' });
  });

  it('updates exchange rate filters', () => {
    useFilterStore.getState().setExchangeRateFilters({ query: 'usd' });

    expect(useFilterStore.getState().exchangeRateFilters).toEqual({
      query: 'usd',
      type: 'all',
    });
  });

  it('updates stock filters', () => {
    useFilterStore.getState().setStockFilters({ category: 'Tecnología' });

    expect(useFilterStore.getState().stockFilters).toEqual({
      query: '',
      category: 'Tecnología',
    });
  });

  it('resets filters to defaults', () => {
    useFilterStore.getState().setExchangeRateFilters({ query: 'eur' });
    useFilterStore.getState().setStockFilters({ category: 'Finanzas' });

    useFilterStore.getState().resetFilters();

    expect(useFilterStore.getState().exchangeRateFilters).toEqual({ query: '', type: 'all' });
    expect(useFilterStore.getState().stockFilters).toEqual({ query: '', category: 'Todos' });
  });
});
