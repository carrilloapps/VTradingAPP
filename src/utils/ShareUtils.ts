import Share from 'react-native-share';

import { observabilityService } from '@/services/ObservabilityService';
import SafeLogger from '@/utils/safeLogger';

interface ShareTextOptions {
  title: string;
  excerpt?: string;
  url: string;
  type: 'ARTICLE' | 'CATEGORY' | 'TAG';
  author?: string;
  count?: number; // for categories/tags
}

export const generateShareMessage = (options: ShareTextOptions): string => {
  const { title, excerpt, url, type, author, count } = options;

  let headerIcon = '✨';
  let typeLabel = '';

  switch (type) {
    case 'ARTICLE':
      headerIcon = '📰';
      break;
    case 'CATEGORY':
      headerIcon = '📂';
      typeLabel = 'Categoría: ';
      break;
    case 'TAG':
      headerIcon = '🏷️';
      typeLabel = 'Etiqueta: ';
      break;
  }

  // Header
  let message = `${headerIcon} *${typeLabel}${title}*\n\n`;

  // Content
  if (excerpt) {
    // Remove HTML tags if present and trim
    const cleanExcerpt = excerpt.replace(/<[^>]*>?/gm, '').trim();
    message += `${cleanExcerpt}\n\n`;
  }

  // Metadata
  if (type === 'ARTICLE' && author) {
    message += `✍️ Autor: ${author}\n`;
  }

  if ((type === 'CATEGORY' || type === 'TAG') && count) {
    message += `📚 ${count} artículos seleccionados\n`;
  }

  // Footer & Links
  message += `\n🔗 *Leer nota completa:*\n${url}\n\n`;
  message += `📲 *Descarga VTrading:*\nhttps://vtrading.app`;

  return message;
};

export const shareTextContent = async (options: ShareTextOptions) => {
  try {
    const message = generateShareMessage(options);
    await Share.open({
      title: options.title,
      message,
      url: options.url, // iOS often attaches this as a link preview
    });
    return true;
  } catch (error: any) {
    if (error && error.message !== 'User did not share' && error.message !== 'CANCELLED') {
      observabilityService.captureError(error, {
        context: 'ShareUtils.shareContent',
        title: options.title,
        hasUrl: !!options.url,
        errorMessage: error.message,
      });
      SafeLogger.error('Share error:', error);
      return false;
    }
    return null; // Cancelled
  }
};
