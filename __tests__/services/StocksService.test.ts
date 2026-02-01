import { StocksService } from '../../src/services/StocksService';
import { apiClient } from '../../src/services/ApiClient';
import { performanceService } from '../../src/services/firebase/PerformanceService';
import { observabilityService } from '../../src/services/ObservabilityService';

declare const global: any;

jest.mock('../../src/services/ApiClient');
jest.mock('../../src/services/firebase/PerformanceService');
jest.mock('../../src/services/ObservabilityService');

describe('StocksService', () => {
  const setInternalState = (partial: Record<string, unknown>) => {
    Object.entries(partial).forEach(([key, value]) => {
      (StocksService as unknown as Record<string, unknown>)[key] = value;
    });
  };

  const baseStock = {
    id: 'AAA',
    symbol: 'AAA',
    name: 'Alpha',
    price: 10,
    changePercent: 1,
    initials: 'AAA',
    color: 'blue',
    category: 'Tech',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setInternalState({
      listeners: [],
      currentStocks: [],
      lastFetch: 0,
      currentPage: 1,
      totalPages: 1,
      isLoadingMore: false,
      marketOpen: false,
    });
  });

  it('subscribes and unsubscribes listeners', () => {
    setInternalState({ currentStocks: [baseStock] });
    const listener = jest.fn();

    const unsubscribe = StocksService.subscribe(listener);

    expect(listener).toHaveBeenCalledWith([baseStock]);

    unsubscribe();

    (
      StocksService as unknown as { notifyListeners: (stocks: (typeof baseStock)[]) => void }
    ).notifyListeners([baseStock]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns market status and pagination info', () => {
    setInternalState({ marketOpen: true, currentPage: 1, totalPages: 3 });

    expect(StocksService.isMarketOpen()).toBe(true);
    expect(StocksService.hasMorePages()).toBe(true);
  });

  it('maps and returns all stocks', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'AAA',
          name: 'Alpha',
          price: '10,5',
          changePercent: '2,5',
          volume: 1500,
          openingPrice: '9',
          category: 'Tech',
          meta: { iconUrl: 'https://example.com/icon.png' },
        },
        {
          symbol: 'BBB',
          name: 'Beta',
          price: 20,
          change: { amount: -1.25, percent: -0.5 },
          volume: { amount: 2_500_000, shares: 500 },
        },
        {
          symbol: 'CCC',
          name: 'Gamma',
          price: 5,
          volume: { shares: 2500 },
        },
        {
          symbol: 'DDD',
          name: 'Delta',
          price: 8,
          volume: { amount: 1000 },
        },
      ],
    });

    const result = await StocksService.getAllStocks();

    expect(apiClient.get).toHaveBeenCalledWith('api/bvc/market', {
      params: { page: 1, limit: 500 },
      useCache: false,
    });

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      symbol: 'AAA',
      price: 10.5,
      changePercent: 2.5,
      volume: '1.5k',
      opening: 9,
      iconUrl: 'https://example.com/icon.png',
      category: 'Tech',
    });
    expect(result[1]).toMatchObject({
      symbol: 'BBB',
      changePercent: -0.5,
      changeAmount: -1.25,
      volume: '2.5M',
      volumeAmount: 2_500_000,
      volumeShares: 500,
      category: 'Otros',
    });
    expect(result[2]).toMatchObject({
      symbol: 'CCC',
      volume: '2.5k',
      volumeShares: 2500,
    });
    expect(result[3]).toMatchObject({
      symbol: 'DDD',
      volume: '1.0k',
      volumeAmount: 1000,
      volumeShares: 0,
    });
  });

  it('returns an empty array when getAllStocks fails', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await StocksService.getAllStocks();

    expect(result).toEqual([]);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StocksService.getAllStocks' }),
    );
  });

  it('maps legacy stock lists in getAllStocks', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      stocks: [
        {
          symbol: 'LEG',
          name: 'Legacy',
          price: 3,
        },
      ],
    });

    const result = await StocksService.getAllStocks();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ symbol: 'LEG', price: 3 });
  });

  it('returns empty list when getAllStocks has no data fields', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({});

    const result = await StocksService.getAllStocks();

    expect(result).toEqual([]);
  });

  it('returns cached data when within cache duration', async () => {
    const now = 1_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    setInternalState({ currentStocks: [baseStock], lastFetch: now - 1000 });

    const result = await StocksService.getStocks(false, 1);

    expect(result).toEqual([baseStock]);
    expect(apiClient.get).not.toHaveBeenCalled();

    (Date.now as jest.Mock).mockRestore();
  });

  it('skips cache when data is expired', async () => {
    const now = 2_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    setInternalState({
      currentStocks: [baseStock],
      lastFetch:
        now - ((StocksService as unknown as { CACHE_DURATION: number }).CACHE_DURATION + 1),
    });

    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'FFF',
          name: 'Foxtrot',
          price: 11,
        },
      ],
    });

    const result = await StocksService.getStocks(false, 1);

    expect(apiClient.get).toHaveBeenCalled();
    expect(result.map(item => item.symbol)).toEqual(['FFF']);

    (Date.now as jest.Mock).mockRestore();
  });

  it('returns cached data when requesting beyond total pages', async () => {
    setInternalState({ currentStocks: [baseStock], totalPages: 1 });

    const result = await StocksService.getStocks(false, 2);

    expect(result).toEqual([baseStock]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('covers parsePrice and formatVolume edge cases', () => {
    const parsePrice = (StocksService as unknown as { parsePrice: (value: unknown) => number })
      .parsePrice;
    const formatVolume = (StocksService as unknown as { formatVolume: (value: number) => string })
      .formatVolume;

    expect(parsePrice(null)).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
    expect(parsePrice(10)).toBe(10);
    expect(parsePrice(Number.MAX_SAFE_INTEGER + 1)).toBe(0);
    expect(parsePrice('1,23')).toBe(1.23);
    expect(parsePrice('invalid')).toBe(0);
    expect(parsePrice({})).toBe(0);

    expect(formatVolume(2_000_000_000)).toBe('2.0B');
    expect(formatVolume(2_000_000)).toBe('2.0M');
    expect(formatVolume(2_000)).toBe('2.0k');
    expect(formatVolume(500)).toBe('500');
  });

  it('fetches and updates stocks on the first page', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'AAA',
          name: 'Alpha',
          price: 10,
          changePercent: 1,
          volume: 1000,
        },
      ],
      status: { state: 'ABIERTO', date: '2025-01-01', lastUpdate: '10:00' },
      pagination: { page: 1, totalPages: 2, limit: 20, total: 2 },
    });

    const listener = jest.fn();
    StocksService.subscribe(listener);

    const result = await StocksService.getStocks(false, 1);

    expect(apiClient.get).toHaveBeenCalledWith('api/bvc/market', {
      params: { page: 1, limit: 20 },
      useCache: true,
      updateCache: false,
    });
    expect(result).toHaveLength(1);
    expect(StocksService.isMarketOpen()).toBe(true);
    expect(StocksService.hasMorePages()).toBe(true);
    expect(listener).toHaveBeenCalledWith(result);
    expect(performanceService.stopTrace).toHaveBeenCalledWith(trace);
  });

  it('resets pagination when forceRefresh is true', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    setInternalState({ currentStocks: [baseStock], currentPage: 3, totalPages: 3 });
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'DDD',
          name: 'Delta',
          price: 40,
        },
      ],
      pagination: { page: 1, totalPages: 1, limit: 20, total: 1 },
    });

    const result = await StocksService.getStocks(true, 1);

    expect(apiClient.get).toHaveBeenCalledWith('api/bvc/market', {
      params: { page: 1, limit: 20 },
      useCache: false,
      updateCache: true,
    });
    expect(result.map(item => item.symbol)).toEqual(['DDD']);
  });

  it('uses default parameters when none are provided', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'HHH',
          name: 'Hotel',
          price: 9,
        },
      ],
    });

    const result = await StocksService.getStocks();

    expect(apiClient.get).toHaveBeenCalledWith('api/bvc/market', {
      params: { page: 1, limit: 20 },
      useCache: true,
      updateCache: false,
    });
    expect(result.map(item => item.symbol)).toEqual(['HHH']);
  });

  it('handles legacy response without status or pagination', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    (apiClient.get as jest.Mock).mockResolvedValue({
      stocks: [
        {
          symbol: 'EEE',
          name: 'Echo',
          price: 7,
          volume: { amount: 0, shares: 700 },
        },
      ],
    });

    const result = await StocksService.getStocks(false, 1);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      symbol: 'EEE',
      volume: '700',
      volumeShares: 700,
      category: 'Otros',
    });
    expect(StocksService.isMarketOpen()).toBe(false);
  });

  it('handles empty responses in getStocks', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    (apiClient.get as jest.Mock).mockResolvedValue({});

    const result = await StocksService.getStocks(false, 1);

    expect(result).toEqual([]);
  });

  it('keeps market status unchanged when status is missing', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    setInternalState({ marketOpen: false });
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'GGG',
          name: 'Golf',
          price: 12,
        },
      ],
      status: {},
    });

    await StocksService.getStocks(false, 1);

    expect(StocksService.isMarketOpen()).toBe(false);
  });

  it('appends unique stocks when loading next page', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    setInternalState({
      currentStocks: [baseStock],
      currentPage: 1,
      totalPages: 2,
    });

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          symbol: 'AAA',
          name: 'Alpha',
          price: 10,
        },
        {
          symbol: 'CCC',
          name: 'Gamma',
          price: 30,
        },
      ],
      pagination: { page: 2, totalPages: 2, limit: 20, total: 2 },
      marketStatus: { isOpen: false },
    });

    const result = await StocksService.getStocks(false, 2);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.symbol)).toEqual(['AAA', 'CCC']);
    expect(StocksService.isMarketOpen()).toBe(false);
  });

  it('forces changePercent NaN guard', () => {
    const originalIsNaN = global.isNaN;
    global.isNaN = jest.fn(() => true) as unknown as typeof global.isNaN;

    const mapStock = (
      StocksService as unknown as {
        mapStock: (item: {
          symbol: string;
          name: string;
          price: number;
          changePercent?: number;
        }) => {
          changePercent: number;
        };
      }
    ).mapStock;

    const mapped = mapStock.call(StocksService, {
      symbol: 'ZZZ',
      name: 'Zulu',
      price: 1,
      changePercent: 5,
    });

    expect(mapped.changePercent).toBe(0);

    global.isNaN = originalIsNaN;
  });

  it('returns cached data when fetch fails and cache exists', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    setInternalState({ currentStocks: [baseStock] });
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));

    const result = await StocksService.getStocks(false, 1);

    expect(result).toEqual([baseStock]);
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StocksService.fetchAllStocks', hasCachedData: true }),
    );
  });

  it('throws when fetch fails and cache is empty', async () => {
    const trace = { name: 'trace' };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(trace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);

    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));

    await expect(StocksService.getStocks(false, 1)).rejects.toThrow('fail');
  });

  it('loads more when pagination allows', async () => {
    setInternalState({ currentPage: 1, totalPages: 2, isLoadingMore: false });
    const spy = jest.spyOn(StocksService, 'getStocks').mockResolvedValue([]);

    await StocksService.loadMore();

    expect(spy).toHaveBeenCalledWith(false, 2);
  });

  it('does not load more when already loading or no more pages', async () => {
    const spy = jest.spyOn(StocksService, 'getStocks').mockResolvedValue([]);

    setInternalState({ currentPage: 2, totalPages: 2, isLoadingMore: false });
    await StocksService.loadMore();

    setInternalState({ currentPage: 1, totalPages: 2, isLoadingMore: true });
    await StocksService.loadMore();

    expect(spy).not.toHaveBeenCalled();
  });

  it('returns formatted market index data when IBC is available', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      indices: [
        {
          symbol: 'IBC',
          description: 'Indice',
          price: 1234.56,
          changeAmount: 12.34,
          changePercent: 1.23,
          volume: 100,
          amountTraded: 200,
          lastUpdate: '2025-01-01',
        },
      ],
      stats: {
        totalVolume: 500,
        totalAmount: 1_234_567,
        titlesUp: 10,
        titlesDown: 5,
        titlesUnchanged: 2,
      },
      status: { state: 'ABIERTO', date: '2025-01-01', lastUpdate: '10:00' },
    });

    const result = await StocksService.getMarketIndex();

    expect(result).toMatchObject({
      value: '1.234,56',
      changePercent: '1,23%',
      isPositive: true,
      volume: '1.234.567,00',
      stats: {
        totalVolume: 500,
        totalAmount: 1_234_567,
        titlesUp: 10,
        titlesDown: 5,
        titlesUnchanged: 2,
      },
      statusState: 'ABIERTO',
    });
  });

  it('marks index as negative when changeAmount is below zero and stats missing', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      indices: [
        {
          symbol: 'IBC',
          description: 'Indice',
          price: 10,
          changeAmount: -5,
          changePercent: -2,
          volume: 0,
          amountTraded: 0,
          lastUpdate: '2025-01-01',
        },
      ],
      status: { state: 'CERRADO', date: '2025-01-01', lastUpdate: '10:00' },
    });

    const result = await StocksService.getMarketIndex();

    expect(result).toMatchObject({
      isPositive: false,
      stats: undefined,
    });
  });

  it('uses fallback date when status is missing', async () => {
    const dateSpy = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('02/01/2025');
    (apiClient.get as jest.Mock).mockResolvedValue({
      indices: [
        {
          symbol: 'IBC',
          description: 'Indice',
          price: 1,
          changeAmount: -1,
          changePercent: -1,
          volume: 0,
          amountTraded: 0,
          lastUpdate: '2025-01-01',
        },
      ],
      stats: { totalAmount: 0, totalVolume: 0, titlesUp: 0, titlesDown: 0, titlesUnchanged: 0 },
    });

    const result = await StocksService.getMarketIndex();

    expect(result?.updateDate).toBe('02/01/2025');
    dateSpy.mockRestore();
  });

  it('returns null when IBC data is missing', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ indices: [] });

    const result = await StocksService.getMarketIndex();

    expect(result).toBeNull();
  });

  it('returns null when getMarketIndex fails', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));

    const result = await StocksService.getMarketIndex();

    expect(result).toBeNull();
    expect(observabilityService.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'StocksService.getIBC' }),
    );
  });
});
