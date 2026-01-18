import { CurrencyService } from '../../src/services/CurrencyService';
import { apiClient } from '../../src/services/ApiClient';
import { performanceService } from '../../src/services/firebase/PerformanceService';

// Mock dependencies
jest.mock('../../src/services/ApiClient');
jest.mock('../../src/services/firebase/PerformanceService');

describe('CurrencyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockApiResponse = {
    source: 'BCV',
    rates: [
      { currency: 'EUR', rate: 55.45 },
      { currency: 'USD', rate: 36.58 }
    ],
    publicationDate: '2024-01-16T00:00:00.000Z',
    timestamp: 'string'
  };

  it('fetches and maps rates correctly', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);
    
    const traceMock = { putAttribute: jest.fn(), stop: jest.fn() };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(traceMock);

    const rates = await CurrencyService.getRates();

    expect(apiClient.get).toHaveBeenCalledWith('api/rates', expect.objectContaining({
      headers: {
        'Accept': '*/*',
        'X-API-Key': 'admin_key'
      },
      useCache: true
    }));

    expect(rates).toHaveLength(3); // VES + 2 mocked rates
    expect(rates[0].code).toBe('VES');
    
    expect(rates[1].code).toBe('EUR');
    expect(rates[1].value).toBe(55.45);
    expect(rates[1].name).toBe('Euro (BCV)');
    
    expect(rates[2].code).toBe('USD');
    expect(rates[2].value).toBe(36.58);
    expect(rates[2].name).toBe('Dólar (BCV)');

    expect(performanceService.startTrace).toHaveBeenCalledWith('get_currency_rates_service');
    expect(performanceService.stopTrace).toHaveBeenCalledWith(traceMock);
  });

  it('returns mock data on error', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const traceMock = { putAttribute: jest.fn(), stop: jest.fn() };
    (performanceService.startTrace as jest.Mock).mockResolvedValue(traceMock);

    // Force refresh to bypass in-memory cache and trigger error
    const rates = await CurrencyService.getRates(true);

    expect(rates).toBeDefined();
    expect(rates.length).toBeGreaterThan(0); // Should return mock rates
    expect(traceMock.putAttribute).toHaveBeenCalledWith('error', 'true');
  });

  it('searches currencies correctly', async () => {
    // Mock getRates to return our controlled list
    jest.spyOn(CurrencyService, 'getRates').mockResolvedValue([
      { id: '1', code: 'USD', name: 'Dólar', value: 1, changePercent: 0, type: 'fiat', lastUpdated: '' },
      { id: '2', code: 'EUR', name: 'Euro', value: 1.1, changePercent: 0, type: 'fiat', lastUpdated: '' }
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
});
