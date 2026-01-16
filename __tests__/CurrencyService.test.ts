import { CurrencyService } from '../src/services/CurrencyService';

describe('CurrencyService', () => {
  it('should fetch rates', async () => {
    const rates = await CurrencyService.getRates();
    expect(rates).toBeDefined();
    expect(rates.length).toBeGreaterThan(0);
    expect(rates[0]).toHaveProperty('code');
    expect(rates[0]).toHaveProperty('value');
  });

  it('should search currencies by code', async () => {
    const results = await CurrencyService.searchCurrencies('USD');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code).toBe('USD');
  });

  it('should search currencies by name', async () => {
    const results = await CurrencyService.searchCurrencies('Bitcoin');
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Bitcoin');
  });

  it('should return empty array for non-matching search', async () => {
    const results = await CurrencyService.searchCurrencies('XYZ123');
    expect(results).toBeDefined();
    expect(results.length).toBe(0);
  });

  it('should convert amounts correctly', () => {
    const rate = 36.58;
    const amount = 100;
    const result = CurrencyService.convert(amount, rate);
    expect(result).toBe(3658);
  });

  it('should throw error for negative amounts', () => {
    expect(() => {
      CurrencyService.convert(-10, 36.58);
    }).toThrow("Amount cannot be negative");
  });
});
