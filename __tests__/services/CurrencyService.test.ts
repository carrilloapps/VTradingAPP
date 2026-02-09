import { CurrencyService } from '../../src/services/CurrencyService';
import { apiClient } from '../../src/services/ApiClient';
import { performanceService } from '../../src/services/firebase/PerformanceService';

// Mock dependencies
jest.mock('../../src/services/ApiClient');
jest.mock('../../src/services/firebase/PerformanceService');

describe('CurrencyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Restore any spies created
    // Clear internal cache to prevent test interference
    (CurrencyService as any).currentRates = [];
    (CurrencyService as any).lastFetch = 0;
    (CurrencyService as any).fetchPromise = null;
  });

  const mockApiResponse = {
    status: {
      status: 'ABIERTO',
      date: '2024-01-16T00:00:00.000Z',
      lastUpdate: '2024-01-16T12:00:00.000Z',
    },
    rates: [
      {
        currency: 'EUR',
        source: 'BCV',
        rate: { average: 55.45 },
        date: '2024-01-16T00:00:00.000Z',
        previousDate: null,
        change: { average: { value: 0, percent: 0, direction: 'stable' } },
      },
      {
        currency: 'USD',
        source: 'BCV',
        rate: { average: 36.58, buy: 36.5, sell: 36.66 },
        date: '2024-01-16T00:00:00.000Z',
        previousDate: null,
        change: { average: { value: 0, percent: 0, direction: 'stable' } },
        spread: {
          value: 0.5,
          percentage: 1.37,
          p2p: {
            average: { value: 0.5, percentage: 1.37, usdtPrice: 37.08 },
            buy: { value: 0.48, percentage: 1.31, usdtPrice: 36.98 },
            sell: { value: 0.52, percentage: 1.42, usdtPrice: 37.18 },
          },
        },
      },
    ],
    crypto: [],
    border: [],
  };

  it('fetches and maps rates correctly', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

    const traceMock = { putAttribute: jest.fn(), stop: jest.fn() };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(traceMock);

    const rates = await CurrencyService.getRates(true);

    expect(apiClient.get).toHaveBeenCalledWith(
      'api/rates',
      expect.objectContaining({
        headers: {
          Accept: '*/*',
        },
        useCache: false,
        cacheTTL: 0,
      }),
    );

    expect(rates).toHaveLength(3); // VES + 2 mocked rates
    expect(rates[0].code).toBe('VES');

    expect(rates[1].code).toBe('EUR');
    expect(rates[1].value).toBe(55.45);
    expect(rates[1].name).toBe('EUR/VES • BCV');

    expect(rates[2].code).toBe('USD');
    expect(rates[2].value).toBe(36.58);
    expect(rates[2].name).toBe('USD/VES • BCV');
    expect(rates[2].spreadPercentage).toBe(1.37); // New field from API

    expect(performanceService.startTrace).toHaveBeenCalledWith('get_currency_rates_service');
    expect(performanceService.stopTrace).toHaveBeenCalledWith(traceMock);
  });

  it('returns cached data on error if available', async () => {
    const traceMock = { putAttribute: jest.fn(), stop: jest.fn() };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(traceMock);

    // First, populate the cache with valid data
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockApiResponse);
    await CurrencyService.getRates();

    // Now simulate an error, but cache should be returned
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const rates = await CurrencyService.getRates(true);

    expect(rates).toBeDefined();
    expect(rates.length).toBeGreaterThan(0); // Should return cached rates
    expect(traceMock.putAttribute).toHaveBeenCalledWith('error', 'true');
  });

  it('searches currencies correctly', async () => {
    // Mock getRates to return our controlled list
    jest.spyOn(CurrencyService, 'getRates').mockResolvedValue([
      {
        id: '1',
        code: 'USD',
        name: 'Dólar',
        value: 1,
        changePercent: 0,
        type: 'fiat',
        lastUpdated: '',
      },
      {
        id: '2',
        code: 'EUR',
        name: 'Euro',
        value: 1.1,
        changePercent: 0,
        type: 'fiat',
        lastUpdated: '',
      },
    ]);

    const results = await CurrencyService.searchCurrencies('euro');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('EUR');
  });

  it('converts currency correctly', () => {
    const amount = 100;
    const rate = 36.5;
    const result = CurrencyService.convert(amount, rate);
    expect(result).toBe(3650);
  });

  it('calculates border rates using USDT bridge correctly', async () => {
    const mockResponseWithBorder = {
      status: {
        status: 'ABIERTO',
        date: '2024-01-16T00:00:00.000Z',
        lastUpdate: '2024-01-16T12:00:00.000Z',
      },
      rates: [
        {
          currency: 'USD',
          source: 'BCV',
          rate: { average: 36.58 },
          date: '2024-01-16T00:00:00.000Z',
          previousDate: null,
          change: { average: { value: 0, percent: 0, direction: 'stable' } },
        },
      ],
      crypto: [
        {
          currency: 'USDT',
          source: 'P2P',
          rate: { average: 544.83, buy: 544.0, sell: 545.66 },
          date: '2024-01-16T12:00:00.000Z',
          previousDate: null,
          change: { average: { value: 0, percent: 0, direction: 'stable' } },
        },
      ],
      border: [
        {
          currency: 'COP',
          source: 'P2P',
          rate: { average: 3660.306, buy: 3650.0, sell: 3670.61 },
          date: '2024-01-16T12:00:00.000Z',
          previousDate: null,
          change: { average: { value: 0, percent: 0, direction: 'stable' } },
        },
        {
          currency: 'PEN',
          source: 'P2P',
          rate: { average: 3.42, buy: 3.4, sell: 3.44 },
          date: '2024-01-16T12:00:00.000Z',
          previousDate: null,
          change: { average: { value: 0, percent: 0, direction: 'stable' } },
        },
      ],
    };

    (apiClient.get as jest.Mock).mockResolvedValue(mockResponseWithBorder);

    const traceMock = { putAttribute: jest.fn(), stop: jest.fn() };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(traceMock);

    // Force refresh to bypass cache
    const rates = await CurrencyService.getRates(true);

    // Find the COP rate
    const copRate = rates.find(r => r.code === 'COP');
    expect(copRate).toBeDefined();

    // COP/VES should be calculated as: (COP/USDT) / (USDT/VES)
    // 3660.306 / 544.83 = ~6.72
    expect(copRate?.value).toBeCloseTo(6.72, 1);
    expect(copRate?.type).toBe('border');
    expect(copRate?.name).toBe('COP/VES • P2P');
    // Original Foreign/USD rate should be preserved for calculator
    expect(copRate?.usdRate).toBeCloseTo(3660.306, 1);

    // Find the PEN rate
    const penRate = rates.find(r => r.code === 'PEN');
    expect(penRate).toBeDefined();

    // PEN/VES should be calculated as: (PEN/USDT) / (USDT/VES)
    // 3.42 / 544.83 = ~0.00628
    expect(penRate?.value).toBeCloseTo(0.00628, 4);
    expect(penRate?.type).toBe('border');
    // Original Foreign/USD rate should be preserved
    expect(penRate?.usdRate).toBeCloseTo(3.42, 2);
  });

  it('getCalculatorRate returns correct value for border currencies', () => {
    const borderRate = {
      id: 'border_1',
      code: 'COP',
      name: 'COP/VES • P2P',
      value: 6.72, // Display value (Foreign/VES)
      usdRate: 3660.306, // Original Foreign/USD
      changePercent: 0,
      type: 'border' as const,
      lastUpdated: '2024-01-16T12:00:00.000Z',
    };

    const fiatRate = {
      id: 'fiat_1',
      code: 'USD',
      name: 'USD/VES • BCV',
      value: 36.58,
      changePercent: 0,
      type: 'fiat' as const,
      lastUpdated: '2024-01-16T12:00:00.000Z',
    };

    // For border rates, should return usdRate
    expect(CurrencyService.getCalculatorRate(borderRate)).toBe(3660.306);

    // For fiat rates, should return value
    expect(CurrencyService.getCalculatorRate(fiatRate)).toBe(36.58);
  });
});
