import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';

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

  private static notifyListeners(stocks: StockData[]) {
    this.listeners.forEach(listener => listener(stocks));
  }

  private static getColorForStock(symbol: string): string {
    const colors = ['emerald', 'blue', 'orange', 'amber', 'indigo', 'rose', 'cyan', 'violet'];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

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
    if (typeof item.volume === 'number') {
        volumeStr = `${(item.volume / 1000).toFixed(1)}k`;
    } else if (item.volume && typeof item.volume === 'object' && item.volume.amount) {
         volumeStr = `${(item.volume.amount / 1000).toFixed(1)}k`;
    }

    return {
      id: item.symbol,
      symbol: item.symbol,
      name: item.name,
      price: this.parsePrice(item.price),
      changePercent: changePercent,
      initials: item.symbol.substring(0, 3),
      color: this.getColorForStock(item.symbol),
      volume: volumeStr,
      opening: this.parsePrice(item.openingPrice),
      iconUrl: item.meta?.iconUrl
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
     } catch (error) {
      console.error('Error fetching all stocks:', error);
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

      const newStocks: StockData[] = rawList.map((item, index) => this.mapStock(item));

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

    } catch (error) {
      console.error('Error fetching stocks:', error);
      trace.putAttribute('error', 'true');
      
      if (this.currentStocks.length === 0) {
         // Fallback logic remains for critical failures on empty state
         console.warn("Using fallback data due to API failure");
         const fallbackStocks: StockData[] = [
            { id: '1', symbol: 'BNC', name: 'Banco Nal. de Crédito', price: 0.0035, changePercent: 2.10, initials: 'BNC', color: 'emerald' },
            { id: '2', symbol: 'MVZ.A', name: 'Mercantil Serv. Fin.', price: 145.50, changePercent: -0.50, initials: 'MVZ', color: 'blue' }
         ];
         this.notifyListeners(fallbackStocks);
         return fallbackStocks;
      }
      
      throw error;
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

  static async getMarketIndex(): Promise<any> {
      // Logic to get the main index (IBC)
      // Could be part of getStocks response or separate endpoint
      try {
          // Re-using getStocks if it carries the index data in a real API
          await this.getStocks();
          // For now returning mock index structure that matches UI
          return {
              value: "55.230,12",
              changePercent: "1,2%",
              isPositive: true,
              volume: "12.5M",
              opening: "54.575,20"
          };
      } catch (e) {
          return null;
      }
  }
}
