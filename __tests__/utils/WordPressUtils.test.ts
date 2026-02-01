import { getCategoryImage } from '../../src/utils/WordPressUtils';
import { WordPressCategory } from '../../src/services/WordPressService';

describe('WordPressUtils', () => {
  describe('getCategoryImage', () => {
    it('should return Yoast OG image URL if available', () => {
      const category = {
        yoast_head_json: {
          og_image: [{ url: 'https://example.com/yoast.jpg' }],
        },
      } as WordPressCategory;
      expect(getCategoryImage(category)).toBe('https://example.com/yoast.jpg');
    });

    it('should prioritize Yoast over ACF image', () => {
      const category = {
        yoast_head_json: {
          og_image: [{ url: 'https://example.com/yoast.jpg' }],
        },
        acf: {
          image: 'https://example.com/acf.jpg',
        },
      } as WordPressCategory;
      expect(getCategoryImage(category)).toBe('https://example.com/yoast.jpg');
    });

    it('should return ACF image URL (string) if Yoast is missing', () => {
      const category = {
        acf: {
          image: 'https://example.com/acf.jpg',
        },
      } as WordPressCategory;
      expect(getCategoryImage(category)).toBe('https://example.com/acf.jpg');
    });

    it('should return ACF image URL (object) if Yoast is missing', () => {
      const category = {
        acf: {
          image: { url: 'https://example.com/acf-obj.jpg' },
        },
      } as unknown as WordPressCategory;
      expect(getCategoryImage(category)).toBe(
        'https://example.com/acf-obj.jpg',
      );
    });

    it('should return ACF icon URL (string) if Yoast and Image are missing', () => {
      const category = {
        acf: {
          icon: 'https://example.com/icon.jpg',
        },
      } as WordPressCategory;
      expect(getCategoryImage(category)).toBe('https://example.com/icon.jpg');
    });

    it('should return ACF icon URL (object) if Yoast and Image are missing', () => {
      const category = {
        acf: {
          icon: { url: 'https://example.com/icon-obj.jpg' },
        },
      } as unknown as WordPressCategory;
      expect(getCategoryImage(category)).toBe(
        'https://example.com/icon-obj.jpg',
      );
    });

    it('should return undefined if no images are available', () => {
      const category = {} as WordPressCategory;
      expect(getCategoryImage(category)).toBeUndefined();
    });

    it('should return undefined if Yoast array is empty', () => {
      const category = {
        yoast_head_json: {
          og_image: [],
        },
      } as unknown as WordPressCategory;
      expect(getCategoryImage(category)).toBeUndefined();
    });

    it('should return undefined if ACF image object has no url', () => {
      const category = {
        acf: {
          image: { foo: 'bar' },
        },
      } as unknown as WordPressCategory;
      expect(getCategoryImage(category)).toBeUndefined();
    });

    it('should return undefined if ACF icon object has no url', () => {
      const category = {
        acf: {
          icon: { foo: 'bar' },
        },
      } as unknown as WordPressCategory;
      expect(getCategoryImage(category)).toBeUndefined();
    });
  });
});
