import { formatTimeAgo } from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatTimeAgo', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return original string if date is invalid', () => {
      expect(formatTimeAgo('invalid-date')).toBe('invalid-date');
    });

    it('should return seconds ago', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      jest.setSystemTime(now);
      const past = new Date('2023-01-01T11:59:30Z'); // 30 seconds ago
      expect(formatTimeAgo(past.toISOString())).toBe('Hace 30s');
    });

    it('should return minutes ago', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      jest.setSystemTime(now);
      const past = new Date('2023-01-01T11:30:00Z'); // 30 minutes ago
      expect(formatTimeAgo(past.toISOString())).toBe('Hace 30 min');
    });

    it('should return hours ago', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      jest.setSystemTime(now);
      const past = new Date('2023-01-01T02:00:00Z'); // 10 hours ago
      expect(formatTimeAgo(past.toISOString())).toBe('Hace 10 h');
    });

    it('should return days ago', () => {
      const now = new Date('2023-01-10T12:00:00Z');
      jest.setSystemTime(now);
      const past = new Date('2023-01-05T12:00:00Z'); // 5 days ago
      expect(formatTimeAgo(past.toISOString())).toBe('Hace 5 d');
    });

    it('should return formatted date for older dates', () => {
      const now = new Date('2023-01-20T12:00:00Z');
      jest.setSystemTime(now);
      const past = new Date('2023-01-01T12:00:00Z'); // > 7 days ago
      // Note: toLocaleDateString might depend on system locale/timezone in Node environment if not fully mocked or if 'es-ES' behaves differently.
      // However, the code uses 'es-ES' explicitly.
      // 01/01/2023
      expect(formatTimeAgo(past.toISOString())).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
