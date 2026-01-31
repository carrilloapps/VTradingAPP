import CryptoJS from 'crypto-js';

/**
 * Hash Personally Identifiable Information (PII) for secure logging.
 * Uses SHA-256 to create a non-reversible hash.
 * 
 * @param data The sensitive string (email, phone, etc.) to hash
 * @returns The SHA-256 hash of the data, or undefined if data is empty
 */
export const hashPII = (data: string | undefined | null): string | undefined => {
  if (!data) return undefined;
  return CryptoJS.SHA256(data).toString();
};
