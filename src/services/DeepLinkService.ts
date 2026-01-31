import { Linking } from 'react-native';
import { navigationRef } from '../navigation/NavigationRef';
import { observabilityService } from './ObservabilityService';
import { analyticsService, ANALYTICS_EVENTS } from './firebase/AnalyticsService';

export interface DeepLinkRoute {
    type: 'discover' | 'article' | 'category' | 'tag';
    slug?: string;
    originalUrl: string;
}

class DeepLinkService {
    private readonly SCHEME = 'vtrading://';
    private readonly HOST = 'discover.vtrading.app';
    private readonly BASE_URL = `https://${this.HOST}`;

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
            if (url.startsWith(this.SCHEME)) {
                path = url.replace(this.SCHEME, '');
            } else if (url.startsWith(this.BASE_URL)) {
                path = url.replace(this.BASE_URL, '');
            } else {
                return null;
            }

            // Cleanup path (remove leading/trailing slashes)
            path = path.replace(/^\/+|\/+$/g, '');

            // Validate path contains only safe characters (alphanumeric, hyphens, slashes)
            // This prevents specialized injection attacks if slugs are used in unsafe contexts later
            if (!/^[a-zA-Z0-9-/_]+$/.test(path)) {
                observabilityService.captureError(new Error('Invalid DeepLink characters'), { context: 'DeepLinkService.parseDeepLink', url });
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
        } catch (error) {
            observabilityService.captureError(error, { context: 'DeepLinkService.parseDeepLink', url });
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
            // Wait for navigation to be ready or handle via initialRoute
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
            console.warn('DeepLinkService already initialized');
            return () => { }; // No-op if already initialized
        }

        // Handle initial URL
        Linking.getInitialURL().then((url) => {
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
