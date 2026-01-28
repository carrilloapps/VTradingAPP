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
}

export interface WordPressTag {
    id: number;
    count: number;
    description: string;
    link: string;
    name: string;
    slug: string;
    taxonomy: string;
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

export interface WordPressPost {
    id: number;
    date: string;
    modified: string;
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
    _embedded?: {
        author?: WordPressAuthor[];
        'wp:featuredmedia'?: WordPressFeaturedMedia[];
        'wp:term'?: Array<WordPressCategory[] | WordPressTag[]>;
    };
}

export interface FormattedPost {
    id: string;
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
    content?: string;
    isPromo: false;
    author?: {
        name: string;
        avatar: string;
        role?: string;
    };
    yoastSEO?: YoastSEO;
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
     * Fetch a single post by ID
     * @param id Post ID
     */
    async getPostById(id: number): Promise<FormattedPost | null> {
        try {
            const post = await this.client.get<WordPressPost>(`posts/${id}`, {
                params: {
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 10 * 60 * 1000, // Cache for 10 minutes
            });

            return this.formatPost(post);
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.getPostById' });
            return null;
        }
    }

    /**
     * Search posts by keyword
     * @param query Search query
     * @param page Page number
     * @param perPage Posts per page
     */
    async searchPosts(query: string, page = 1, perPage = 10): Promise<FormattedPost[]> {
        try {
            const posts = await this.client.get<WordPressPost[]>('posts', {
                params: {
                    search: query,
                    page,
                    per_page: perPage,
                    _embed: true,
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000,
            });

            return posts.map((post) => this.formatPost(post));
        } catch (error) {
            observabilityService.captureError(error, { context: 'WordPressService.searchPosts' });
            return [];
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
                },
                useCache: true,
                bypassCache, // Pass through bypassCache parameter
                cacheTTL: 30 * 60 * 1000, // Cache for 30 minutes (categories change less frequently)
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
     * Fetch a single tag by ID
     * @param id Tag ID
     */
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
     * Helper to format WP post to app-friendly structure
     */
    private formatPost(post: WordPressPost): FormattedPost {
        // Utility to strip HTML tags
        const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

        // Estimate read time (avg 200 words per minute)
        const wordCount = post.content.rendered.split(/\s+/).length;
        const readTimeMinutes = Math.ceil(wordCount / 200);

        // Calculate relative time (simple format)
        const date = new Date(post.date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        let timeString = `${diffHours}h`;
        if (diffHours > 24) {
            timeString = `${Math.floor(diffHours / 24)}d`;
        }

        // Extract featured image from embedded data or fallback
        let featuredImage = post.jetpack_featured_media_url || 'https://via.placeholder.com/150';
        if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
            featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        }

        // Extract author from embedded data
        let author: FormattedPost['author'] | undefined;
        if (post._embedded?.author?.[0]) {
            const wpAuthor = post._embedded.author[0];
            author = {
                name: wpAuthor.name,
                avatar: wpAuthor.avatar_urls?.['96'] || wpAuthor.avatar_urls?.['48'] || '',
                role: wpAuthor.description || undefined,
            };
        }

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

        return {
            id: String(post.id),
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
            content: post.content.rendered,
            isPromo: false,
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
