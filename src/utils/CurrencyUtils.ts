import { CurrencyRate } from '@/services/CurrencyService';

/**
 * Extracts a safe currency code from a CurrencyRate object.
 * Prioritizes the explicit code, then fallbacks to extracting from the name,
 * and finally provides type-aware defaults.
 */
export const getSafeCurrencyCode = (rate: Partial<CurrencyRate>): string => {
  // 1. Try direct code from rate object
  const rawCode = (rate.code || '').trim();
  if (rawCode && rawCode.length >= 2 && rawCode.length <= 10) {
    return rawCode.toUpperCase();
  }

  // 2. Fallback: extract from name (e.g., "USDT • P2P" or "COP/VES • BCV")
  if (rate.name) {
    // Split by common delimiters and filter out bolivar variations
    const parts = rate.name.split(/[•/ ]+/);
    const codePart = parts.find((p: string) =>
      p &&
      p.toUpperCase() !== 'VES' &&
      p.toUpperCase() !== 'BS' &&
      p.toUpperCase() !== 'VEF' &&
      p.length >= 2 &&
      p.length <= 10
    );
    if (codePart) return codePart.toUpperCase();
  }

  // 3. Predictable fallbacks based on rate type
  if (rate.type === 'crypto') return 'USDT';

  // Specific lookups in name if codePart failed
  const name = (rate.name || '').toUpperCase();
  if (name.includes('COP')) return 'COP';
  if (name.includes('PEN')) return 'PEN';
  if (name.includes('EUR')) return 'EUR';
  if (name.includes('BTC')) return 'BTC';
  if (name.includes('ETH')) return 'ETH';
  if (name.includes('USDT')) return 'USDT';

  return 'USD'; // Absolute fallback
};

/**
 * Returns a formatted pair string (e.g., "VES/USD" or "USD/VES")
 */
export const getDisplayPair = (code: string, inverted: boolean = false): string => {
  const safeCode = code || 'USD';
  return inverted ? `${safeCode}/VES` : `VES/${safeCode}`;
};

/**
 * Returns the currency symbol or code for values (e.g., "Bs." or "USD")
 */
export const getDisplayCurrency = (code: string, inverted: boolean = false): string => {
  return inverted ? 'VES' : (code || 'USD');
};
