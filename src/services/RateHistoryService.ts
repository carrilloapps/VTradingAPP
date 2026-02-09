import { apiClient } from '@/services/ApiClient';
import { performanceService } from '@/services/firebase/PerformanceService';
import { observabilityService } from '@/services/ObservabilityService';

export interface HistoryDataPoint {
  price: number;
  buy?: number;
  sell?: number;
  date: string;
  timestamp: string;
}

export interface BankHistoryDataPoint {
  bank: string;
  currency: string;
  currencyName: string;
  buy: number;
  sell: number;
  average: number;
  spread: number;
  spreadPercent: number;
  indicatorDate: string;
  timestamp: string;
  change?: {
    buy?: { value?: number; percent?: number };
    sell?: { value?: number; percent?: number };
    average?: { value?: number; percent?: number };
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RateHistory {
  currency: string;
  history: HistoryDataPoint[];
  pagination: PaginationInfo;
}

export interface BankRateHistory {
  bank: string;
  history: BankHistoryDataPoint[];
  pagination: PaginationInfo;
}

/**
 * Service for fetching currency and bank rate history
 */
class RateHistoryService {
  /**
   * Get rate history for a specific currency
   * @param symbol Currency code (e.g., 'USDT', 'USD', 'COP', 'BTC')
   * @param page Optional page number (default: 1)
   * @param limit Optional items per page (default: 30)
   * @returns Promise with rate history data
   */
  async getCurrencyHistory(
    symbol: string,
    page: number = 1,
    limit: number = 30,
  ): Promise<RateHistory> {
    const trace = await performanceService.startTrace('rate_history_fetch');

    try {
      const endpoint = `/api/rates/history/${symbol}`;
      const options = { params: { page: page.toString(), limit: limit.toString() } };

      const response = await apiClient.get<RateHistory>(endpoint, options);

      trace.putMetric('history_points', response.history.length);
      trace.putAttribute('currency', symbol);
      trace.putAttribute('page', page.toString());

      return response;
    } catch (error) {
      observabilityService.captureError(error, {
        context: 'RateHistoryService.getCurrencyHistory',
        symbol,
        page,
        limit,
      });
      throw error;
    } finally {
      await performanceService.stopTrace(trace);
    }
  }

  /**
   * Get rate history for a specific bank
   * @param bank Bank name (e.g., 'Banesco', 'BNC', 'Mercantil')
   * @param page Optional page number (default: 1)
   * @param limit Optional items per page (default: 30)
   * @returns Promise with bank rate history data
   */
  async getBankHistory(
    bank: string,
    page: number = 1,
    limit: number = 30,
  ): Promise<BankRateHistory> {
    const trace = await performanceService.startTrace('bank_rate_history_fetch');

    try {
      const endpoint = `/api/rates/banks/history/${bank}`;
      const options = { params: { page: page.toString(), limit: limit.toString() } };

      const response = await apiClient.get<BankRateHistory>(endpoint, options);

      trace.putMetric('history_points', response.history.length);
      trace.putAttribute('bank', bank);
      trace.putAttribute('page', page.toString());

      return response;
    } catch (error) {
      observabilityService.captureError(error, {
        context: 'RateHistoryService.getBankHistory',
        bank,
        page,
        limit,
      });
      throw error;
    } finally {
      await performanceService.stopTrace(trace);
    }
  }

  /**
   * Calculate min/max values from history data for chart scaling
   */
  getMinMaxValues(data: HistoryDataPoint[]): { min: number; max: number } {
    if (!data || data.length === 0) {
      return { min: 0, max: 0 };
    }

    const values = data.map(point => point.price);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add 5% padding for better visualization
    const padding = (max - min) * 0.05;

    return {
      min: Math.max(0, min - padding),
      max: max + padding,
    };
  }

  /**
   * Format history data for chart libraries
   */
  formatForChart(data: HistoryDataPoint[]): Array<{ x: string; y: number }> {
    return data.map(point => ({
      x: new Date(point.date).toLocaleDateString('es-VE', {
        month: 'short',
        day: 'numeric',
      }),
      y: point.price,
    }));
  }

  /**
   * Calculate percentage change between first and last data points
   */
  calculatePeriodChange(data: HistoryDataPoint[]): number | null {
    if (!data || data.length < 2) {
      return null;
    }

    const first = data[0].price;
    const last = data[data.length - 1].price;

    if (first === 0) return null;

    return ((last - first) / first) * 100;
  }
}

export const rateHistoryService = new RateHistoryService();
