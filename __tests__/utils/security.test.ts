import { hashPII } from '../../src/utils/security';

describe('security', () => {
  describe('hashPII', () => {
    it('should return undefined for null', () => {
      expect(hashPII(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(hashPII(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(hashPII('')).toBeUndefined();
    });

    it('should return SHA-256 hash for valid string', () => {
      // SHA256('hello') = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
      expect(hashPII('hello')).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      );
    });
  });
});
