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
  {
    id: '2',
    code: 'EUR',
    name: 'Euro (Oficial)',
    value: 39.42,
    changePercent: -0.05,
    type: 'fiat',
    iconName: 'euro',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    code: 'USDT',
    name: 'Tether (P2P Promedio)',
    value: 38.12,
    changePercent: 1.12,
    type: 'crypto',
    iconName: 'monetization-on',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    code: 'BTC',
    name: 'Bitcoin',
    value: 2345901.00,
    changePercent: 2.45,
    type: 'crypto',
    iconName: 'currency-bitcoin',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '5',
    code: 'ETH',
    name: 'Ethereum',
    value: 120452.00,
    changePercent: -0.82,
    type: 'crypto',
    iconName: 'diamond',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '6',
    code: 'COP',
    name: 'Peso Colombiano',
    value: 0.0092,
    changePercent: 0.05,
    type: 'fiat',
    iconName: 'attach-money',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '7',
    code: 'BRL',
    name: 'Real Brasileño',
    value: 7.35,
    changePercent: -0.15,
    type: 'fiat',
    iconName: 'attach-money',
    lastUpdated: new Date().toISOString(),
  }
];

export class CurrencyService {
  /**
   * Simula la obtención de tasas de cambio con un pequeño delay
   */
  static async getRates(): Promise<CurrencyRate[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...MOCK_RATES]);
      }, 800); // 800ms delay to simulate network
    });
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
