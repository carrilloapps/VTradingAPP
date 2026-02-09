import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { CurrencyRate } from '../../src/services/CurrencyService';
import type { StockData } from '../../src/services/StocksService';
import { useHomeScreenData } from '../../src/hooks/useHomeScreenData';

jest.mock('@/services/CurrencyService', () => ({
  CurrencyService: {
    subscribe: jest.fn(),
    getRates: jest.fn(),
  },
}));

jest.mock('@/services/StocksService', () => ({
  StocksService: {
    subscribe: jest.fn(),
    getStocks: jest.fn(),
    isMarketOpen: jest.fn(),
  },
}));

jest.mock('@/stores/toastStore', () => {
  const showToast = jest.fn();
  return {
    __mock: { showToast },
    useToastStore: (selector: (state: { showToast: typeof showToast }) => unknown) =>
      selector({ showToast }),
  };
});

jest.mock('@/services/ObservabilityService', () => {
  const captureError = jest.fn();
  return {
    __mock: { captureError },
    observabilityService: { captureError },
  };
});

jest.mock('@/services/firebase/AnalyticsService', () => {
  const logDataRefresh = jest.fn(() => Promise.resolve());
  return {
    __mock: { logDataRefresh },
    analyticsService: { logDataRefresh },
  };
});

const { CurrencyService: mockCurrencyService } = jest.requireMock('@/services/CurrencyService') as {
  CurrencyService: {
    subscribe: jest.Mock;
    getRates: jest.Mock;
  };
};

const { StocksService: mockStocksService } = jest.requireMock('@/services/StocksService') as {
  StocksService: {
    subscribe: jest.Mock;
    getStocks: jest.Mock;
    isMarketOpen: jest.Mock;
  };
};

const { __mock: toastMock } = jest.requireMock('@/stores/toastStore') as {
  __mock: { showToast: jest.Mock };
};

const { __mock: observabilityMock } = jest.requireMock('@/services/ObservabilityService') as {
  __mock: { captureError: jest.Mock };
};

const { __mock: analyticsMock } = jest.requireMock('@/services/firebase/AnalyticsService') as {
  __mock: { logDataRefresh: jest.Mock };
};

describe('useHomeScreenData', () => {
  const baseRate: CurrencyRate = {
    id: '1',
    code: 'USD',
    name: 'US Dollar',
    value: 36.5,
    changePercent: 0.5,
    type: 'fiat',
    source: 'BCV',
    lastUpdated: '2024-01-01T00:00:00Z',
    buyValue: 35.5,
    sellValue: 37.5,
    spreadPercentage: -29.798, // Spread from API
  };

  const usdtRate: CurrencyRate = {
    id: '2',
    code: 'USDT',
    name: 'Tether',
    value: 37.0,
    changePercent: -0.2,
    type: 'crypto',
    lastUpdated: '2024-01-01T00:00:00Z',
  };

  const sampleStocks: StockData[] = [
    {
      id: 's1',
      symbol: 'AAPL',
      name: 'Apple',
      price: 10,
      changePercent: 1.5,
      initials: 'A',
      color: '#000000',
      category: 'Tech',
    },
    {
      id: 's2',
      symbol: 'TSLA',
      name: 'Tesla',
      price: 20,
      changePercent: -2.5,
      initials: 'T',
      color: '#111111',
      category: 'Auto',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStocksService.isMarketOpen.mockReturnValue(true);
  });

  it('populates data from subscriptions and calculates spread', async () => {
    const rates = [baseRate, usdtRate];

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(rates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(rates).mockResolvedValueOnce(rates);
    mockStocksService.getStocks
      .mockResolvedValueOnce(sampleStocks)
      .mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      expect(result.current.rates.length).toBe(2);
      expect(result.current.featuredRates.length).toBe(2);
      expect(result.current.spread).toBeDefined();
      expect(typeof result.current.spread).toBe('number');
      expect(result.current.isMarketOpen).toBe(true);
    });

    const firstFeatured = result.current.featuredRates[0];
    expect(firstFeatured.buyValue).toBeDefined();
    expect(firstFeatured.sellValue).toBeDefined();
    expect(firstFeatured.chartPath).toContain('M0');
  });

  it('uses spread from API when available', async () => {
    // Base rate has spreadPercentage from API (negative value)
    const rates = [baseRate, usdtRate];

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(rates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(rates);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      // Should use the API spread value directly (can be negative)
      expect(result.current.spread).toBe(-29.798);
      // The UI components will handle Math.abs() for display
    });
  });

  it('calculates spread when both USD and USDT are present (fallback)', async () => {
    // Create USD without spreadPercentage to test fallback
    const usdWithoutSpread: CurrencyRate = {
      ...baseRate,
      spreadPercentage: undefined,
    };
    const rates = [usdWithoutSpread, usdtRate];

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(rates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(rates);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      // Should calculate manually: ((37 - 36.5) / 36.5) * 100
      expect(result.current.spread).toBeCloseTo(((37 - 36.5) / 36.5) * 100, 6);
    });
  });

  it('handles manual refresh success', async () => {
    const rates = [baseRate, usdtRate];

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(rates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(rates);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(toastMock.showToast).toHaveBeenCalledWith('Datos actualizados', 'success');
      expect(analyticsMock.logDataRefresh).toHaveBeenCalledWith('dashboard', true);
    });
  });

  it('handles partial manual refresh', async () => {
    const rates = [baseRate, usdtRate];
    const stocksError = new Error('stocks error');

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(rates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(rates).mockResolvedValueOnce(rates);
    mockStocksService.getStocks
      .mockResolvedValueOnce(sampleStocks)
      .mockRejectedValueOnce(stocksError);

    const { result } = renderHook(() => useHomeScreenData());

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(toastMock.showToast).toHaveBeenCalledWith('Actualización parcial', 'warning');
      expect(observabilityMock.captureError).toHaveBeenCalledWith(
        stocksError,
        expect.objectContaining({ context: 'useHomeScreenData.loadData.stocks' }),
      );
    });
  });

  it('handles manual refresh failure for both sources', async () => {
    const ratesError = new Error('rates error');
    const stocksError = new Error('stocks error');

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback([baseRate, usdtRate]);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates
      .mockResolvedValueOnce([baseRate, usdtRate])
      .mockRejectedValueOnce(ratesError);
    mockStocksService.getStocks
      .mockResolvedValueOnce(sampleStocks)
      .mockRejectedValueOnce(stocksError);

    const { result } = renderHook(() => useHomeScreenData());

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(toastMock.showToast).toHaveBeenCalledWith('Error al actualizar datos', 'error');
      expect(observabilityMock.captureError).toHaveBeenCalledWith(
        ratesError,
        expect.objectContaining({ context: 'useHomeScreenData.loadData.rates' }),
      );
      expect(observabilityMock.captureError).toHaveBeenCalledWith(
        stocksError,
        expect.objectContaining({ context: 'useHomeScreenData.loadData.stocks' }),
      );
    });
  });

  it('handles unexpected errors during manual refresh', async () => {
    const unexpectedError = new Error('unexpected');

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback([baseRate, usdtRate]);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates
      .mockResolvedValueOnce([baseRate, usdtRate])
      .mockImplementationOnce(() => {
        throw unexpectedError;
      });

    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(observabilityMock.captureError).toHaveBeenCalledWith(
        unexpectedError,
        expect.objectContaining({ context: 'useHomeScreenData.loadData' }),
      );
      expect(toastMock.showToast).toHaveBeenCalledWith('Error inesperado', 'error');
    });
  });

  it('uses flat chart path and returns null spread when values are invalid', async () => {
    const edgeRates: CurrencyRate[] = [
      {
        ...baseRate,
        type: 'border',
        changePercent: 0,
        value: 0,
      },
      {
        ...usdtRate,
        type: 'crypto',
        changePercent: 0,
        value: 0,
      },
    ];

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback(edgeRates);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce(edgeRates);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      expect(result.current.spread).toBeNull();
      expect(result.current.featuredRates[0].chartPath).toBe('M0 20 L 100 20');
      expect(result.current.featuredRates[0].subtitle).toBe('Frontera • P2P');
    });
  });

  it('handles null change percent values', async () => {
    const nullRate: CurrencyRate = {
      ...baseRate,
      changePercent: null,
    };
    const zeroRate: CurrencyRate = {
      ...usdtRate,
      changePercent: 0,
    };

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback([nullRate, zeroRate]);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce([nullRate, zeroRate]);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      expect(result.current.featuredRates[0].changePercent).toBe('0.00%');
      expect(result.current.featuredRates[0].chartPath).toBe('M0 20 L 100 20');
      expect(result.current.featuredRates[1].changePercent).toBe('0.00%');
    });
  });

  it('falls back to rate name when type is unexpected', async () => {
    const oddRate = {
      ...baseRate,
      type: 'other',
      changePercent: 0.002,
    } as unknown as CurrencyRate;

    mockCurrencyService.subscribe.mockImplementation((callback: (data: CurrencyRate[]) => void) => {
      callback([oddRate, usdtRate]);
      return jest.fn();
    });

    mockStocksService.subscribe.mockImplementation((callback: (data: StockData[]) => void) => {
      callback(sampleStocks);
      return jest.fn();
    });

    mockCurrencyService.getRates.mockResolvedValueOnce([oddRate, usdtRate]);
    mockStocksService.getStocks.mockResolvedValueOnce(sampleStocks);

    const { result } = renderHook(() => useHomeScreenData());

    await waitFor(() => {
      expect(result.current.featuredRates[0].subtitle).toBe(oddRate.name);
    });
  });
});
