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
  private static previousRates: Map<string, number> = new Map(); // Cache for change calculation
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
                 changePercent: null, 
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
                changePercent = sellData.percentage; 
            } else if (sellData) {
                usdtValue = sellData.currentAvg;
                changePercent = sellData.percentage;
            }

            if (usdtValue > 0) {
                rates.push({
                    id: 'usdt_p2p',
                    code: 'USDT',
                    name: 'Dólar (Tether)',
                    value: usdtValue,
                    changePercent: changePercent,
                    type: 'crypto',
                    iconName: 'currency-bitcoin',
                    lastUpdated: response.timestamp || new Date().toISOString()
                });
            }
        }
        
        // Ensure VES exists as base currency for calculations
        if (!rates.find(r => r.code === 'VES')) {
             rates.unshift({
                id: 'ves_base',
                code: 'VES',
                name: 'Bolívar Digital',
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
            const prevValue = this.previousRates.get(rate.code);
            
            // If API didn't provide change (0 or null) but we have history
            if ((rate.changePercent === 0 || rate.changePercent === null) && prevValue && prevValue !== 0) {
                // Calculate change: ((New - Old) / Old) * 100
                const change = ((rate.value - prevValue) / prevValue) * 100;
                // Only update if difference is significant (e.g. > 0.0001%) to avoid floating point noise
                if (Math.abs(change) > 0.0001) {
                    rate.changePercent = Number(change.toFixed(2));
                }
            }

            // Update cache for next time
            this.previousRates.set(rate.code, rate.value);
        });

        this.currentRates = rates;
        this.lastFetch = Date.now();
        this.notifyListeners(rates);

        return rates;

    } catch (error) {
        console.error('Error fetching rates:', error);
        trace.putAttribute('error', 'true');
        
        // If we have stale data in memory, return it but warn
        // Even if forceRefresh is true, we fallback to stale data on error to maintain UX
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
