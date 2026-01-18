import { apiClient } from './ApiClient';
import { performanceService } from './firebase/PerformanceService';
import { AppConfig } from '../constants/AppConfig';

export interface CurrencyRate {
  id: string;
  code: string;
  name: string;
  value: number;
  changePercent: number | null;
  type: 'fiat' | 'crypto';
  iconName?: string;
  lastUpdated: string;
  buyValue?: number;
  sellValue?: number;
  buyChangePercent?: number;
  sellChangePercent?: number;
}

// API Response Interfaces
interface ApiRate {
  currency: string;
  rate: number;
  changePercent?: number; // Provided by API for official rates
}

interface BinanceP2PData {
    buy: {
        currentAvg: number;
        previousAvg: number;
        difference: number;
        percentage: number;
        direction: string;
        count?: number;
        startTime?: string;
        endTime?: string;
    };
    sell: {
        currentAvg: number;
        previousAvg: number;
        difference: number;
        percentage: number;
        direction: string;
        count?: number;
        startTime?: string;
        endTime?: string;
    };
    windowMinutes?: number;
}

interface BinanceAd {
    price: number;
    [key: string]: any;
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

  /**
   * Helper to fetch average price from Binance P2P for a specific asset
   */
  private static async fetchBinanceP2PPrice(asset: string): Promise<{ value: number; changePercent: number } | null> {
    try {
        // Fetch BUY and SELL orders in parallel
        // Note: We use page=1, rows=10 as requested
        const [buyResponse, sellResponse] = await Promise.all([
            apiClient.get<BinanceAd[]>('api/binance', {
                params: { asset, fiat: AppConfig.BASE_CURRENCY, tradeType: 'BUY', rows: 10, page: 1 },
                headers: { 'X-API-Key': 'admin_key' },
                useCache: false 
            }),
            apiClient.get<BinanceAd[]>('api/binance', {
                params: { asset, fiat: AppConfig.BASE_CURRENCY, tradeType: 'SELL', rows: 10, page: 1 },
                headers: { 'X-API-Key': 'admin_key' },
                useCache: false
            })
        ]);

        const calculateAverage = (ads: BinanceAd[]) => {
            if (!ads || !Array.isArray(ads) || ads.length === 0) return 0;
            const sum = ads.reduce((acc, ad) => acc + Number(ad.price), 0);
            return sum / ads.length;
        };

        const buyAvg = calculateAverage(buyResponse);
        const sellAvg = calculateAverage(sellResponse);

        if (buyAvg === 0 && sellAvg === 0) return null;

        // Average of averages (Buy & Sell)
        let finalValue = 0;
        if (buyAvg > 0 && sellAvg > 0) {
            finalValue = (buyAvg + sellAvg) / 2;
        } else {
            finalValue = buyAvg > 0 ? buyAvg : sellAvg;
        }

        return { value: finalValue, changePercent: 0 };

    } catch (error) {
        console.warn(`Error fetching P2P data for ${asset}:`, error);
        return null;
    }
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
            params: forceRefresh ? { _t: Date.now() } : undefined, // Force fresh data from server
            useCache: false, // Disable cache as requested
            cacheTTL: 0
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
                 case 'EUR': name = 'EUR/VES • BCV'; iconName = 'euro'; break;
                 case 'USD': name = 'USD/VES • BCV'; iconName = 'attach-money'; break;
                 case 'CNY': name = 'CNY/VES • BCV'; iconName = 'currency-yuan'; break;
                 case 'RUB': name = 'RUB/VES • BCV'; iconName = 'currency-ruble'; break;
                 case 'TRY': name = 'TRY/VES • BCV'; iconName = 'account-balance'; break;
                 case 'GBP': name = 'GBP/VES • BCV'; iconName = 'currency-pound'; break;
                 case 'JPY': name = 'JPY/VES • BCV'; iconName = 'currency-yen'; break;
                 default: iconName = 'attach-money';
             }

             // Calculate change from previous fetch OR use API provided value
             let changePercent: number | null = null;
             
             if (apiRate.changePercent !== undefined) {
                 changePercent = CurrencyService.parsePercentage(apiRate.changePercent);
             } else {
                 changePercent = 0; // Default to 0 if not provided
             }
             
             // Ensure changePercent is never null for numbers we want to display
             if (changePercent === null) changePercent = 0;
             
             // No cache update needed

             return {
                 id: String(index),
                 code: apiRate.currency,
                 name: name,
                 value: apiRate.rate,
                 changePercent: changePercent, 
                 type: type,
                 iconName: iconName,
                 lastUpdated: response.publicationDate || new Date().toISOString()
             };
        });
        
        // Add Binance P2P USDT data if available (Real Data from API)
        if (response.binanceP2P) {
            const sellData = response.binanceP2P.sell;
            const buyData = response.binanceP2P.buy;
            
            let usdtValue = 0;
            let changePercent: number | null = null;

            if (sellData && buyData) {
                // Calculate average between buy and sell as requested
                usdtValue = (sellData.currentAvg + buyData.currentAvg) / 2;
                changePercent = CurrencyService.parsePercentage(sellData.percentage); 
            } else if (sellData) {
                usdtValue = sellData.currentAvg;
                changePercent = CurrencyService.parsePercentage(sellData.percentage);
            } else if (buyData) {
                usdtValue = buyData.currentAvg;
                changePercent = CurrencyService.parsePercentage(buyData.percentage);
            }

            if (usdtValue > 0) {
                const usdtRate: CurrencyRate = {
                    id: 'usdt_p2p',
                    code: 'USDT',
                    name: 'USDT/VES • Tether',
                    value: usdtValue,
                    changePercent: changePercent !== null ? changePercent : 0,
                    type: 'crypto',
                    iconName: 'currency-bitcoin',
                    lastUpdated: response.timestamp || new Date().toISOString()
                };

                if (buyData) {
                    usdtRate.buyValue = buyData.currentAvg;
                    usdtRate.buyChangePercent = CurrencyService.parsePercentage(buyData.percentage);
                }
                if (sellData) {
                    usdtRate.sellValue = sellData.currentAvg;
                    usdtRate.sellChangePercent = CurrencyService.parsePercentage(sellData.percentage);
                }

                rates.push(usdtRate);
            }
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

        // Fetch additional crypto rates from Binance P2P (BTC, ETH, USDC, etc.)
        const extraCryptos = [
            { code: 'BTC', name: 'Bitcoin', icon: 'currency-bitcoin' },
            { code: 'ETH', name: 'Ethereum', icon: 'diamond' }, 
            { code: 'USDC', name: 'USD Coin', icon: 'attach-money' },
            { code: 'BNB', name: 'Binance Coin', icon: 'verified-user' },
            { code: 'USDT', name: 'Dólar (Tether)', icon: 'currency-bitcoin' } // Fallback/Alternative
        ];

        // Fetch in parallel but don't fail the whole request if one fails
        const cryptoResults = await Promise.all(
            extraCryptos.map(async (crypto) => {
                // Optimization: Don't fetch if already exists (e.g. USDT from api/rates)
                if (rates.find(r => r.code === crypto.code)) return null;

                const data = await this.fetchBinanceP2PPrice(crypto.code);
                if (data) {
                    return {
                        id: `${crypto.code.toLowerCase()}_p2p`,
                        code: crypto.code,
                        name: crypto.name,
                        value: data.value,
                        changePercent: data.changePercent,
                        type: 'crypto' as const,
                        iconName: crypto.icon,
                        lastUpdated: new Date().toISOString()
                    };
                }
                return null;
            })
        );

        // Add valid results to rates list
        cryptoResults.forEach(rate => {
            if (rate && !rates.find(r => r.code === rate.code)) {
                rates.push(rate);
            }
        });

        // Update state and notify
        // Calculate percentage changes based on previous cache if API returns 0
        rates.forEach(rate => {
            // No previousRates map used anymore
            
            // If API didn't provide change, it stays as 0 or null
            if ((rate.changePercent === 0 || rate.changePercent === null)) {
                 // Do nothing, keep it as is
            }

            // No cache update
        });

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
            // Notify listeners even with stale data so the UI "Last Updated" time refreshes,
            // confirming to the user that a check was performed (even if data didn't change/fetch failed)
            // Use a shallow copy to ensure React state updates trigger even if content is identical
            this.notifyListeners([...this.currentRates]);
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
