import { Linking } from 'react-native';

import { navigationRef } from '@/navigation/NavigationRef';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';
import { AppConfig } from '@/constants/AppConfig';

export interface DeepLinkRoute {
  type: 'discover' | 'article' | 'category' | 'tag';
  slug?: string;
  originalUrl: string;
}

class DeepLinkService {
  // Configurable schemes and hosts
  private readonly SCHEME = AppConfig.DEEP_LINK_SCHEME || 'vtrading://';
  private readonly HOST = AppConfig.DEEP_LINK_HOST || 'discover.vtrading.app';
  private readonly BASE_URL = `https://${this.HOST}`;

  // List of all valid hosts for deep linking
  private readonly VALID_HOSTS = ['vtrading.app', 'discover.vtrading.app'];

  /**
   * Generate a deep link URL for an article
   */
  getArticleLink(slug: string): string {
    return `${this.BASE_URL}/${slug}`;
  }

  /**
   * Generate a deep link URL for a category
   */
  getCategoryLink(slug: string): string {
    return `${this.BASE_URL}/categoria/${slug}`;
  }

  /**
   * Generate a deep link URL for a tag
   */
  getTagLink(slug: string): string {
    return `${this.BASE_URL}/tag/${slug}`;
  }

  private subscription: { remove: () => void } | null = null;

  /**
   * Parse a URL into a structured DeepLinkRoute
   */
  parseDeepLink(url: string): DeepLinkRoute | null {
    try {
      if (!url) return null;

      let path = '';

      // Handle custom scheme: vtrading://
      if (url.startsWith(this.SCHEME)) {
        path = url.replace(this.SCHEME, '');
      } else {
        // Handle HTTPS URLs from any valid host
        let matchedHost = false;
        for (const host of this.VALID_HOSTS) {
          const hostUrl = `https://${host}`;
          if (url.startsWith(hostUrl)) {
            path = url.replace(hostUrl, '');
            matchedHost = true;
            break;
          }
        }

        // If no valid host matched, return null
        if (!matchedHost) {
          return null;
        }
      }

      // Cleanup path (remove leading/trailing slashes)
      path = path.replace(/^\/+|\/+$/g, '');

      // Strict validation: Only allow alphanumeric, hyphens, and slashes for basic routing
      // Prevents complex injections, parent directory traversal (..), and special chars
      // Allow alphanumeric, -, _, /
      if (path && !/^[a-zA-Z0-9\-_/]+$/.test(path)) {
        // Suspicious path detected
        observabilityService.captureError(new Error('Invalid DeepLink characters'), {
          context: 'DeepLinkService.parseDeepLink',
          url,
          path,
        });
        return null;
      }

      // Prevent path traversal attempts explicitly (though regex covers it, double check)
      if (path.includes('..') || path.includes('//')) {
        return null;
      }

      if (!path || path === 'discover') {
        return { type: 'discover', originalUrl: url };
      }

      const parts = path.split('/');

      // Pattern: discover.vtrading.app/categoria/{slug}
      if (parts[0] === 'categoria' && parts[1]) {
        return { type: 'category', slug: parts[1], originalUrl: url };
      }

      // Pattern: vtrading://categoria/{slug}
      if (parts[0] === 'categoria' && parts[1]) {
        return { type: 'category', slug: parts[1], originalUrl: url };
      }

      // Pattern: discover.vtrading.app/tag/{slug}
      if (parts[0] === 'tag' && parts[1]) {
        return { type: 'tag', slug: parts[1], originalUrl: url };
      }

      // Pattern: discover.vtrading.app/{article-slug}
      // Or vtrading://article/{slug}
      if (parts[0] === 'article' && parts[1]) {
        return { type: 'article', slug: parts[1], originalUrl: url };
      }

      // Fallback for direct slug: discover.vtrading.app/some-slug
      if (parts.length === 1) {
        return { type: 'article', slug: parts[0], originalUrl: url };
      }

      return { type: 'discover', originalUrl: url };
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'DeepLinkService.parseDeepLink',
        url,
      });
      return null;
    }
  }

  /**
   * Handle the deep link by navigating to the appropriate screen
   */
  async handleDeepLink(url: string): Promise<boolean> {
    const route = this.parseDeepLink(url);
    if (!route) return false;

    analyticsService.logEvent(ANALYTICS_EVENTS.DEEP_LINK_OPENED, {
      url: route.originalUrl,
      type: route.type,
      slug: route.slug || 'none',
    });

    if (!navigationRef.isReady()) {
      // Queue navigation if not ready
      // Retry logic (simple one-off retry after delay, or better: a proper queue system)
      // For now, a simple retry is sufficient for startup scenarios
      setTimeout(() => {
        if (navigationRef.isReady()) {
          this.handleDeepLink(url);
        }
      }, 1000);
      return false;
    }

    switch (route.type) {
      case 'article':
        navigationRef.navigate('ArticleDetail', { slug: route.slug });
        break;
      case 'category':
        navigationRef.navigate('Main', {
          screen: 'Discover',
          params: { categorySlug: route.slug },
        });
        break;
      case 'tag':
        navigationRef.navigate('Main', {
          screen: 'Discover',
          params: { tagSlug: route.slug },
        });
        break;
      case 'discover':
        navigationRef.navigate('Main', { screen: 'Discover' });
        break;
      default:
        return false;
    }

    return true;
  }

  /**
   * Initialize deep link handling
   */
  init() {
    if (this.subscription) {
      SafeLogger.warn('DeepLinkService already initialized');
      return () => {}; // No-op if already initialized
    }

    // Handle initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Listen for URL changes
    this.subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    return () => this.destroy();
  }

  destroy() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

export const deepLinkService = new DeepLinkService();
