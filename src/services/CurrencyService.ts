import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';

export interface CurrencyRate {
  id: string;
  code: string;
  name: string;
  value: number;
  changePercent: number;
  type: 'fiat' | 'crypto';
  iconName?: string;
  lastUpdated: string;
}

// API Response Interfaces
interface ApiRate {
  currency: string;
  rate: number;
}

interface BinanceP2PData {
    buy: {
        currentAvg: number;
        previousAvg: number;
        difference: number;
        percentage: number;
        direction: string;
    };
    sell: {
        currentAvg: number;
        previousAvg: number;
        difference: number;
        percentage: number;
        direction: string;
    };
}

interface ApiRatesResponse {
  source: string;
  rates: ApiRate[];
  publicationDate: string;
  binanceP2P?: BinanceP2PData;
  timestamp: string;
}

type CurrencyListener = (rates: CurrencyRate[]) => void;

export class CurrencyService {
  private static listeners: CurrencyListener[] = [];
  private static currentRates: CurrencyRate[] = [];
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 60 * 1000; // 1 minute in-memory throttle

  /**
   * Suscribe a listener to rate updates
   */
  static subscribe(listener: CurrencyListener): () => void {
    this.listeners.push(listener);
    // Immediately provide current data if available
    if (this.currentRates.length > 0) {
      listener(this.currentRates);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(rates: CurrencyRate[]) {
    this.listeners.forEach(listener => listener(rates));
  }

  /**
   * Obtiene tasas de cambio desde la API con caché y monitoreo.
   * Si forceRefresh es true, ignora el caché y busca datos frescos.
   */
  static async getRates(forceRefresh = false): Promise<CurrencyRate[]> {
    // Return in-memory data if valid and not forcing refresh
    if (!forceRefresh && this.currentRates.length > 0 && (Date.now() - this.lastFetch < this.CACHE_DURATION)) {
      return this.currentRates;
    }

    const trace = await performanceService.startTrace('get_currency_rates_service');
    try {
        // We use apiClient's cache as a fallback, but here we manage application state
        const response = await apiClient.get<ApiRatesResponse>('api/rates', {
            headers: {
                'Accept': '*/*',
                'X-API-Key': 'admin_key'
            },
            useCache: !forceRefresh, // Only use disk cache if not forcing refresh
            cacheTTL: 5 * 60 * 1000 // 5 minutes disk cache
        });

        if (!response || !response.rates) {
            throw new Error("Invalid API Response structure");
        }

        // Map API response to Internal Model
        const rates: CurrencyRate[] = response.rates.map((apiRate, index) => {
             let name = apiRate.currency;
             let type: 'fiat' | 'crypto' = 'fiat';
             let iconName = 'attach-money';

             // Standardize names and icons based on currency code
             // This is purely UI mapping, not data mocking
             switch(apiRate.currency) {
                 case 'EUR': name = 'Euro (BCV)'; iconName = 'euro'; break;
                 case 'USD': name = 'Dólar (BCV)'; iconName = 'attach-money'; break;
                 case 'CNY': name = 'Yuan (BCV)'; iconName = 'currency-yuan'; break;
                 case 'RUB': name = 'Rublo (BCV)'; iconName = 'currency-ruble'; break;
                 case 'TRY': name = 'Lira (BCV)'; iconName = 'account-balance'; break;
                 case 'GBP': name = 'Libra Esterlina'; iconName = 'currency-pound'; break;
                 case 'JPY': name = 'Yen Japonés'; iconName = 'currency-yen'; break;
                 default: iconName = 'attach-money';
             }

             return {
                 id: String(index),
                 code: apiRate.currency,
                 name: name,
                 value: apiRate.rate,
                 changePercent: 0, 
                 type: type,
                 iconName: iconName,
                 lastUpdated: response.publicationDate || new Date().toISOString()
             };
        });
        
        // Add Binance P2P USDT data if available (Real Data from API)
        if (response.binanceP2P && response.binanceP2P.sell) {
            const p2pData = response.binanceP2P.sell;
            rates.push({
                id: 'usdt_p2p',
                code: 'USDT',
                name: 'Dólar (Tether)',
                value: p2pData.currentAvg,
                changePercent: p2pData.percentage,
                type: 'crypto',
                iconName: 'currency-bitcoin',
                lastUpdated: response.timestamp || new Date().toISOString()
            });
        }
        
        // Ensure VES exists as base currency for calculations
        if (!rates.find(r => r.code === 'VES')) {
             rates.unshift({
                id: 'ves_base',
                code: 'VES',
                name: 'Bolívar Digital',
                value: 1,
                changePercent: 0,
                type: 'fiat',
                iconName: 'currency-exchange', // Distinct icon for base
                lastUpdated: new Date().toISOString()
             });
        }

        // Update state and notify
        this.currentRates = rates;
        this.lastFetch = Date.now();
        this.notifyListeners(rates);

        return rates;

    } catch (error) {
        console.error('Error fetching rates:', error);
        trace.putAttribute('error', 'true');
        
        // If we have stale data in memory, return it but warn
        if (this.currentRates.length > 0) {
            console.warn('Returning stale in-memory data due to fetch error');
            return this.currentRates;
        }
        
        // Propagate error to let UI handle "No Data" state
        throw error;
    } finally {
        await performanceService.stopTrace(trace);
    }
  }

  /**
   * Busca divisas por código o nombre
   */
  static async searchCurrencies(query: string): Promise<CurrencyRate[]> {
    const rates = await this.getRates();
    
    if (!query) return rates;

    const lowerQuery = query.toLowerCase().trim();
    return rates.filter(rate => 
      rate.code.toLowerCase().includes(lowerQuery) || 
      rate.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Convierte un monto de una divisa base a VES
   */
  static convert(amount: number, rateValue: number): number {
    if (amount < 0) throw new Error("Amount cannot be negative");
    return amount * rateValue;
  }
}
