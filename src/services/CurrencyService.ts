import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';

export const STABLECOINS = ['USDT', 'USDC', 'DAI', 'FDUSD'];

export interface CurrencyRate {
  id: string;
  code: string;
  name: string;
  value: number;
  changePercent: number | null;
  type: 'fiat' | 'crypto' | 'border';
  iconName?: string;
  lastUpdated: string;
  buyValue?: number;
  sellValue?: number;
  buyChangePercent?: number;
  sellChangePercent?: number;
}

// API Response Interfaces
interface ApiRateItem {
  currency: string;
  source: string;
  rate: {
    average?: number;
    buy?: number;
    sell?: number;
  };
  date: string;
  previousDate: string | null;
  change: {
    value?: number;
    percent?: number;
    direction?: string;
    buy?: {
      value: number;
      percent: number;
      direction: string;
    };
    sell?: {
      value: number;
      percent: number;
      direction: string;
    };
  };
}

interface ApiCryptoItem {
  currency: string;
  source: string;
  rate: {
    buy: number;
    sell: number;
  };
  date: string;
  previousDate: string | null;
  change: {
    buy: {
      value: number;
      percent: number;
      direction: string;
    };
    sell: {
      value: number;
      percent: number;
      direction: string;
    };
  };
}

interface ApiRatesResponse {
  rates: ApiRateItem[];
  crypto: ApiCryptoItem[];
  border: ApiRateItem[];
}

type CurrencyListener = (rates: CurrencyRate[]) => void;

export class CurrencyService {
  private static listeners: CurrencyListener[] = [];
  private static currentRates: CurrencyRate[] = [];
  // previousRates removed as requested to avoid manual calculation logic
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 0; // Disable in-memory cache

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

  private static parsePercentage(val: any): number {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return Number(num.toFixed(2));
  }

  private static parseRate(val: any): number {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
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
        // Header 'X-API-Key' is now handled by ApiClient default
        const response = await apiClient.get<ApiRatesResponse>('api/rates', {
            headers: {
                'Accept': '*/*',
            },
            params: forceRefresh ? { _t: Date.now() } : undefined, // Force fresh data from server
            useCache: false, // Disable cache as requested
            cacheTTL: 0
        });

        if (!response || (!response.rates && !response.crypto)) {
            throw new Error("Invalid API Response structure");
        }

        const rates: CurrencyRate[] = [];

        // 1. Process FIAT Rates
        if (response.rates) {
            response.rates.forEach((apiRate, index) => {
                 let name = apiRate.currency;
                 let iconName = 'attach-money';
    
                 // Standardize names and icons based on currency code
                 const sourceLabel = apiRate.source || 'BCV';
                 name = `${apiRate.currency}/VES • ${sourceLabel}`;

                 switch(apiRate.currency) {
                     case 'EUR': iconName = 'euro'; break;
                     case 'USD': iconName = 'attach-money'; break;
                     case 'CNY': iconName = 'currency-yuan'; break;
                     case 'RUB': iconName = 'currency-ruble'; break;
                     case 'TRY': iconName = 'account-balance'; break;
                     case 'GBP': iconName = 'currency-pound'; break;
                     case 'JPY': iconName = 'currency-yen'; break;
                     default: iconName = 'attach-money';
                 }
    
                 rates.push({
                     id: String(index),
                     code: apiRate.currency,
                     name: name,
                     value: CurrencyService.parseRate(apiRate.rate?.average),
                     changePercent: CurrencyService.parsePercentage(apiRate.change?.percent), 
                     type: 'fiat',
                     iconName: iconName,
                     lastUpdated: apiRate.date || new Date().toISOString(),
                     buyValue: CurrencyService.parseRate(apiRate.rate?.buy),
                     sellValue: CurrencyService.parseRate(apiRate.rate?.sell)
                 });
            });
        }

        // 1.5 Process Border Rates
        if (response.border) {
            response.border.forEach((apiRate, index) => {
                 let name = apiRate.currency;
                 let iconName = 'attach-money';
    
                 // Standardize names and icons based on currency code
                 const sourceLabel = apiRate.source || 'Fronterizo';
                 name = `${apiRate.currency}/VES • ${sourceLabel}`;

                 switch(apiRate.currency) {
                     case 'EUR': iconName = 'euro'; break;
                     case 'USD': iconName = 'attach-money'; break;
                     case 'CNY': iconName = 'currency-yuan'; break;
                     case 'RUB': iconName = 'currency-ruble'; break;
                     case 'TRY': iconName = 'account-balance'; break;
                     case 'GBP': iconName = 'currency-pound'; break;
                     case 'JPY': iconName = 'currency-yen'; break;
                     default: iconName = 'attach-money';
                 }

                 // Calculate values if average is missing (common in P2P/Border rates)
                 const buy = CurrencyService.parseRate(apiRate.rate?.buy);
                 const sell = CurrencyService.parseRate(apiRate.rate?.sell);
                 const avgValue = apiRate.rate?.average 
                    ? CurrencyService.parseRate(apiRate.rate.average) 
                    : (buy + sell) / 2;

                 // Handle Border Rate Inversion (Tasas Fronterizas are usually Foreign/VES)
                 // We need value in VES (Price of 1 Unit of Foreign Currency in VES) for the calculator logic.
                 // All border rates from API seem to be based on VES (Foreign/VES).
                 let finalValue = avgValue;
                 let finalBuy = buy;
                 let finalSell = sell;

                 if (avgValue > 0) finalValue = 1 / avgValue;
                 if (buy > 0) finalBuy = 1 / buy;
                 if (sell > 0) finalSell = 1 / sell;
                 
                 // Calculate change percent
                 let changePercent = 0;
                 if (apiRate.change?.percent !== undefined) {
                    changePercent = CurrencyService.parsePercentage(apiRate.change.percent);
                 } else {
                    const buyPercent = apiRate.change?.buy?.percent || 0;
                    const sellPercent = apiRate.change?.sell?.percent || 0;
                    changePercent = CurrencyService.parsePercentage((buyPercent + sellPercent) / 2);
                 }
    
                 rates.push({
                     id: `border_${index}`,
                     code: apiRate.currency,
                     name: name,
                     value: finalValue,
                     changePercent: changePercent, 
                     type: 'border',
                     iconName: iconName,
                     lastUpdated: apiRate.date || new Date().toISOString(),
                     buyValue: finalBuy,
                     sellValue: finalSell,
                     buyChangePercent: apiRate.change?.buy?.percent ? CurrencyService.parsePercentage(apiRate.change.buy.percent) : undefined,
                     sellChangePercent: apiRate.change?.sell?.percent ? CurrencyService.parsePercentage(apiRate.change.sell.percent) : undefined
                 });
            });
        }

        // 2. Process Crypto Rates
        if (response.crypto) {
            response.crypto.forEach((cryptoItem) => {
                let name = cryptoItem.currency;
                let iconName = 'currency-bitcoin';
                
                const sourceLabel = cryptoItem.source || 'P2P';
                
                switch(cryptoItem.currency) {
                    case 'USDT': name = `Tether • ${sourceLabel}`; iconName = 'currency-bitcoin'; break;
                    case 'BTC': name = `Bitcoin • ${sourceLabel}`; iconName = 'currency-bitcoin'; break;
                    case 'ETH': name = `Ethereum • ${sourceLabel}`; iconName = 'diamond'; break;
                    case 'USDC': name = `USD Coin • ${sourceLabel}`; iconName = 'attach-money'; break;
                    case 'BNB': name = `Binance Coin • ${sourceLabel}`; iconName = 'verified-user'; break;
                    default: name = `${cryptoItem.currency} • ${sourceLabel}`; iconName = 'currency-bitcoin';
                }

                // Calculate average value
                const buy = cryptoItem.rate?.buy || 0;
                const sell = cryptoItem.rate?.sell || 0;
                const avgValue = (buy + sell) / 2;
                
                // Calculate average change percent
                const buyPercent = cryptoItem.change?.buy?.percent || 0;
                const sellPercent = cryptoItem.change?.sell?.percent || 0;
                const avgChange = (buyPercent + sellPercent) / 2;

                rates.push({
                    id: `${cryptoItem.currency.toLowerCase()}_p2p`,
                    code: cryptoItem.currency,
                    name: name,
                    value: CurrencyService.parseRate(avgValue),
                    changePercent: CurrencyService.parsePercentage(avgChange),
                    type: 'crypto',
                    iconName: iconName,
                    lastUpdated: cryptoItem.date || new Date().toISOString(),
                    buyValue: CurrencyService.parseRate(cryptoItem.rate?.buy),
                    sellValue: CurrencyService.parseRate(cryptoItem.rate?.sell),
                    buyChangePercent: CurrencyService.parsePercentage(cryptoItem.change?.buy?.percent),
                    sellChangePercent: CurrencyService.parsePercentage(cryptoItem.change?.sell?.percent)
                });
            });
        }
        
        // Ensure VES exists as base currency for calculations
        if (!rates.find(r => r.code === 'VES')) {
             rates.unshift({
                id: 'ves_base',
                code: 'VES',
                name: 'Bolívar',
                value: 1,
                changePercent: null,
                type: 'fiat',
                iconName: 'currency-exchange', // Distinct icon for base
                lastUpdated: new Date().toISOString()
             });
        }

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
            this.notifyListeners([...this.currentRates]);
            return this.currentRates;
        }
        
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
