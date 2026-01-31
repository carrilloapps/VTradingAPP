import { WordPressCategory } from '../services/WordPressService';

/**
 * Extracts a displayable image URL from a WordPress Category.
 * Prioritizes Yoast OG Image, then ACF Image/Icon fields.
 *
 * @param cat WordPressCategory object
 * @returns string URL or undefined
 */
export const getCategoryImage = (
  cat: WordPressCategory,
): string | undefined => {
  // 1. Try Yoast OG image (usually best quality/intended for sharing)
  if (cat.yoast_head_json?.og_image?.[0]?.url) {
    return cat.yoast_head_json.og_image[0].url;
  }

  // 2. Try ACF image fields (image, icon)
  // Handle both string URLs and object structures { url: string, ... }
  if (cat.acf?.image) {
    if (typeof cat.acf.image === 'string') return cat.acf.image;
    if (typeof cat.acf.image === 'object' && cat.acf.image.url)
      return cat.acf.image.url;
  }

  if (cat.acf?.icon) {
    if (typeof cat.acf.icon === 'string') return cat.acf.icon;
    if (typeof cat.acf.icon === 'object' && cat.acf.icon.url)
      return cat.acf.icon.url;
  }

  return undefined;
};
