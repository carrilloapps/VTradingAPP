import { wordPressService, WordPressPost, WordPressCategory, WordPressTag } from '../../src/services/WordPressService';
import { ApiClient } from '../../src/services/ApiClient';

// Mock dependencies
jest.mock('../../src/services/ApiClient');
jest.mock('../../src/services/ObservabilityService');

describe('WordPressService', () => {
    let mockApiClient: jest.Mocked<ApiClient>;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Get the mocked ApiClient instance
        mockApiClient = (wordPressService as any).client as jest.Mocked<ApiClient>;
    });

    describe('getPosts', () => {
        it('should fetch and format posts successfully', async () => {
            const mockWordPressPosts: WordPressPost[] = [
                {
                    id: 1,
                    date: '2026-01-28T10:00:00',
                    modified: '2026-01-28T10:00:00',
                    slug: 'test-post',
                    status: 'publish',
                    type: 'post',
                    link: 'https://discover.vtrading.app/test-post',
                    title: { rendered: 'Test Post Title' },
                    content: { rendered: '<p>This is test content with multiple words to test read time calculation.</p>', protected: false },
                    excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
                    author: 1,
                    featured_media: 1,
                    categories: [1],
                    tags: [1, 2],
                    _embedded: {
                        author: [{
                            id: 1,
                            name: 'Test Author',
                            url: 'https://example.com',
                            description: 'Test Author Bio',
                            link: 'https://example.com/author',
                            slug: 'test-author',
                            avatar_urls: { '96': 'https://example.com/avatar.jpg' }
                        }],
                        'wp:featuredmedia': [{
                            id: 1,
                            source_url: 'https://example.com/image.jpg',
                            alt_text: 'Test Image'
                        }],
                        'wp:term': [
                            [{ id: 1, name: 'Crypto', slug: 'crypto', count: 10, description: '', link: '', taxonomy: 'category', parent: 0 }],
                            [
                                { id: 1, name: 'Bitcoin', slug: 'bitcoin', count: 5, description: '', link: '', taxonomy: 'post_tag' },
                                { id: 2, name: 'Trading', slug: 'trading', count: 8, description: '', link: '', taxonomy: 'post_tag' }
                            ]
                        ]
                    },
                    yoast_head_json: {
                        title: 'Test Post - VTrading',
                        description: 'SEO description for test post',
                        canonical: 'https://discover.vtrading.app/test-post'
                    }
                }
            ];

            mockApiClient.get.mockResolvedValue(mockWordPressPosts);

            const result = await wordPressService.getPosts();

            expect(mockApiClient.get).toHaveBeenCalledWith('posts', {
                params: {
                    page: 1,
                    per_page: 10,
                    _embed: true
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '1',
                title: 'Test Post Title',
                source: 'VTrading',
                category: 'Crypto',
                categoryId: 1,
                isPromo: false
            });

            expect(result[0].author).toEqual({
                name: 'Test Author',
                avatar: 'https://example.com/avatar.jpg',
                role: 'Test Author Bio'
            });

            expect(result[0].categories).toHaveLength(1);
            expect(result[0].tags).toHaveLength(2);
            expect(result[0].yoastSEO).toBeDefined();
        });

        it('should filter posts by category', async () => {
            mockApiClient.get.mockResolvedValue([]);

            await wordPressService.getPosts(1, 10, 5);

            expect(mockApiClient.get).toHaveBeenCalledWith('posts', {
                params: {
                    page: 1,
                    per_page: 10,
                    _embed: true,
                    categories: 5
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000
            });
        });

        it('should filter posts by tag', async () => {
            mockApiClient.get.mockResolvedValue([]);

            await wordPressService.getPosts(1, 10, undefined, 3);

            expect(mockApiClient.get).toHaveBeenCalledWith('posts', {
                params: {
                    page: 1,
                    per_page: 10,
                    _embed: true,
                    tags: 3
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000
            });
        });

        it('should return empty array on error', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Network error'));

            const result = await wordPressService.getPosts();

            expect(result).toEqual([]);
        });
    });

    describe('getPostById', () => {
        it('should fetch a single post by ID', async () => {
            const mockPost: WordPressPost = {
                id: 1,
                date: '2026-01-28T10:00:00',
                modified: '2026-01-28T10:00:00',
                slug: 'test-post',
                status: 'publish',
                type: 'post',
                link: 'https://discover.vtrading.app/test-post',
                title: { rendered: 'Test Post' },
                content: { rendered: '<p>Content</p>', protected: false },
                excerpt: { rendered: '<p>Excerpt</p>', protected: false },
                author: 1,
                featured_media: 1,
                categories: [],
                tags: []
            };

            mockApiClient.get.mockResolvedValue(mockPost);

            const result = await wordPressService.getPostById(1);

            expect(mockApiClient.get).toHaveBeenCalledWith('posts/1', {
                params: { _embed: true },
                useCache: true,
                cacheTTL: 10 * 60 * 1000
            });

            expect(result).toBeDefined();
            expect(result?.id).toBe('1');
        });

        it('should return null on error', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Not found'));

            const result = await wordPressService.getPostById(999);

            expect(result).toBeNull();
        });
    });

    describe('searchPosts', () => {
        it('should search posts by query', async () => {
            mockApiClient.get.mockResolvedValue([]);

            await wordPressService.searchPosts('bitcoin');

            expect(mockApiClient.get).toHaveBeenCalledWith('posts', {
                params: {
                    search: 'bitcoin',
                    page: 1,
                    per_page: 10,
                    _embed: true
                },
                useCache: true,
                cacheTTL: 5 * 60 * 1000
            });
        });
    });

    describe('getCategories', () => {
        it('should fetch all categories', async () => {
            const mockCategories: WordPressCategory[] = [
                { id: 1, name: 'Crypto', slug: 'crypto', count: 10, description: '', link: '', taxonomy: 'category', parent: 0 },
                { id: 2, name: 'Forex', slug: 'forex', count: 5, description: '', link: '', taxonomy: 'category', parent: 0 }
            ];

            mockApiClient.get.mockResolvedValue(mockCategories);

            const result = await wordPressService.getCategories();

            expect(mockApiClient.get).toHaveBeenCalledWith('categories', {
                params: {
                    per_page: 100,
                    orderby: 'count',
                    order: 'desc'
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000
            });

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Crypto');
        });

        it('should return empty array on error', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Network error'));

            const result = await wordPressService.getCategories();

            expect(result).toEqual([]);
        });
    });

    describe('getCategoryById', () => {
        it('should fetch a single category', async () => {
            const mockCategory: WordPressCategory = {
                id: 1,
                name: 'Crypto',
                slug: 'crypto',
                count: 10,
                description: 'Cryptocurrency news',
                link: '',
                taxonomy: 'category',
                parent: 0
            };

            mockApiClient.get.mockResolvedValue(mockCategory);

            const result = await wordPressService.getCategoryById(1);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Crypto');
        });
    });

    describe('getTags', () => {
        it('should fetch all tags', async () => {
            const mockTags: WordPressTag[] = [
                { id: 1, name: 'Bitcoin', slug: 'bitcoin', count: 15, description: '', link: '', taxonomy: 'post_tag' },
                { id: 2, name: 'Trading', slug: 'trading', count: 20, description: '', link: '', taxonomy: 'post_tag' }
            ];

            mockApiClient.get.mockResolvedValue(mockTags);

            const result = await wordPressService.getTags();

            expect(mockApiClient.get).toHaveBeenCalledWith('tags', {
                params: {
                    per_page: 100,
                    orderby: 'count',
                    order: 'desc'
                },
                useCache: true,
                cacheTTL: 30 * 60 * 1000
            });

            expect(result).toHaveLength(2);
        });
    });

    describe('getTagById', () => {
        it('should fetch a single tag', async () => {
            const mockTag: WordPressTag = {
                id: 1,
                name: 'Bitcoin',
                slug: 'bitcoin',
                count: 15,
                description: '',
                link: '',
                taxonomy: 'post_tag'
            };

            mockApiClient.get.mockResolvedValue(mockTag);

            const result = await wordPressService.getTagById(1);

            expect(result).toBeDefined();
            expect(result?.name).toBe('Bitcoin');
        });
    });

    describe('formatPost', () => {
        it('should handle posts without embedded data', async () => {
            const mockPost: WordPressPost = {
                id: 1,
                date: '2026-01-28T10:00:00',
                modified: '2026-01-28T10:00:00',
                slug: 'test-post',
                status: 'publish',
                type: 'post',
                link: 'https://discover.vtrading.app/test-post',
                title: { rendered: 'Test Post' },
                content: { rendered: '<p>Short content</p>', protected: false },
                excerpt: { rendered: '<p>Excerpt</p>', protected: false },
                author: 1,
                featured_media: 1,
                categories: [],
                tags: []
            };

            mockApiClient.get.mockResolvedValue([mockPost]);

            const result = await wordPressService.getPosts();

            expect(result[0].category).toBe('General');
            expect(result[0].author).toBeUndefined();
            expect(result[0].image).toBe('https://via.placeholder.com/150');
        });

        it('should calculate read time correctly', async () => {
            const longContent = '<p>' + 'word '.repeat(400) + '</p>'; // 400 words
            const mockPost: WordPressPost = {
                id: 1,
                date: '2026-01-28T10:00:00',
                modified: '2026-01-28T10:00:00',
                slug: 'test-post',
                status: 'publish',
                type: 'post',
                link: 'https://discover.vtrading.app/test-post',
                title: { rendered: 'Test Post' },
                content: { rendered: longContent, protected: false },
                excerpt: { rendered: '<p>Excerpt</p>', protected: false },
                author: 1,
                featured_media: 1,
                categories: [],
                tags: []
            };

            mockApiClient.get.mockResolvedValue([mockPost]);

            const result = await wordPressService.getPosts();

            expect(result[0].readTime).toBe('2 min'); // 400 words / 200 wpm = 2 min
        });
    });
});
