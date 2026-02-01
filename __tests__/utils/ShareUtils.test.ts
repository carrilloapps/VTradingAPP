import {
  generateShareMessage,
  shareTextContent,
} from '../../src/utils/ShareUtils';
import Share from 'react-native-share';
import { observabilityService } from '@/services/ObservabilityService';
import SafeLogger from '@/utils/safeLogger';

// Mocks
jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('@/utils/safeLogger', () => ({
  error: jest.fn(),
}));

describe('ShareUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateShareMessage', () => {
    it('should generate correct message for ARTICLE', () => {
      const options = {
        title: 'Test Article',
        excerpt: '<p>This is a test.</p>',
        url: 'https://vtrading.app/article',
        type: 'ARTICLE' as const,
        author: 'John Doe',
      };
      const message = generateShareMessage(options);
      expect(message).toContain('📰 *Test Article*');
      expect(message).toContain('This is a test.'); // HTML stripped
      expect(message).toContain('✍️ Autor: John Doe');
      expect(message).toContain('🔗 *Leer nota completa:*');
      expect(message).toContain('https://vtrading.app/article');
    });

    it('should generate correct message for CATEGORY', () => {
      const options = {
        title: 'Crypto',
        url: 'https://vtrading.app/cat/crypto',
        type: 'CATEGORY' as const,
        count: 5,
      };
      const message = generateShareMessage(options);
      expect(message).toContain('📂 *Categoría: Crypto*');
      expect(message).toContain('📚 5 artículos seleccionados');
    });

    it('should generate correct message for TAG', () => {
      const options = {
        title: 'Bitcoin',
        url: 'https://vtrading.app/tag/btc',
        type: 'TAG' as const,
        count: 10,
      };
      const message = generateShareMessage(options);
      expect(message).toContain('🏷️ *Etiqueta: Bitcoin*');
      expect(message).toContain('📚 10 artículos seleccionados');
    });

    it('should handle missing excerpt/author', () => {
      const options = {
        title: 'Minimal Article',
        url: 'https://vtrading.app/minimal',
        type: 'ARTICLE' as const,
      };
      const message = generateShareMessage(options);
      expect(message).toContain('📰 *Minimal Article*');
      expect(message).not.toContain('✍️ Autor');
    });
  });

  describe('shareTextContent', () => {
    const options = {
      title: 'Test Share',
      url: 'https://test.com',
      type: 'ARTICLE' as const,
    };

    it('should return true on successful share', async () => {
      (Share.open as jest.Mock).mockResolvedValue({ message: 'OK' });
      const result = await shareTextContent(options);
      expect(result).toBe(true);
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: options.title,
          url: options.url,
        }),
      );
    });

    it('should return null on user cancel (User did not share)', async () => {
      (Share.open as jest.Mock).mockRejectedValue(
        new Error('User did not share'),
      );
      const result = await shareTextContent(options);
      expect(result).toBe(null);
      expect(observabilityService.captureError).not.toHaveBeenCalled();
    });

    it('should return null on user cancel (CANCELLED)', async () => {
      (Share.open as jest.Mock).mockRejectedValue(new Error('CANCELLED'));
      const result = await shareTextContent(options);
      expect(result).toBe(null);
      expect(observabilityService.captureError).not.toHaveBeenCalled();
    });

    it('should return false and log error on other errors', async () => {
      const error = new Error('Unknown error');
      (Share.open as jest.Mock).mockRejectedValue(error);
      const result = await shareTextContent(options);
      expect(result).toBe(false);
      expect(observabilityService.captureError).toHaveBeenCalled();
      expect(SafeLogger.error).toHaveBeenCalled();
    });
  });
});
