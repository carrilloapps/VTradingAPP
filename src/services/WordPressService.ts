import { ApiClient } from './ApiClient';
import { observabilityService } from './ObservabilityService';
import Config from 'react-native-config';

// WordPress API Interfaces
export interface WordPressCategory {
    id: number;
    count: number;
    description: string;
    link: string;
    name: string;
    slug: string;
    taxonomy: string;
    parent: number;
    yoast_head_json?: YoastSEO;
    acf?: WordPressACF;
    meta?: Record<string, any>;
}

export interface WordPressTag {
    id: number;
    count: number;
    description: string;
    link: string;
    name: string;
    slug: string;
    taxonomy: string;
    yoast_head_json?: YoastSEO;
}

export interface WordPressComment {
    id: number;
    post: number;
    parent: number;
    author: number;
    author_name: string;
    author_url: string;
    author_avatar_urls: { [key: string]: string };
    date: string;
    date_gmt: string;
    content: { rendered: string };
    link: string;
    status: string;
    type: string;
}

export interface FormattedComment {
    id: string;
    author: string;
    avatar: string;
    date: string;
    content: string;
    isReply: boolean;
    parentId?: string;
}

export interface YoastSEO {
    title?: string;
    description?: string;
    canonical?: string;
    og_title?: string;
    og_description?: string;
    og_image?: Array<{
        url: string;
        width: number;
        height: number;
    }>;
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
    schema?: {
        '@context': string;
        '@graph': any[];
    };
}

export interface WordPressAuthor {
    id: number;
    name: string;
    url: string;
    description: string;
    link: string;
    slug: string;
    avatar_urls?: {
        24?: string;
        48?: string;
        96?: string;
    };
    yoast_head_json?: YoastSEO;
    meta?: any;
    count?: number;
    roles?: string[];
}

export interface WordPressFeaturedMedia {
    id: number;
    source_url: string;
    alt_text: string;
    media_details?: {
        width: number;
        height: number;
    };
}

export interface WordPressACF {
    image?: string | { url: string; alt?: string };
    icon?: string | { url: string; alt?: string };
    [key: string]: any;
}

export interface WordPressPost {
    id: number;
    date: string;
    date_gmt: string;
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    categories: number[];
    tags: number[];
    yoast_head_json?: YoastSEO;
    jetpack_featured_media_url?: string;
    acf?: WordPressACF;
    _embedded?: {
        author?: WordPressAuthor[];
        'wp:featuredmedia'?: WordPressFeaturedMedia[];
        'wp:term'?: Array<WordPressCategory[] | WordPressTag[]>;
    };
}

export interface FormattedPost {
    id: string;
    slug: string;
    title: string;
    description: string;
    source: string;
    time: string;
    image: string;
    category: string;
    categoryId?: number;
    categories?: WordPressCategory[];
    tags?: WordPressTag[];
    readTime: string;
    link: string;
    excerpt?: string;
    content?: string;
    modifiedTime?: string;
    wordCount?: number;
    isPromo: boolean;
    isTrending: boolean;
    isEdited?: boolean;
    date: string;
    modified: string;
    author?: {
        id: number;
        name: string;
        avatar: string;
        role?: string;
        description?: string;
        slug: string;
        link: string;
        social?: {
            facebook?: string;
            instagram?: string;
            youtube?: string;
            twitter?: string;
            linkedin?: string;
            tiktok?: string;
            website?: string;
            pinterest?: string;
            soundcloud?: string;
            tumblr?: string;
            wikipedia?: string;
        };
        yoastSEO?: YoastSEO;
        count?: number;
    };
    seoDescription?: string;
    yoastSEO?: YoastSEO;
}

export interface PaginatedResponse<T> {
    data: T[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
}


class WordPressService {
    private client: ApiClient;

    constructor() {
        const baseUrl = Config.WORDPRESS_BASE_URL || 'https://discover.vtrading.app';
        this.client = new ApiClient(`${baseUrl}/wp-json/wp/v2`, {
            apiKey: undefined, // No API Key needed for public WP API
            useAppCheck: false, // No App Check needed for public WP API
        });
    }

    /**
     * Fetch latest posts with embedded data
     * @param page Page number
     * @param perPage Posts per page
     * @param categoryId Optional category filter
     * @param tagId Optional tag filter
     * @param bypassCache Force bypass cache and fetch fresh data
     */
    async getPosts(
        page = 1,
        perPage = 10,
        categoryId?: number,
        tagId?: number,
        bypassCache = false
    ): Promise<FormattedPost[]> {
        try {
            const params: any = {
                page,
                per_page: perPage,
                _embed: true, // Fetch embedded media/author data
            };

            if (categoryId) {
                params.categories = categoryId;
            }

            if (tagId) {
                params.tags = tagId;
            }

            const posts = await this.client.get<WordPressPost[]>('posts', {
                params,
                useCache: true,
                bypassCache, // Pass through bypassCache parameter
                cacheTTL: 5 * 60 * 1000, // Cache for 5 minutes
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getPosts' });
            return [];
        }
    }

    /**
     * Fetch latest posts with pagination metadata
     */
    async getPostsPaginated(
        page = 1,
        perPage = 10,
        categoryId?: number,
        tagId?: number,
        bypassCache = false
    ): Promise<PaginatedResponse<FormattedPost>> {
        try {
            const params: any = {
                page,
                per_page: perPage,
                _embed: true,
            };

            if (categoryId) params.categories = categoryId;
            if (tagId) params.tags = tagId;

            const { data, headers } = await this.client.getWithFullResponse<WordPressPost[]>('posts', {
                params,
                useCache: !bypassCache,
                bypassCache,
                cacheTTL: 5 * 60 * 1000,
            });

            const totalPages = parseInt(
                headers.get('X-WP-TotalPages') ||
                headers.get('x-wp-totalpages') ||
                headers.get('X-WP-Total-Pages') ||
                '1',
                10
            );
            const totalItems = parseInt(
                headers.get('X-WP-Total') ||
                headers.get('x-wp-total') ||
                '0',
                10
            );

            return {
                data: data.map((post) => this.formatPost(post)),
                totalPages,
                totalItems,
                currentPage: page,
            };
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getPostsPaginated' });
            return {
                data: [],
                totalPages: 0,
                totalItems: 0,
                currentPage: page,
            };
        }
    }


    /**
     * Fetch related posts (by category)
     * @param postId Current post ID to exclude
     * @param categoryId Category ID to filter by
     * @param limit Number of posts to fetch
     */
    async getRelatedPosts(
        postId: number,
        categoryId: number,
        limit = 4
    ): Promise<FormattedPost[]> {
        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    categories: categoryId,
                    exclude: postId,
                    per_page: limit,
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000,
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getRelatedPosts', details: { postId, categoryId } });
            return [];
        }
    }

    /**
     * Fetch a single post by ID
     * @param id Post ID
     * @param bypassCache Force bypass cache
     */
    async getPostById(id: number, bypassCache = false): Promise<FormattedPost | null> {
        try {
            const post = await this.client.get<WordPressPost>(`posts/${id}`, {
                params: {
                    _embed: true,
                },
                useCache: !bypassCache,
                cacheTTL: bypassCache ? 0 : 30 * 60 * 1000,
            });

            return this.formatPost(post);
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getPostById' });
            return null;
        }
    }

    /**
     * Fetch a single post by slug
     * @param slug Post slug
     */
    async getPostBySlug(slug: string): Promise<FormattedPost | null> {
        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    slug,
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 10 * 60 * 1000,
            });

            if (posts && posts.length > 0) {
                return this.formatPost(posts[0]);
            }
            return null;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getPostBySlug', details: { slug } });
            return null;
        }
    }

    /**
     * Sanitize search query to prevent WordPress API errors
     * Removes special characters that cause 400 errors and normalizes whitespace
     * Preserves accented characters (á, é, í, ó, ú, ñ, etc.)
     * @param query Raw search query
     * @returns Sanitized query string
     */
    private sanitizeSearchQuery(query: string): string {
        if (!query) return '';

        const sanitized = query
            .trim()
            // Remove problematic characters that cause WordPress REST API 400 errors
            // Note: We keep accented characters (á, é, í, ó, ú, ñ) as they're valid in Spanish
            .replace(/[<>{}[\]\\]/g, '')
            // Normalize multiple spaces to single space
            .replace(/\s+/g, ' ')
            // Remove leading/trailing whitespace again after replacements
            .trim();

        return sanitized;
    }

    /**
     * Search posts by keyword
     * @param query Search query
     * @param page Page number
     * @param perPage Posts per page
     */
    async searchPosts(query: string, page = 1, perPage = 10): Promise<FormattedPost[]> {
        // Sanitize the search query
        const sanitizedQuery = this.sanitizeSearchQuery(query);

        // Validate minimum length (2 characters minimum for WordPress search)
        if (!sanitizedQuery || sanitizedQuery.length < 2) {
            return [];
        }

        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    search: sanitizedQuery,
                    page,
                    per_page: perPage,
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000,
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            observabilityService.captureError(error, {
                context: 'WordPressService.searchPosts',
                details: {
                    originalQuery: query,
                    sanitizedQuery,
                    page,
                    perPage
                }
            });
            throw error; // Re-throw to allow proper error handling in UI
        }
    }

    /**
     * Get posts by tag ID
     * @param tagId Tag ID to filter by
     * @param page Page number
     * @param perPage Posts per page
     */
    async getPostsByTag(tagId: number, page = 1, perPage = 10): Promise<FormattedPost[]> {
        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    tags: tagId, // Filter by tag ID
                    page,
                    per_page: perPage,
                    _embed: true,
                },
                useCache: false, // Disable cache for debugging
                cacheTTL: 5 * 60 * 1000,
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            console.error('[WordPressService] getPostsByTag ERROR:', error);
            observabilityService.captureError(error, {
                context: 'WordPressService.getPostsByTag',
                details: { tagId, page, perPage }
            });
            throw error;
        }
    }

    /**
     * Get posts by category ID
     * @param categoryId Category ID to filter by
     * @param page Page number
     * @param perPage Posts per page
     */
    async getPostsByCategory(categoryId: number, page = 1, perPage = 10): Promise<FormattedPost[]> {
        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    categories: categoryId, // Filter by category ID
                    page,
                    per_page: perPage,
                    _embed: true,
                },
                useCache: false, // Disable cache for debugging
                cacheTTL: 5 * 60 * 1000,
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            console.error('[WordPressService] getPostsByCategory ERROR:', error);
            observabilityService.captureError(error, {
                context: 'WordPressService.getPostsByCategory',
                details: { categoryId, page, perPage }
            });
            throw error;
        }
    }

    /**
     * Fetch all categories
     * @param bypassCache Force bypass cache and fetch fresh data
     */
    async getCategories(bypassCache = false): Promise<WordPressCategory[]> {
        try {
            const categories = await this.client.get<WordPressCategory[]>('categories', {
                params: {
                    per_page: 100, // Fetch all categories
                    orderby: 'count',
                    order: 'desc',
                    _embed: true, // Try to embed additional info
                },
                useCache: true,
                bypassCache,
                cacheTTL: 30 * 60 * 1000,
            });

            return categories;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getCategories' });
            return [];
        }
    }

    /**
     * Fetch a single category by ID
     * @param id Category ID
     */
    async getCategoryById(id: number): Promise<WordPressCategory | null> {
        try {
            const category = await this.client.get<WordPressCategory>(`categories/${id}`, {
                useCache: true,
                cacheTTL: 30 * 60 * 1000,
            });

            return category;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getCategoryById' });
            return null;
        }
    }

    /**
     * Fetch a single category by slug
     * @param slug Category slug
     */
    async getCategoryBySlug(slug: string): Promise<WordPressCategory | null> {
        try {
            const categories = await this.client.get<WordPressCategory[]>('categories', {
                params: {
                    slug,
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000,
            });

            if (categories && categories.length > 0) {
                return categories[0];
            }
            return null;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getCategoryBySlug', details: { slug } });
            return null;
        }
    }

    /**
     * Fetch all tags
     */
    async getTags(): Promise<WordPressTag[]> {
        try {
            const tags = await this.client.get<WordPressTag[]>('tags', {
                params: {
                    per_page: 100, // Fetch all tags
                    orderby: 'count',
                    order: 'desc',
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000, // Cache for 30 minutes
            });

            return tags;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getTags' });
            return [];
        }
    }

    /**
     * Fetch a single user by ID
     * @param id User ID
     */
    async getUserById(id: number): Promise<FormattedPost['author'] | null> {
        try {
            const user = await this.client.get<WordPressAuthor>(`users/${id}`, {
                params: {
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 60 * 60 * 1000, // Cache for 1 hour
            });

            if (!user) return null;
            return this.formatAuthor(user);
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getUserById', details: { id } });
            return null;
        }
    }

    /**
     * Format a WP user/author to app format
     */
    private formatAuthor(wpAuthor: WordPressAuthor): NonNullable<FormattedPost['author']> {
        // Extract a short role or use a default if description is too long
        // If the description starts with the same text, it's probably not a "role" but a bio
        const rawDescription = wpAuthor.description || wpAuthor.yoast_head_json?.description || '';

        let role;
        if (wpAuthor.roles && wpAuthor.roles.length > 0) {
            const primaryRole = wpAuthor.roles[0].toLowerCase();
            if (primaryRole === 'administrator') role = 'Administrador';
            else if (primaryRole === 'editor') role = 'Editor';
            else if (primaryRole === 'author') role = 'Autor';
            else if (primaryRole !== 'subscriber' && primaryRole !== 'contributor') {
                role = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1);
            }
        }

        // Only use description if it's very short and likely a title
        if (!role && wpAuthor.description && wpAuthor.description.length > 0 && wpAuthor.description.length < 40) {
            role = wpAuthor.description;
        }

        return {
            id: wpAuthor.id,
            name: wpAuthor.name,
            avatar: wpAuthor.avatar_urls?.['96'] || wpAuthor.avatar_urls?.['48'] || '',
            role,
            description: rawDescription,
            slug: wpAuthor.slug,
            link: wpAuthor.link,
            social: this.discoverSocialLinks(wpAuthor),
            yoastSEO: wpAuthor.yoast_head_json,
            count: wpAuthor.count,
        };
    }

    /**
     * Helper to extract social links from various possible WP structures
     */
    private discoverSocialLinks(obj: any): Record<string, string> {
        if (!obj) return {};
        const social: any = {};
        const platforms = [
            'facebook', 'instagram', 'youtube', 'twitter', 'linkedin',
            'tiktok', 'website', 'github', 'x', 'pinterest',
            'soundcloud', 'tumblr', 'wikipedia'
        ];

        // 1. Check Yoast SEO Schema Graph for "sameAs"
        if (obj.yoast_head_json?.schema?.['@graph']) {
            const graph = obj.yoast_head_json.schema['@graph'];

            graph.forEach((item: any) => {
                if (Array.isArray(item.sameAs)) {
                    item.sameAs.forEach((url: string) => {
                        if (!url || typeof url !== 'string') return;

                        const lowercaseUrl = url.toLowerCase();
                        platforms.forEach(p => {
                            const key = (p === 'x' || p === 'twitter') ? 'twitter' : p;
                            // Priority to schema but don't overwrite if already found
                            if (!social[key]) {
                                if (lowercaseUrl.includes(p === 'x' ? 'x.com' : p)) {
                                    let finalUrl = url.trim();

                                    // Sanitize accidental double URLs (common WP plugin glitch)
                                    if (finalUrl.includes('https://x.com/https://x.com/')) {
                                        finalUrl = finalUrl.replace('https://x.com/https://x.com/', 'https://x.com/');
                                    } else if (finalUrl.includes('https://twitter.com/https://twitter.com/')) {
                                        finalUrl = finalUrl.replace('https://twitter.com/https://twitter.com/', 'https://twitter.com/');
                                    }

                                    social[key] = finalUrl;
                                }
                            }
                        });
                    });
                }
            });
        }

        // 2. Check top level, meta, acf, and common variations
        const sources = [obj, obj.meta, obj.social_links, obj.acf].filter(Boolean);

        platforms.forEach(p => {
            for (const source of sources) {
                const value = source[p] ||
                    source[`${p}_url`] ||
                    source[`user_${p}`] ||
                    source[`user_${p}_url`] ||
                    source[`author_${p}`] ||
                    source[`wp_${p}`];

                if (value && typeof value === 'string' && value.trim() !== '' && value.trim() !== '#') {
                    let finalValue = value.trim();

                    // Handle-to-URL conversion for X/Twitter
                    if ((p === 'x' || p === 'twitter') && !finalValue.startsWith('http')) {
                        finalValue = `https://x.com/${finalValue.replace('@', '')}`;
                    } else if (!finalValue.startsWith('http') && finalValue.startsWith('www.')) {
                        finalValue = `https://${finalValue}`;
                    }

                    if (finalValue.startsWith('http')) {
                        const key = (p === 'x' || p === 'twitter') ? 'twitter' : p;
                        // Only set if not already set by schema logic
                        if (!social[key]) {
                            social[key] = finalValue;
                        }
                        break;
                    }
                }
            }
        });

        // Special fallback for website/url
        if (!social.website && (obj.url || obj.user_url || obj.link)) {
            const site = obj.url || obj.user_url || obj.link;
            if (site && site.includes('http') && !site.includes('discover.vtrading.app')) {
                social.website = site;
            }
        }

        return social;
    }
    async getTagById(id: number): Promise<WordPressTag | null> {
        try {
            const tag = await this.client.get<WordPressTag>(`tags/${id}`, {
                useCache: true,
                cacheTTL: 30 * 60 * 1000,
            });

            return tag;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getTagById' });
            return null;
        }
    }

    /**
     * Fetch a single tag by slug
     * @param slug Tag slug
     */
    async getTagBySlug(slug: string): Promise<WordPressTag | null> {
        try {
            const tags = await this.client.get<WordPressTag[]>('tags', {
                params: {
                    slug,
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000,
            });

            if (tags && tags.length > 0) {
                return tags[0];
            }
            return null;
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getTagBySlug', details: { slug } });
            return null;
        }
    }

    /**
     * Helper to format WP post to app-friendly structure
     */
    private formatPost(post: WordPressPost): FormattedPost {
        // Utility to decode HTML entities
        const decodeHtml = (html: string) => {
            return html
                .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#8217;/g, "'")
                .replace(/&#8220;/g, '"')
                .replace(/&#8221;/g, '"')
                .replace(/&#8211;/g, '-')
                .replace(/&#8212;/g, '—')
                .replace(/&#8230;/g, '...')
                .replace(/&nbsp;/g, ' ');
        };

        // Utility to strip HTML tags
        const stripHtml = (html: string) => decodeHtml(html.replace(/<[^>]*>?/gm, ''));

        // Estimate read time (avg 200 words per minute)
        const wordCount = post.content.rendered.split(/\s+/).length;
        const readTimeMinutes = Math.ceil(wordCount / 200);

        // Calculate relative time (Spanish format) using GMT to avoid timezone issues
        // WP GMT dates often don't include the 'Z' suffix, so we append it
        const date = new Date(post.date_gmt.endsWith('Z') ? post.date_gmt : `${post.date_gmt}Z`);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeString = 'Hace poco';
        if (diffMins < 1) timeString = 'Ahora';
        else if (diffMins < 60) timeString = `Hace ${Math.max(1, diffMins)}m`;
        else if (diffHours < 24) timeString = `Hace ${Math.max(1, diffHours)}h`;
        else if (diffDays < 7) timeString = `Hace ${Math.max(1, diffDays)}d`;
        else timeString = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        // Calculate relative modified time
        const mDate = new Date(post.modified_gmt.endsWith('Z') ? post.modified_gmt : `${post.modified_gmt}Z`);
        const mDiffMs = now.getTime() - mDate.getTime();
        const mDiffMins = Math.floor(mDiffMs / 60000);
        const mDiffHours = Math.floor(mDiffMins / 60);
        const mDiffDays = Math.floor(mDiffHours / 24);

        let modifiedString = 'Recién';
        if (mDiffMins < 1) modifiedString = 'Recién';
        else if (mDiffMins < 60) modifiedString = `hace ${Math.max(1, mDiffMins)}m`;
        else if (mDiffHours < 24) modifiedString = `hace ${Math.max(1, mDiffHours)}h`;
        else if (mDiffDays < 7) modifiedString = `hace ${Math.max(1, mDiffDays)}d`;
        else modifiedString = mDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        // Extract featured image from embedded data or fallback
        let featuredImage = post.jetpack_featured_media_url || 'https://via.placeholder.com/150';
        if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
            featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        }

        // Extract author from embedded data
        let author: FormattedPost['author'] | undefined;
        if (post._embedded?.author?.[0]) {
            author = this.formatAuthor(post._embedded.author[0]);
        }

        // SEO Description prioritization
        const seoDescription = post.yoast_head_json?.og_description ||
            post.yoast_head_json?.description ||
            stripHtml(post.excerpt?.rendered || '').slice(0, 160).trim() + '...';

        // Extract categories from embedded data
        let categories: WordPressCategory[] | undefined;
        let primaryCategory = 'General';
        let primaryCategoryId: number | undefined;

        if (post._embedded?.['wp:term']?.[0]) {
            categories = post._embedded['wp:term'][0] as WordPressCategory[];
            if (categories.length > 0) {
                primaryCategory = categories[0].name;
                primaryCategoryId = categories[0].id;
            }
        }

        // Extract tags from embedded data
        let tags: WordPressTag[] | undefined;
        if (post._embedded?.['wp:term']?.[1]) {
            tags = post._embedded['wp:term'][1] as WordPressTag[];
        }

        // Detect Promo/Sponsored content from tags
        const PROMO_SLUGS = ['promoted', 'promocionado', 'sponsored', 'patrocinado', 'anuncio', 'ad'];
        const isPromo = tags?.some(tag =>
            PROMO_SLUGS.includes(tag.slug.toLowerCase()) ||
            PROMO_SLUGS.includes(tag.name.toLowerCase())
        ) || false;

        // Detect Trending content from tags
        const TRENDING_SLUGS = ['trending', 'trendingnow', 'trendingtoday', 'trendingthisweek', 'trendingthismonth', 'tendencia', 'destacado'];
        const isTrending = tags?.some(tag =>
            TRENDING_SLUGS.includes(tag.slug.toLowerCase()) ||
            TRENDING_SLUGS.includes(tag.name.toLowerCase())
        ) || false;

        return {
            id: String(post.id),
            slug: post.slug,
            title: stripHtml(post.title.rendered),
            description: stripHtml(post.excerpt.rendered).slice(0, 150) + '...',
            source: 'VTrading',
            time: timeString,
            image: featuredImage,
            category: primaryCategory,
            categoryId: primaryCategoryId,
            categories,
            tags,
            readTime: `${readTimeMinutes} min`,
            link: post.link,
            excerpt: stripHtml(post.excerpt?.rendered || ''),
            content: post.content.rendered,
            modifiedTime: modifiedString,
            wordCount: wordCount,
            seoDescription,
            isPromo,
            isTrending,
            isEdited: (mDate.getTime() - date.getTime()) > 300000, // Significant change > 5 mins
            date: post.date_gmt,
            modified: post.modified_gmt,
            author,
            yoastSEO: post.yoast_head_json,
        };
    }

    /**
     * Fetch comments for a specific post
     * @param postId Post ID
     * @param page Page number
     * @param perPage Comments per page
     * @param bypassCache Force bypass cache and fetch fresh data
     */
    async getComments(
        postId: number,
        page = 1,
        perPage = 100,
        bypassCache = false
    ): Promise<FormattedComment[]> {
        try {
            const params: any = {
                post: postId,
                page,
                per_page: perPage,
                orderby: 'date',
                order: 'asc',
                status: 'approve', // Only approved comments
            };

            const comments = await this.client.get<WordPressComment[]>('comments', {
                params,
                useCache: true,
                bypassCache, // Pass through bypassCache parameter
                cacheTTL: 10 * 60 * 1000, // Cache for 10 minutes
            });

            return comments.map((comment) => this.formatComment(comment));
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getComments' });
            return [];
        }
    }

    /**
     * Format a WordPress comment to app format
     */
    private formatComment(comment: WordPressComment): FormattedComment {
        // Strip HTML from content
        const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

        // Format date to relative time
        const formatRelativeTime = (dateString: string): string => {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `Hace ${diffMins} min`;
            if (diffHours < 24) return `Hace ${diffHours}h`;
            if (diffDays < 7) return `Hace ${diffDays}d`;

            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };

        // Get avatar URL (prefer 96px, fallback to 48px or default)
        const avatar = comment.author_avatar_urls?.['96']
            || comment.author_avatar_urls?.['48']
            || 'https://via.placeholder.com/96';

        return {
            id: String(comment.id),
            author: comment.author_name,
            avatar,
            date: formatRelativeTime(comment.date),
            content: stripHtml(comment.content.rendered),
            isReply: comment.parent > 0,
            parentId: comment.parent > 0 ? String(comment.parent) : undefined,
        };
    }
}

export const wordPressService = new WordPressService();
