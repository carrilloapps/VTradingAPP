import { formatTimeAgo } from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatTimeAgo', () => {
    // Set a fixed "now" for tests: 2023-01-01T12:00:00Z
    const NOW = new Date('2023-01-01T12:00:00Z').getTime();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(NOW);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return original string for invalid date', () => {
      expect(formatTimeAgo('invalid-date')).toBe('invalid-date');
    });

    it('should return seconds ago if less than 60 seconds', () => {
      // 30 seconds ago
      const date = new Date(NOW - 30 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 30s');
    });

    it('should return minutes ago if less than 60 minutes', () => {
      // 5 minutes ago
      const date = new Date(NOW - 5 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 5 min');
    });

    it('should return hours ago if less than 24 hours', () => {
      // 3 hours ago
      const date = new Date(NOW - 3 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 3 h');
    });

    it('should return days ago if less than 7 days', () => {
      // 4 days ago
      const date = new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 4 d');
    });

    it('should return formatted date if 7 days or more', () => {
      // 10 days ago: 2022-12-22
      const date = new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString();
      // Date.toLocaleDateString behavior depends on the environment's locale implementation.
      // In Jest/Node, it usually defaults to US format if full-icu is not loaded,
      // but we specified 'es-ES'. Node might support it.
      // 22/12/2022 is expected for es-ES.
      // Let's check what it returns.
      // If the environment doesn't have full ICU data, it might return generic format.
      // However, usually recent Node versions support standard locales.
      // 22/12/2022
      expect(formatTimeAgo(date)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle boundary: 59 seconds', () => {
      const date = new Date(NOW - 59 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 59s');
    });

    it('should handle boundary: 60 seconds (1 min)', () => {
      const date = new Date(NOW - 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 1 min');
    });

    it('should handle boundary: 59 minutes', () => {
      const date = new Date(NOW - 59 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 59 min');
    });

    it('should handle boundary: 60 minutes (1 hour)', () => {
      const date = new Date(NOW - 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 1 h');
    });

    it('should handle boundary: 23 hours', () => {
      const date = new Date(NOW - 23 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 23 h');
    });

    it('should handle boundary: 24 hours (1 day)', () => {
      const date = new Date(NOW - 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 1 d');
    });

    it('should handle boundary: 6 days', () => {
      const date = new Date(NOW - 6 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(date)).toBe('Hace 6 d');
    });

    it('should handle boundary: 7 days', () => {
      const date = new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString();
      // Should be formatted date
      expect(formatTimeAgo(date)).not.toContain('Hace');
    });

    it('should handle future dates (inconsistency check)', () => {
      // 10 seconds in future
      const date = new Date(NOW + 10 * 1000).toISOString();
      // Logic: diff = -10. -10 < 60 is true. Returns "Hace -10s".
      expect(formatTimeAgo(date)).toBe('Hace -10s');
    });
  });
});
