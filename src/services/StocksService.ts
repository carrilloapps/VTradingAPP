import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';
import { observabilityService } from './ObservabilityService';

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  initials: string;
  color: string;
  volume?: string;
  opening?: number;
  iconUrl?: string; // Add iconUrl support
  category: string;
  changeAmount?: number;
  volumeShares?: number;
  volumeAmount?: number;
}

interface ApiStock {
  symbol: string;
  name: string;
  price: number;
  changePercent?: number;
  change?: {
    amount: number;
    percent: number;
  };
  volume?: number | {
    shares: number;
    amount: number;
  };
  openingPrice?: number;
  category?: string; // Changed from sector to category
  meta?: {
    iconUrl?: string;
  };
}

interface ApiStocksResponse {
  count: number;
  data: ApiStock[]; // Changed to match "data" field in API doc
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  marketStatus?: {
    isOpen: boolean;
  };
  status?: {
    state: string; // "ABIERTO" | "CERRADO"
    date: string;
    lastUpdate: string;
  };
  stats?: {
    totalVolume: number;
    totalAmount: number;
    titlesUp: number;
    titlesDown: number;
    titlesUnchanged: number;
  };
  indices?: Array<{
    symbol: string;
    description: string;
    price: number;
    changeAmount: number;
    changePercent: number;
    volume: number;
    amountTraded: number;
    lastUpdate: string;
  }>;
  // Fallback for previous structure if API is mixed
  stocks?: ApiStock[];
  index?: any;
}

type StockListener = (stocks: StockData[]) => void;

export class StocksService {
  private static listeners: StockListener[] = [];
  private static currentStocks: StockData[] = [];
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // Pagination State
  private static currentPage = 1;
  private static totalPages = 1;
  private static isLoadingMore = false;

  // Market Status State
  private static marketOpen = false;

  static subscribe(listener: StockListener): () => void {
    this.listeners.push(listener);
    if (this.currentStocks.length > 0) {
      listener(this.currentStocks);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static isMarketOpen(): boolean {
    return this.marketOpen;
  }

  static hasMorePages(): boolean {
    return this.currentPage < this.totalPages;
  }

  private static notifyListeners(stocks: StockData[]) {
    this.listeners.forEach(listener => listener(stocks));
  }

  /* eslint-disable no-bitwise */
  private static getColorForStock(symbol: string): string {
    const colors = ['emerald', 'blue', 'orange', 'amber', 'indigo', 'rose', 'cyan', 'violet'];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  /* eslint-enable no-bitwise */

  private static parsePrice(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Handle comma as decimal separator
      const normalized = val.replace(',', '.');
      const num = Number(normalized);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private static mapStock(item: ApiStock): StockData {
    let changePercent = 0;
    if (item.changePercent !== undefined) {
      changePercent = this.parsePrice(item.changePercent);
    } else if (item.change && item.change.percent !== undefined) {
      changePercent = this.parsePrice(item.change.percent);
    }

    // Ensure changePercent is a valid number
    if (isNaN(changePercent)) {
      changePercent = 0;
    }

    // Ensure changePercent is a valid number
    if (isNaN(changePercent)) {
      changePercent = 0;
    }

    let volumeStr: string | undefined;
    let volShares = 0;
    let volAmount = 0;

    if (typeof item.volume === 'number') {
      volShares = item.volume;
      volumeStr = `${(item.volume / 1000).toFixed(1)}k`;
    } else if (item.volume && typeof item.volume === 'object') {
      if (item.volume.amount) {
        volAmount = item.volume.amount;
        volumeStr = `${(item.volume.amount / 1000).toFixed(1)}k`;
      }
      if (item.volume.shares) {
        volShares = item.volume.shares;
      }
    }

    let changeAmount = 0;
    if (item.change && item.change.amount !== undefined) {
      changeAmount = this.parsePrice(item.change.amount);
    }

    return {
      id: item.symbol,
      symbol: item.symbol,
      name: item.name,
      price: this.parsePrice(item.price),
      changePercent: changePercent,
      changeAmount: changeAmount,
      initials: item.symbol.substring(0, 3),
      color: this.getColorForStock(item.symbol),
      volume: volumeStr,
      volumeShares: volShares,
      volumeAmount: volAmount,
      opening: this.parsePrice(item.openingPrice),
      iconUrl: item.meta?.iconUrl,
      category: item.category || 'Otros'
    };
  }

  /**
    * Fetch all stocks for autocomplete (limit 500)
    */
  static async getAllStocks(): Promise<StockData[]> {
    try {
      const response = await apiClient.get<ApiStocksResponse>('api/bvc/market', {
        params: { page: 1, limit: 500 },
        useCache: false
      });
      const rawList = response.data || response.stocks || [];
      return rawList.map(item => this.mapStock(item));
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StocksService.getAllStocks',
        method: 'GET',
        endpoint: 'api/bvc/market'
      });
      return [];
    }
  }

  /**
   * Fetch stocks with pagination support
   */
  static async getStocks(forceRefresh = false, page = 1): Promise<StockData[]> {
    // If refreshing, reset pagination
    if (forceRefresh) {
      this.currentPage = 1;
      this.totalPages = 1;
      this.currentStocks = [];
    }

    // Cache check only for first page
    if (!forceRefresh && page === 1 && this.currentStocks.length > 0 && (Date.now() - this.lastFetch < this.CACHE_DURATION)) {
      return this.currentStocks;
    }

    if (page > 1 && page > this.totalPages) {
      return this.currentStocks; // No more pages
    }

    this.isLoadingMore = true;
    const trace = await performanceService.startTrace('get_stocks_service');
    try {
      // API Call with Pagination
      const response = await apiClient.get<ApiStocksResponse>('api/bvc/market', {
        params: { page, limit: 20 },
        useCache: !forceRefresh && page === 1,
        updateCache: forceRefresh && page === 1
      });

      // Handle both "data" (standard) and "stocks" (legacy/fallback) fields
      const rawList = response.data || response.stocks || [];

      // Update Market Status
      if (response.status && response.status.state) {
        this.marketOpen = response.status.state.toUpperCase() === 'ABIERTO';
      } else if (response.marketStatus) {
        this.marketOpen = response.marketStatus.isOpen;
      }

      // Update Pagination Info
      if (response.pagination) {
        this.totalPages = response.pagination.totalPages;
        this.currentPage = response.pagination.page;
      }

      const newStocks: StockData[] = rawList.map((item, _index) => this.mapStock(item));

      if (page === 1) {
        this.currentStocks = newStocks;
      } else {
        // Append unique items
        const existingIds = new Set(this.currentStocks.map(s => s.id));
        const uniqueNew = newStocks.filter(s => !existingIds.has(s.id));
        this.currentStocks = [...this.currentStocks, ...uniqueNew];
      }

      this.lastFetch = Date.now();
      this.notifyListeners(this.currentStocks);
      return this.currentStocks;

    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StocksService.fetchAllStocks',
        method: 'GET',
        endpoint: 'api/bvc/market',
        hasCachedData: this.currentStocks.length > 0,
        lastFetch: this.lastFetch
      });
      // Error fetching stocks

      // Fallback: Return cached if available even if expired, or empty
      if (this.currentStocks.length > 0) {
        // Using fallback data due to API failure
        return this.currentStocks;
      }

      throw e;
    } finally {
      this.isLoadingMore = false;
      await performanceService.stopTrace(trace);
    }
  }

  static async loadMore(): Promise<void> {
    if (!this.isLoadingMore && this.currentPage < this.totalPages) {
      await this.getStocks(false, this.currentPage + 1);
    }
  }

  private static formatCurrency(value: number): string {
    const parts = value.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  }

  static async getMarketIndex(): Promise<any> {
    try {
      // Fetch real market data
      const response = await apiClient.get<ApiStocksResponse>('api/bvc/market', {
        useCache: true, // Use cache for index as well
        params: { limit: 1 } // We just need metadata if possible, but endpoint might return all
      });

      const ibcData = response.indices?.find(i => i.symbol === 'IBC');
      const stats = response.stats;

      if (ibcData) {
        const value = ibcData.price;
        const changePercent = ibcData.changePercent;
        const changeAmount = ibcData.changeAmount;

        // Use totalAmount from stats if available, otherwise 0
        // The user said "total amount" is in stats.
        const totalAmount = stats?.totalAmount || 0;

        // Format volume (Total Amount in VES)
        const volumeStr = this.formatCurrency(totalAmount);

        // Provide stats
        const marketStats = stats ? {
          titlesUp: stats.titlesUp,
          titlesDown: stats.titlesDown,
          titlesUnchanged: stats.titlesUnchanged,
          totalVolume: stats.totalVolume, // Shares
          totalAmount: stats.totalAmount  // Money
        } : undefined;

        return {
          value: this.formatCurrency(value),
          changePercent: `${this.formatCurrency(changePercent)}%`,
          isPositive: changeAmount >= 0,
          volume: volumeStr, // Displaying Total Amount in VES as "Volume" in Hero
          stats: marketStats,
          statusState: response.status?.state,
          updateDate: response.status?.date || new Date().toLocaleDateString('es-VE')
        };
      }

      // Fallback if no IBC data found in indices (should not happen with correct API)
      return null;
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'StocksService.getIBC',
        method: 'GET',
        endpoint: 'api/bvc/indices'
      });
      return null;
    }
  }
}
