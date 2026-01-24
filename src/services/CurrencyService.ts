import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';
import { observabilityService } from './ObservabilityService';

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
  source?: string;
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
    average?: {
      value: number;
      percent: number;
      direction: string;
    };
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

interface ApiBankRate {
  bank: string;
  buy: number;
  sell: number;
  indicatorDate: string;
}

interface ApiBankRatesResponse {
  rates: ApiBankRate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
                 let iconName = 'currency-usd';
    
                 // Standardize names and icons based on currency code
                 const sourceLabel = apiRate.source || 'BCV';
                 name = `${apiRate.currency}/VES • ${sourceLabel}`;

                 switch(apiRate.currency) {
                     case 'EUR': iconName = 'currency-eur'; break;
                     case 'USD': iconName = 'currency-usd'; break;
                     case 'CNY': iconName = 'currency-cny'; break;
                     case 'RUB': iconName = 'currency-rub'; break;
                     case 'TRY': iconName = 'currency-try'; break;
                     case 'GBP': iconName = 'currency-gbp'; break;
                     case 'JPY': iconName = 'currency-jpy'; break;
                     case 'BRL': iconName = 'currency-brl'; break;
                     case 'INR': iconName = 'currency-inr'; break;
                     case 'KRW': iconName = 'currency-krw'; break;
                     default: iconName = 'currency-usd';
                 }
    
                 rates.push({
                     id: String(index),
                     code: apiRate.currency,
                     name: name,
                     value: CurrencyService.parseRate(apiRate.rate?.average),
                     changePercent: CurrencyService.parsePercentage(apiRate.change?.average?.percent || apiRate.change?.percent), 
                     type: 'fiat',
                     iconName: iconName,
                     lastUpdated: apiRate.date || new Date().toISOString(),
                     source: sourceLabel,
                     buyValue: CurrencyService.parseRate(apiRate.rate?.buy),
                     sellValue: CurrencyService.parseRate(apiRate.rate?.sell),
                     buyChangePercent: CurrencyService.parsePercentage(apiRate.change?.buy?.percent),
                     sellChangePercent: CurrencyService.parsePercentage(apiRate.change?.sell?.percent)
                 });
            });
        }

        // 1.5 Process Border Rates
        if (response.border) {
            response.border.forEach((apiRate, index) => {
                 let name = apiRate.currency;
                 let iconName = 'currency-usd';
    
                 // Standardize names and icons based on currency code
                 const sourceLabel = apiRate.source || 'Fronterizo';
                 name = `${apiRate.currency}/VES • ${sourceLabel}`;

                 switch(apiRate.currency) {
                     case 'EUR': iconName = 'currency-eur'; break;
                     case 'USD': iconName = 'currency-usd'; break;
                     case 'CNY': iconName = 'currency-cny'; break;
                     case 'RUB': iconName = 'currency-rub'; break;
                     case 'TRY': iconName = 'currency-try'; break;
                     case 'GBP': iconName = 'currency-gbp'; break;
                     case 'JPY': iconName = 'currency-jpy'; break;
                     case 'COP': iconName = 'currency-usd'; break;
                     case 'BRL': iconName = 'currency-brl'; break;
                     case 'DAI': iconName = 'currency-dai'; break;
                     case 'VES': iconName = 'Bs'; break;
                     default: iconName = 'currency-usd';
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
                     source: sourceLabel,
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
                const currencyCode = cryptoItem.currency.toUpperCase();
                let name = currencyCode;
                let iconName = 'currency-bitcoin';
                
                const sourceLabel = cryptoItem.source || 'P2P';
                
                switch(currencyCode) {
                    case 'USDT': name = `USDT • ${sourceLabel}`; iconName = 'alpha-t-circle-outline'; break;
                    case 'BTC': name = `Bitcoin • ${sourceLabel}`; iconName = 'currency-btc'; break;
                    case 'VES': name = `Bolívar • ${sourceLabel}`; iconName = 'Bs'; break;
                    case 'ETH': name = `Ethereum • ${sourceLabel}`; iconName = 'ethereum'; break;
                    case 'USDC': name = `USDC • ${sourceLabel}`; iconName = 'alpha-u-circle-outline'; break;
                    case 'BNB': name = `BNB • ${sourceLabel}`; iconName = 'hexagon-slice-6'; break;
                    case 'DAI': name = `DAI • ${sourceLabel}`; iconName = 'alpha-d-circle-outline'; break;
                    case 'FDUSD': name = `FDUSD • ${sourceLabel}`; iconName = 'alpha-f-circle-outline'; break;
                    case 'BUSD': name = `BUSD • ${sourceLabel}`; iconName = 'alpha-b-circle-outline'; break;
                    case 'LTC': name = `Litecoin • ${sourceLabel}`; iconName = 'litecoin'; break;
                    case 'DOGE': name = `Dogecoin • ${sourceLabel}`; iconName = 'dog'; break;
                    default: name = `${currencyCode} • ${sourceLabel}`; iconName = 'currency-btc';
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
                    source: sourceLabel,
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
                iconName: 'Bs', // Custom icon for base
                lastUpdated: new Date().toISOString()
             });
        }

        this.currentRates = rates;
        this.lastFetch = Date.now();
        this.notifyListeners(rates);

        return rates;

    } catch (e) {
        observabilityService.captureError(e);
        trace.putAttribute('error', 'true');
        
        // If we have stale data in memory, return it but warn
        if (this.currentRates.length > 0) {
            this.notifyListeners([...this.currentRates]);
            return this.currentRates;
        }
        
        throw e;
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
   * Obtiene tasas bancarias con paginación
   */
  static async getBankRates(page = 1, limit = 15): Promise<{ rates: CurrencyRate[], pagination: ApiBankRatesResponse['pagination'] }> {
    const trace = await performanceService.startTrace('get_bank_rates_service');
    try {
        const response = await apiClient.get<ApiBankRatesResponse>('api/rates/banks', {
            params: { page, limit },
            useCache: false
        });

        if (!response || !response.rates) {
            return { rates: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } };
        }

        const rates: CurrencyRate[] = response.rates.map((rate, index) => ({
            id: `bank_${rate.bank.replace(/\s+/g, '_')}_${index}`,
            code: 'USD', 
            name: rate.bank,
            value: (rate.buy + rate.sell) / 2,
            changePercent: 0, 
            type: 'fiat',
            iconName: 'account-balance',
            lastUpdated: rate.indicatorDate,
            source: rate.bank,
            buyValue: rate.buy,
            sellValue: rate.sell,
        }));

        return { rates, pagination: response.pagination };

    } catch (e) {
        observabilityService.captureError(e);
        return {
            rates: [],
            pagination: { page, limit, total: 0, totalPages: 1 }
        };
    } finally {
        await performanceService.stopTrace(trace);
    }
  }

  /**
   * Convierte un monto de una divisa base a VES
   */
  static convert(amount: number, rateValue: number): number {
    if (amount < 0) throw new Error("Amount cannot be negative");
    return amount * rateValue;
  }

  /**
   * Returns available target currencies based on business rules for a given source currency.
   * Rules:
   * 1. VES/Bs -> All currencies allowed.
   * 2. Fiat (BCV) -> VES/Bs OR Crypto allowed.
   * 3. Border -> VES/Bs OR Stablecoins (USDT, USDC, DAI, FDUSD) allowed.
   * 4. Crypto -> VES/Bs, Border OR Crypto allowed.
   */
  static getAvailableTargetRates(source: CurrencyRate, allRates: CurrencyRate[]): CurrencyRate[] {
    // Rule 1: VES -> All
    if (source.code === 'VES' || source.code === 'Bs') return allRates;

    // Rule 2: BCV (Fiat) -> VES or Crypto
    if (source.type === 'fiat') {
        return allRates.filter(r => r.code === 'VES' || r.code === 'Bs' || r.type === 'crypto');
    }

    // Rule 3: Border -> VES or Stablecoins
    if (source.type === 'border') {
        return allRates.filter(r => 
            r.code === 'VES' || 
            r.code === 'Bs' || 
            (r.type === 'crypto' && STABLECOINS.includes(r.code))
        );
    }

    // Rule 4: Crypto -> VES, Border or Crypto
    if (source.type === 'crypto') {
        return allRates.filter(r => 
            r.code === 'VES' || 
            r.code === 'Bs' || 
            r.type === 'border' ||
            r.type === 'crypto'
        );
    }

    return allRates;
  }
}
