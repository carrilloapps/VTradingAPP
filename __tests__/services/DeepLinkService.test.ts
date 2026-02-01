import { deepLinkService } from '../../src/services/DeepLinkService';

jest.mock('react-native', () => ({
  Linking: {
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

jest.mock('@/navigation/NavigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(),
    navigate: jest.fn(),
  },
}));

jest.mock('@/services/ObservabilityService', () => ({
  observabilityService: {
    captureError: jest.fn(),
  },
}));

jest.mock('@/services/firebase/AnalyticsService', () => ({
  analyticsService: {
    logEvent: jest.fn(),
  },
  ANALYTICS_EVENTS: {
    DEEP_LINK_OPENED: 'deep_link_opened',
  },
}));

jest.mock('@/utils/safeLogger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('@/constants/AppConfig', () => ({
  AppConfig: {
    DEEP_LINK_SCHEME: 'vtrading://',
    DEEP_LINK_HOST: 'discover.vtrading.app',
  },
}));

const { Linking } = jest.requireMock('react-native') as {
  Linking: { getInitialURL: jest.Mock; addEventListener: jest.Mock };
};

const { navigationRef } = jest.requireMock('@/navigation/NavigationRef') as {
  navigationRef: { isReady: jest.Mock; navigate: jest.Mock };
};

const { observabilityService } = jest.requireMock('@/services/ObservabilityService') as {
  observabilityService: { captureError: jest.Mock };
};

const { analyticsService } = jest.requireMock('@/services/firebase/AnalyticsService') as {
  analyticsService: { logEvent: jest.Mock };
};

const SafeLogger = jest.requireMock('@/utils/safeLogger').default as {
  warn: jest.Mock;
};

describe('DeepLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deepLinkService.destroy();
  });

  it('builds deep link URLs for content types', () => {
    expect(deepLinkService.getArticleLink('slug-1')).toBe('https://discover.vtrading.app/slug-1');
    expect(deepLinkService.getCategoryLink('markets')).toBe(
      'https://discover.vtrading.app/categoria/markets',
    );
    expect(deepLinkService.getTagLink('crypto')).toBe('https://discover.vtrading.app/tag/crypto');
  });

  it('parses discover root paths', () => {
    expect(deepLinkService.parseDeepLink('vtrading://discover')).toEqual({
      type: 'discover',
      originalUrl: 'vtrading://discover',
    });

    expect(deepLinkService.parseDeepLink('https://discover.vtrading.app/discover')).toEqual({
      type: 'discover',
      originalUrl: 'https://discover.vtrading.app/discover',
    });
  });

  it('parses category, tag, and article links', () => {
    expect(deepLinkService.parseDeepLink('https://discover.vtrading.app/categoria/tech')).toEqual({
      type: 'category',
      slug: 'tech',
      originalUrl: 'https://discover.vtrading.app/categoria/tech',
    });

    expect(deepLinkService.parseDeepLink('https://discover.vtrading.app/tag/crypto')).toEqual({
      type: 'tag',
      slug: 'crypto',
      originalUrl: 'https://discover.vtrading.app/tag/crypto',
    });

    expect(deepLinkService.parseDeepLink('vtrading://article/slug-1')).toEqual({
      type: 'article',
      slug: 'slug-1',
      originalUrl: 'vtrading://article/slug-1',
    });

    expect(deepLinkService.parseDeepLink('https://discover.vtrading.app/some-article')).toEqual({
      type: 'article',
      slug: 'some-article',
      originalUrl: 'https://discover.vtrading.app/some-article',
    });

    expect(deepLinkService.parseDeepLink('vtrading://categoria/markets')).toEqual({
      type: 'category',
      slug: 'markets',
      originalUrl: 'vtrading://categoria/markets',
    });
  });

  it('rejects invalid deep links', () => {
    expect(deepLinkService.parseDeepLink('https://evil.com/slug')).toBeNull();
    expect(deepLinkService.parseDeepLink('vtrading://bad path')).toBeNull();
    expect(observabilityService.captureError).toHaveBeenCalled();
  });

  it('rejects path traversal attempts', () => {
    expect(deepLinkService.parseDeepLink('https://discover.vtrading.app/../secret')).toBeNull();
  });

  it('handles deep links when navigation is ready', async () => {
    navigationRef.isReady.mockReturnValue(true);

    await expect(
      deepLinkService.handleDeepLink('https://discover.vtrading.app/tag/crypto'),
    ).resolves.toBe(true);

    expect(analyticsService.logEvent).toHaveBeenCalledWith('deep_link_opened', {
      url: 'https://discover.vtrading.app/tag/crypto',
      type: 'tag',
      slug: 'crypto',
    });

    expect(navigationRef.navigate).toHaveBeenCalledWith('Main', {
      screen: 'Discover',
      params: { tagSlug: 'crypto' },
    });
  });

  it('navigates to article and discover routes', async () => {
    navigationRef.isReady.mockReturnValue(true);

    await expect(deepLinkService.handleDeepLink('vtrading://article/slug-1')).resolves.toBe(true);
    expect(navigationRef.navigate).toHaveBeenCalledWith('ArticleDetail', { slug: 'slug-1' });

    await expect(deepLinkService.handleDeepLink('vtrading://discover')).resolves.toBe(true);
    expect(navigationRef.navigate).toHaveBeenCalledWith('Main', { screen: 'Discover' });
  });

  it('queues deep links when navigation is not ready', async () => {
    jest.useFakeTimers();
    navigationRef.isReady.mockReturnValueOnce(false).mockReturnValue(true);

    await expect(
      deepLinkService.handleDeepLink('https://discover.vtrading.app/categoria/tech'),
    ).resolves.toBe(false);

    jest.advanceTimersByTime(1000);

    expect(navigationRef.navigate).toHaveBeenCalledWith('Main', {
      screen: 'Discover',
      params: { categorySlug: 'tech' },
    });

    jest.useRealTimers();
  });

  it('returns false when parsing fails', async () => {
    navigationRef.isReady.mockReturnValue(true);

    await expect(deepLinkService.handleDeepLink('invalid://link')).resolves.toBe(false);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it('initializes only once and cleans up subscriptions', async () => {
    const remove = jest.fn();
    Linking.getInitialURL.mockResolvedValue('vtrading://article/init');
    Linking.addEventListener.mockReturnValue({ remove });

    const handleSpy = jest.spyOn(deepLinkService, 'handleDeepLink').mockResolvedValue(true);

    const cleanup = deepLinkService.init();

    expect(Linking.getInitialURL).toHaveBeenCalled();
    expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));

    const noOpCleanup = deepLinkService.init();
    expect(SafeLogger.warn).toHaveBeenCalledWith('DeepLinkService already initialized');
    noOpCleanup();

    cleanup();
    expect(remove).toHaveBeenCalled();

    handleSpy.mockRestore();
  });

  it('does not handle initial URL when it is null', () => {
    const remove = jest.fn();
    Linking.getInitialURL.mockResolvedValue(null);
    Linking.addEventListener.mockReturnValue({ remove });

    const handleSpy = jest.spyOn(deepLinkService, 'handleDeepLink').mockResolvedValue(true);

    const cleanup = deepLinkService.init();

    expect(handleSpy).not.toHaveBeenCalled();

    cleanup();
    handleSpy.mockRestore();
  });
});
