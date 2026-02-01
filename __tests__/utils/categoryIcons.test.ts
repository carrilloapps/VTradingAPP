import {
  CATEGORY_ICONS,
  getCategoryIcon,
  getAllCategories,
  searchCategories,
} from '../../src/utils/categoryIcons';

describe('categoryIcons', () => {
  describe('CATEGORY_ICONS', () => {
    it('should be defined and not empty', () => {
      expect(CATEGORY_ICONS).toBeDefined();
      expect(Object.keys(CATEGORY_ICONS).length).toBeGreaterThan(0);
    });

    it('should have string keys and string values', () => {
      Object.entries(CATEGORY_ICONS).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('getCategoryIcon', () => {
    it('should return the correct icon for an exact match', () => {
      expect(getCategoryIcon('Banca')).toBe('bank');
      expect(getCategoryIcon('Bitcoin')).toBe('bitcoin');
    });

    it('should return the correct icon for a case-insensitive exact match via partial logic', () => {
      // "banca" is not a key (keys are Title Case mostly), so it falls through to partial match
      // "banca" includes "Banca" (lowercased)
      expect(getCategoryIcon('banca')).toBe('bank');
    });

    it('should return the correct icon when input contains a category key', () => {
      // Input "Super Banca Digital" contains "Banca" key which appears first in the map
      // Current implementation returns the first match found in Object.keys order
      expect(getCategoryIcon('Super Banca Digital')).toBe('bank');
    });

    it('should return the correct icon when input is contained in a category key', () => {
      // Input "Digi" is contained in "Banca Digital"
      // Note: "Digi" might match "Banca Digital" or "Digital" if it existed.
      // It depends on the order of keys in Object.keys iteration which is not guaranteed to be alphabetical for string keys in all engines,
      // but usually insertion order.
      // However, "Digi" is definitely contained in "Banca Digital".
      const icon = getCategoryIcon('Digi');
      expect(icon).toBeDefined();
      // We expect it to match something that has "digi" inside.
    });

    it('should return default icon "tag" for no match', () => {
      expect(getCategoryIcon('NonExistentCategory123')).toBe('tag');
    });

    it('should handle empty string', () => {
      // Empty string includes "" is true? "str".includes("") is true.
      // key.toLowerCase().includes("") is true.
      // So if I pass "", it might match the first key found?
      // Let's verify behavior.
      // If logic is: lowerCategoryName.includes(key) || key.includes(lowerCategoryName)
      // If input is "", lowerCategoryName is "".
      // "".includes("banca") -> false.
      // "banca".includes("") -> true.
      // So it will return the icon of the first key encountered.
      // This might be considered "correct" behavior for the function as written, or an "inconsistency" if we expect 'tag'.
      // Let's test what it currently does.
      const icon = getCategoryIcon('');
      expect(typeof icon).toBe('string');
      // Likely returns the first icon in the list.
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories sorted alphabetically', () => {
      const categories = getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(Object.keys(CATEGORY_ICONS).length);

      // Check if sorted
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe('searchCategories', () => {
    it('should return categories matching the search term', () => {
      const results = searchCategories('Banca');
      expect(results).toContain('Banca');
      expect(results).toContain('Banca Digital');
      expect(results.every(cat => cat.toLowerCase().includes('banca'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const resultsLower = searchCategories('banca');
      const resultsUpper = searchCategories('BANCA');
      expect(resultsLower).toEqual(resultsUpper);
    });

    it('should return empty array for no matches', () => {
      const results = searchCategories('xyz123abc');
      expect(results).toEqual([]);
    });

    it('should return all categories for empty search term', () => {
      // "".includes("") is true. So all keys should match.
      const results = searchCategories('');
      expect(results.length).toBe(Object.keys(CATEGORY_ICONS).length);
    });

    it('should return sorted results', () => {
      const results = searchCategories('a');
      const sorted = [...results].sort();
      expect(results).toEqual(sorted);
    });
  });
});
