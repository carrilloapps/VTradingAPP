import {
  getTrend,
  getTrendColor,
  getTrendIcon,
} from '../../src/utils/trendUtils';
import { MD3Theme } from 'react-native-paper';

describe('trendUtils', () => {
  describe('getTrend', () => {
    it('should return neutral for undefined or null', () => {
      expect(getTrend(undefined)).toBe('neutral');
      expect(getTrend(null)).toBe('neutral');
    });

    it('should return neutral for 0', () => {
      expect(getTrend(0)).toBe('neutral');
      expect(getTrend('0')).toBe('neutral');
      expect(getTrend('0.00%')).toBe('neutral');
    });

    it('should return up for positive numbers', () => {
      expect(getTrend(10)).toBe('up');
      expect(getTrend('10')).toBe('up');
      expect(getTrend('5.5%')).toBe('up');
      expect(getTrend('5,5%')).toBe('up'); // Comma handling
    });

    it('should return down for negative numbers', () => {
      expect(getTrend(-10)).toBe('down');
      expect(getTrend('-10')).toBe('down');
      expect(getTrend('-5.5%')).toBe('down');
      expect(getTrend('-5,5%')).toBe('down'); // Comma handling
    });

    it('should return neutral for invalid strings', () => {
      expect(getTrend('abc')).toBe('neutral');
    });
  });

  describe('getTrendColor', () => {
    const mockTheme = {
      colors: {
        success: 'green',
        error: 'red',
        onSurfaceVariant: 'gray',
      },
    } as unknown as MD3Theme;

    it('should return success color for up trend', () => {
      expect(getTrendColor('up', mockTheme)).toBe('green');
    });

    it('should return error color for down trend', () => {
      expect(getTrendColor('down', mockTheme)).toBe('red');
    });

    it('should return onSurfaceVariant color for neutral trend', () => {
      expect(getTrendColor('neutral', mockTheme)).toBe('gray');
    });

    it('should handle missing success/error colors in theme with defaults', () => {
      const incompleteTheme = {
        colors: {
          onSurfaceVariant: 'gray',
        },
      } as unknown as MD3Theme;

      expect(getTrendColor('up', incompleteTheme)).toBe('#6EE7B7');
      expect(getTrendColor('down', incompleteTheme)).toBe('#F87171');
    });
  });

  describe('getTrendIcon', () => {
    it('should return trending-up for up trend', () => {
      expect(getTrendIcon('up')).toBe('trending-up');
    });

    it('should return trending-down for down trend', () => {
      expect(getTrendIcon('down')).toBe('trending-down');
    });

    it('should return minus for neutral trend', () => {
      expect(getTrendIcon('neutral')).toBe('minus');
    });
  });
});
