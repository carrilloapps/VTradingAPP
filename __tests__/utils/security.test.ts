import { hashPII } from '../../src/utils/security';
import CryptoJS from 'crypto-js';

describe('security', () => {
  describe('hashPII', () => {
    it('should return undefined if data is undefined', () => {
      expect(hashPII(undefined)).toBeUndefined();
    });

    it('should return undefined if data is null', () => {
      expect(hashPII(null)).toBeUndefined();
    });

    it('should return undefined if data is empty string', () => {
      expect(hashPII('')).toBeUndefined();
    });

    it('should return SHA-256 hash for valid string', () => {
      const input = 'test@example.com';
      const expectedHash = CryptoJS.SHA256(input).toString();
      expect(hashPII(input)).toBe(expectedHash);
    });
  });
});
