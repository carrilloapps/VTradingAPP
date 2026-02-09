import { rateHistoryService } from '@/services/RateHistoryService';
import { apiClient } from '@/services/ApiClient';
import { performanceService } from '@/services/firebase/PerformanceService';
import { observabilityService } from '@/services/ObservabilityService';
import type { RateHistory, BankRateHistory, HistoryDataPoint } from '@/services/RateHistoryService';

jest.mock('@/services/ApiClient');
jest.mock('@/services/firebase/PerformanceService');
jest.mock('@/services/ObservabilityService');

describe('RateHistoryService', () => {
  let mockTrace: {
    putMetric: jest.Mock;
    putAttribute: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTrace = {
      putMetric: jest.fn(),
      putAttribute: jest.fn(),
    };

    (performanceService.startTrace as jest.Mock).mockResolvedValue(mockTrace);
    (performanceService.stopTrace as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getCurrencyHistory', () => {
    const mockCurrencyHistory: RateHistory = {
      currency: 'USDT',
      history: [
        {
          date: '2026-02-01',
          price: 45.5,
          buy: 45.4,
          sell: 45.6,
          timestamp: '2026-02-01T12:00:00Z',
        },
        {
          date: '2026-02-02',
          price: 46.0,
          buy: 45.9,
          sell: 46.1,
          timestamp: '2026-02-02T12:00:00Z',
        },
        {
          date: '2026-02-03',
          price: 46.5,
          buy: 46.4,
          sell: 46.6,
          timestamp: '2026-02-03T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 30,
        total: 3,
        totalPages: 1,
      },
    };

    it('should fetch currency history successfully with defaults', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockCurrencyHistory);

      const result = await rateHistoryService.getCurrencyHistory('USDT');

      expect(performanceService.startTrace).toHaveBeenCalledWith('rate_history_fetch');
      expect(apiClient.get).toHaveBeenCalledWith('/api/rates/history/USDT', {
        params: { page: '1', limit: '30' },
      });
      expect(mockTrace.putMetric).toHaveBeenCalledWith('history_points', 3);
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('currency', 'USDT');
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('page', '1');
      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
      expect(result).toEqual(mockCurrencyHistory);
    });

    it('should fetch currency history successfully with custom page and limit', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockCurrencyHistory);

      const result = await rateHistoryService.getCurrencyHistory('USDT', 2, 50);

      expect(apiClient.get).toHaveBeenCalledWith('/api/rates/history/USDT', {
        params: { page: '2', limit: '50' },
      });
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('currency', 'USDT');
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('page', '2');
      expect(result).toEqual(mockCurrencyHistory);
    });

    it('should handle errors and log them to observability service', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getCurrencyHistory('BTC', 1, 30)).rejects.toThrow(
        'Network error',
      );

      expect(observabilityService.captureError).toHaveBeenCalledWith(mockError, {
        context: 'RateHistoryService.getCurrencyHistory',
        symbol: 'BTC',
        page: 1,
        limit: 30,
      });
      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
    });

    it('should handle errors with default parameters', async () => {
      const mockError = new Error('API error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getCurrencyHistory('USD')).rejects.toThrow('API error');

      expect(observabilityService.captureError).toHaveBeenCalledWith(mockError, {
        context: 'RateHistoryService.getCurrencyHistory',
        symbol: 'USD',
        page: 1,
        limit: 30,
      });
    });

    it('should call stopTrace even when error occurs', async () => {
      const mockError = new Error('Test error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getCurrencyHistory('COP')).rejects.toThrow();

      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
    });
  });

  describe('getBankHistory', () => {
    const mockBankHistory: BankRateHistory = {
      bank: 'Banesco',
      history: [
        {
          bank: 'Banesco',
          currency: 'USD',
          currencyName: 'Dólar Americano',
          buy: 44.0,
          sell: 44.5,
          average: 44.25,
          spread: 0.5,
          spreadPercent: 1.13,
          indicatorDate: '2026-01-01',
          timestamp: '2026-01-01T10:00:00Z',
        },
        {
          bank: 'Banesco',
          currency: 'USD',
          currencyName: 'Dólar Americano',
          buy: 45.0,
          sell: 45.5,
          average: 45.25,
          spread: 0.5,
          spreadPercent: 1.11,
          indicatorDate: '2026-01-15',
          timestamp: '2026-01-15T10:00:00Z',
        },
        {
          bank: 'Banesco',
          currency: 'USD',
          currencyName: 'Dólar Americano',
          buy: 46.0,
          sell: 46.5,
          average: 46.25,
          spread: 0.5,
          spreadPercent: 1.08,
          indicatorDate: '2026-02-01',
          timestamp: '2026-02-01T10:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 30,
        total: 3,
        totalPages: 1,
      },
    };

    it('should fetch bank history successfully with defaults', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockBankHistory);

      const result = await rateHistoryService.getBankHistory('Banesco');

      expect(performanceService.startTrace).toHaveBeenCalledWith('bank_rate_history_fetch');
      expect(apiClient.get).toHaveBeenCalledWith('/api/rates/banks/history/Banesco', {
        params: { page: '1', limit: '30' },
      });
      expect(mockTrace.putMetric).toHaveBeenCalledWith('history_points', 3);
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('bank', 'Banesco');
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('page', '1');
      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
      expect(result).toEqual(mockBankHistory);
    });

    it('should fetch bank history successfully with custom page and limit', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue(mockBankHistory);

      const result = await rateHistoryService.getBankHistory('BNC', 2, 50);

      expect(apiClient.get).toHaveBeenCalledWith('/api/rates/banks/history/BNC', {
        params: { page: '2', limit: '50' },
      });
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('bank', 'BNC');
      expect(mockTrace.putAttribute).toHaveBeenCalledWith('page', '2');
      expect(result).toEqual(mockBankHistory);
    });

    it('should handle errors and log them to observability service', async () => {
      const mockError = new Error('Bank not found');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getBankHistory('InvalidBank', 1, 30)).rejects.toThrow(
        'Bank not found',
      );

      expect(observabilityService.captureError).toHaveBeenCalledWith(mockError, {
        context: 'RateHistoryService.getBankHistory',
        bank: 'InvalidBank',
        page: 1,
        limit: 30,
      });
      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
    });

    it('should handle errors with default parameters', async () => {
      const mockError = new Error('Server error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getBankHistory('Mercantil')).rejects.toThrow('Server error');

      expect(observabilityService.captureError).toHaveBeenCalledWith(mockError, {
        context: 'RateHistoryService.getBankHistory',
        bank: 'Mercantil',
        page: 1,
        limit: 30,
      });
    });

    it('should call stopTrace even when error occurs', async () => {
      const mockError = new Error('Test error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(rateHistoryService.getBankHistory('TestBank')).rejects.toThrow();

      expect(performanceService.stopTrace).toHaveBeenCalledWith(mockTrace);
    });
  });

  describe('getMinMaxValues', () => {
    it('should calculate min and max values with padding', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 50.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 48.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.getMinMaxValues(data);

      // Min = 45, Max = 50, Diff = 5, Padding = 5 * 0.05 = 0.25
      // Expected Min = 45 - 0.25 = 44.75
      // Expected Max = 50 + 0.25 = 50.25
      expect(result.min).toBeCloseTo(44.75);
      expect(result.max).toBeCloseTo(50.25);
    });

    it('should return zero values for empty array', () => {
      const result = rateHistoryService.getMinMaxValues([]);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
    });

    it('should return zero values for null/undefined data', () => {
      // @ts-expect-error Testing undefined input
      const resultUndefined = rateHistoryService.getMinMaxValues(undefined);
      expect(resultUndefined.min).toBe(0);
      expect(resultUndefined.max).toBe(0);

      // @ts-expect-error Testing null input
      const resultNull = rateHistoryService.getMinMaxValues(null);
      expect(resultNull.min).toBe(0);
      expect(resultNull.max).toBe(0);
    });

    it('should handle single data point', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
      ];

      const result = rateHistoryService.getMinMaxValues(data);

      // Min = Max = 45, Diff = 0, Padding = 0
      expect(result.min).toBe(45);
      expect(result.max).toBe(45);
    });

    it('should not return negative min values', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 0.5, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 1.0, timestamp: '2026-02-02T12:00:00Z' },
      ];

      const result = rateHistoryService.getMinMaxValues(data);

      // Min = 0.5, Max = 1.0, Diff = 0.5, Padding = 0.025
      // Calculated Min = 0.5 - 0.025 = 0.475
      // Expected Min = max(0, 0.475) = 0.475
      expect(result.min).toBeGreaterThanOrEqual(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    it('should ensure min is never negative even with small values', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 0.1, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 0.2, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 10.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.getMinMaxValues(data);

      // Padding could push min below 0, but it should be clamped at 0
      expect(result.min).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatForChart', () => {
    it('should format data points for chart display', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01T12:00:00Z', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02T12:00:00Z', price: 46.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03T12:00:00Z', price: 47.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.formatForChart(data);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('x');
      expect(result[0]).toHaveProperty('y');
      expect(result[0].y).toBe(45.0);
      expect(result[1].y).toBe(46.0);
      expect(result[2].y).toBe(47.0);
    });

    it('should format dates in Spanish locale', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-15T12:00:00Z', price: 45.0, timestamp: '2026-02-15T12:00:00Z' },
      ];

      const result = rateHistoryService.formatForChart(data);

      // Date should be formatted as "feb 15" or similar in Spanish
      expect(result[0].x).toBeTruthy();
      expect(typeof result[0].x).toBe('string');
    });

    it('should handle empty array', () => {
      const result = rateHistoryService.formatForChart([]);

      expect(result).toEqual([]);
    });

    it('should preserve value precision', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01T12:00:00Z', price: 45.123456, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02T12:00:00Z', price: 46.789012, timestamp: '2026-02-02T12:00:00Z' },
      ];

      const result = rateHistoryService.formatForChart(data);

      expect(result[0].y).toBe(45.123456);
      expect(result[1].y).toBe(46.789012);
    });
  });

  describe('calculatePeriodChange', () => {
    it('should calculate positive percentage change', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 40.0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 45.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 50.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      // (50 - 40) / 40 * 100 = 25%
      expect(result).toBe(25);
    });

    it('should calculate negative percentage change', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 50.0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 45.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 40.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      // (40 - 50) / 50 * 100 = -20%
      expect(result).toBe(-20);
    });

    it('should return null for empty array', () => {
      const result = rateHistoryService.calculatePeriodChange([]);

      expect(result).toBeNull();
    });

    it('should return null for null/undefined data', () => {
      // @ts-expect-error Testing undefined input
      const resultUndefined = rateHistoryService.calculatePeriodChange(undefined);
      expect(resultUndefined).toBeNull();

      // @ts-expect-error Testing null input
      const resultNull = rateHistoryService.calculatePeriodChange(null);
      expect(resultNull).toBeNull();
    });

    it('should return null for single data point', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      expect(result).toBeNull();
    });

    it('should return null when first value is zero', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 45.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 50.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      expect(result).toBeNull();
    });

    it('should handle zero change (same first and last value)', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 45.0, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 50.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 45.0, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      // (45 - 45) / 45 * 100 = 0%
      expect(result).toBe(0);
    });

    it('should calculate precise percentage with decimal values', () => {
      const data: HistoryDataPoint[] = [
        { date: '2026-02-01', price: 45.5, timestamp: '2026-02-01T12:00:00Z' },
        { date: '2026-02-02', price: 46.0, timestamp: '2026-02-02T12:00:00Z' },
        { date: '2026-02-03', price: 50.05, timestamp: '2026-02-03T12:00:00Z' },
      ];

      const result = rateHistoryService.calculatePeriodChange(data);

      // (50.05 - 45.5) / 45.5 * 100 = 10%
      expect(result).toBeCloseTo(10, 1);
    });
  });
});
