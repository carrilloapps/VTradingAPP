import { Linking } from 'react-native';

import { navigationRef } from '@/navigation/NavigationRef';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import SafeLogger from '@/utils/safeLogger';
import { AppConfig } from '@/constants/AppConfig';

export interface DeepLinkRoute {
  type: 'discover' | 'article' | 'category' | 'tag';
  slug?: string;
  id?: string;
  originalUrl: string;
}

class DeepLinkService {
  // Configurable schemes and hosts
  private readonly SCHEME = AppConfig.DEEP_LINK_SCHEME || 'vtrading://';
  private readonly HOST = AppConfig.DEEP_LINK_HOST || 'discover.vtrading.app';
  private readonly BASE_URL = `https://${this.HOST}`;

  // List of all valid hosts for deep linking
  private readonly VALID_HOSTS = [
    'vtrading.app',
    'www.vtrading.app',
    'discover.vtrading.app',
    'www.discover.vtrading.app',
  ];

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
      SafeLogger.info('[DeepLinkService] Parsing URL:', url);

      let path = '';

      // Handle custom scheme: vtrading://
      if (url.startsWith(this.SCHEME)) {
        path = url.replace(this.SCHEME, '');
      } else {
        // Handle HTTP/HTTPS URLs from any valid host
        let matchedHost = false;
        for (const host of this.VALID_HOSTS) {
          const httpsHost = `https://${host}`;
          const httpHost = `http://${host}`;

          if (url.startsWith(httpsHost)) {
            path = url.replace(httpsHost, '');
            matchedHost = true;
            break;
          } else if (url.startsWith(httpHost)) {
            path = url.replace(httpHost, '');
            matchedHost = true;
            break;
          }
        }

        if (!matchedHost) {
          SafeLogger.warn('[DeepLinkService] Host not recognized for URL:', url);
          return null;
        }
      }

      // Cleanup path (remove leading/trailing slashes but keep parameters for now)
      path = path.replace(/^\/+|\/+$/g, '');
      SafeLogger.info('[DeepLinkService] Cleaned path:', path);

      // Handle query parameters (like WordPress shortlinks ?p=ID)
      // This MUST happen before validation because '?' and '=' are not in the valid path regex
      if (path.includes('?')) {
        const parts = path.split('?');
        const queryString = parts[1];
        const pathOnly = parts[0].replace(/\/+$/, ''); // clean trailing slash from path part

        if (queryString) {
          const pMatch = queryString.match(/(?:^|&)p=([0-9]+)(?:&|$)/);
          if (pMatch && pMatch[1]) {
            SafeLogger.info('[DeepLinkService] Detected WordPress ID via query:', pMatch[1]);
            return { type: 'article', id: pMatch[1], originalUrl: url };
          }
        }

        path = pathOnly;
      }

      // Strict validation: Only allow alphanumeric, hyphens, and slashes for basic routing
      if (path && !/^[a-zA-Z0-9\-_/]+$/.test(path)) {
        SafeLogger.warn('[DeepLinkService] Path failed validation regex:', path);
        observabilityService.captureError(new Error('Invalid DeepLink characters'), {
          context: 'DeepLinkService.parseDeepLink',
          url,
          path,
        });
        return null;
      }

      // Prevent path traversal attempts explicitly
      if (path.includes('..') || path.includes('//')) {
        return null;
      }

      if (!path || path === 'discover') {
        return { type: 'discover', originalUrl: url };
      }

      const pathParts = path.split('/');
      SafeLogger.info('[DeepLinkService] Path parts:', pathParts);

      // Pattern: /categoria/{slug}
      if (pathParts[0] === 'categoria' && pathParts[1]) {
        return { type: 'category', slug: pathParts[1], originalUrl: url };
      }

      // Pattern: /tag/{slug}
      if (pathParts[0] === 'tag' && pathParts[1]) {
        return { type: 'tag', slug: pathParts[1], originalUrl: url };
      }

      // Pattern: /article/{slug}
      if (pathParts[0] === 'article' && pathParts[1]) {
        return { type: 'article', slug: pathParts[1], originalUrl: url };
      }

      // Fallback for direct slug: vtrading.app/some-slug
      if (pathParts.length === 1) {
        return { type: 'article', slug: pathParts[0], originalUrl: url };
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

    SafeLogger.info('[DeepLinkService] Handling route:', route);

    switch (route.type) {
      case 'article':
        navigationRef.navigate('ArticleDetail', {
          slug: route.slug || undefined,
          id: route.id,
        });
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
