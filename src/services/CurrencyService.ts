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

const MOCK_RATES: CurrencyRate[] = [
  // ... (Keep mocks for fallback)
  {
    id: '1',
    code: 'USD',
    name: 'Dólar Estadounidense (BCV)',
    value: 36.58,
    changePercent: 0.14,
    type: 'fiat',
    iconName: 'account-balance',
    lastUpdated: new Date().toISOString(),
  },
  // ... (Other mocks can be kept or removed, keeping just one for brevity in this example)
];

export class CurrencyService {
  /**
   * Obtiene tasas de cambio desde la API con protección App Check
   */
  static async getRates(): Promise<CurrencyRate[]> {
    const trace = await performanceService.startTrace('get_currency_rates');
    try {
        // Attempt to fetch from real API
        // Assuming endpoint is /rates, adjust as needed
        // const response = await apiClient.get<CurrencyRate[]>('rates');
        // return response;
        
        // For demonstration/fallback, we still use mocks but simulate the call
        await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
        
        // Use trace
        trace.putAttribute('source', 'mock');
        
        return [...MOCK_RATES];
    } catch (error) {
        console.error('Error fetching rates:', error);
        trace.putAttribute('error', 'true');
        return [...MOCK_RATES]; // Fallback to mock
    } finally {
        await performanceService.stopTrace(trace);
    }
  }


  /**
   * Busca divisas por código o nombre
   */
  static async searchCurrencies(query: string): Promise<CurrencyRate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) {
          resolve([...MOCK_RATES]);
          return;
        }

        const filtered = MOCK_RATES.filter(rate => 
          rate.code.toLowerCase().includes(lowerQuery) || 
          rate.name.toLowerCase().includes(lowerQuery)
        );
        resolve(filtered);
      }, 300); // Faster response for search
    });
  }

  /**
   * Convierte un monto de una divisa base a VES (o viceversa si se implementara lógica compleja)
   * Por simplicidad, asumimos conversión a VES basado en el value (tasa)
   */
  static convert(amount: number, rateValue: number): number {
    if (amount < 0) throw new Error("Amount cannot be negative");
    return amount * rateValue;
  }
}
