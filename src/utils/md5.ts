import CryptoJS from 'crypto-js';

/**
 * Calculates the MD5 hash of a string using crypto-js
 * @param string The input string to hash
 * @returns The MD5 hash as a hex string
 */
export function md5(string: string): string {
  return CryptoJS.MD5(string).toString();
}
