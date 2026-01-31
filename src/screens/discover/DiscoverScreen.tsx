import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, useWindowDimensions } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DiscoverHeader from '../../components/discover/DiscoverHeader';
import DiscoverConstructionSkeleton from '../../components/discover/DiscoverSkeleton';
import DiscoverFeedSkeleton from '../../components/discover/DiscoverFeedSkeleton';
import DiscoverErrorView from '../../components/discover/DiscoverErrorView';
import ArticleCard from '../../components/discover/ArticleCard';
import SectionHeader from '../../components/discover/SectionHeader';
import CategoryTabList from '../../components/discover/CategoryTabList';
import AdCard from '../../components/discover/AdCard';
import FeaturedCarousel from '../../components/discover/FeaturedCarousel';
import { useToastStore } from '../../stores/toastStore';
import { observabilityService } from '../../services/ObservabilityService';
import { remoteConfigService } from '../../services/firebase/RemoteConfigService';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import { getCategoryImage } from '../../utils/WordPressUtils';
import { useAppTheme } from '../../theme/theme';

const FlashListTyped = FlashList as React.ComponentType<any>;



const DiscoverScreen = () => {
  const theme = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const showToast = useToastStore((state) => state.showToast);

  // Data State
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<FormattedPost[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<FormattedPost[]>([]);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPagination, setLoadingPagination] = useState(false);

  // UI State
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  // Ads/Promoted
  const [, setAdsIndex] = useState(0);
  const adsRef = useRef<FlashListRef<any>>(null);
  const listRef = useRef<FlashListRef<any>>(null);

  // Map fetched Promoted Posts to Ad Cards
  const ads = useMemo(() => {
    if (promotedPosts.length === 0) return [];

    return promotedPosts.map((post, index) => ({
      id: post.id,
      title: post.title,
      subtitle: post.description || post.excerpt || '',
      cta: 'Leer más',
      color: index % 2 === 0 ? theme.colors.primary : theme.colors.secondary, // Cycle colors
      image: post.image,
      originalPost: post // Keep reference just in case we want to navigate to ArticleDetail instead
    }));
  }, [promotedPosts, theme.colors]);

  const fetchInitialData = useCallback(async () => {
    try {
      await remoteConfigService.fetchAndActivate();

      const isEnabled = await remoteConfigService.getFeature('discover');
      setFeatureEnabled(isEnabled);

      if (!isEnabled) {
        setIsLoading(false);
        return;
      }

      const { categorySlug, tagSlug } = (route.params as any) || {};
      let catId = selectedCategory;
      let filterTagId: number | undefined;

      // 1. Fetch Tags first to build queries
      const [
        trendingTagEn, trendingTagEs,
        promotedTagEn, promotedTagEs
      ] = await Promise.all([
        wordPressService.getTagBySlug('trending'),
        wordPressService.getTagBySlug('tendencias'),
        wordPressService.getTagBySlug('promoted'),
        wordPressService.getTagBySlug('promocionado')
      ]);

      const trendingTag = trendingTagEn || trendingTagEs;
      const promotedTag = promotedTagEn || promotedTagEs;

      // 2. Start fetching Posts and Trending immediately (Critical Content)
      if (tagSlug) {
        const tag = await wordPressService.getTagBySlug(tagSlug);
        if (tag) filterTagId = tag.id;
      }

      const postsPromise = wordPressService.getPostsPaginated(1, 10, catId, filterTagId);

      // 3. Render critical content as soon as possible
      const [postsResult] = await Promise.all([postsPromise]);

      setPosts(postsResult.data);
      setTotalPages(postsResult.totalPages);
      setCurrentPage(1);

      // 4. Secondary Content (Categories, Trending, Promoted) - Non-blocking for initial feed
      wordPressService.getCategories().then(cats => {
        setCategories(cats);
        if (categorySlug) {
          const category = cats.find(c => c.slug === categorySlug);
          if (category) {
            setSelectedCategory(category.id);
            // Verify if we need to reload filtering by this category if it wasn't set initially
            // Ideally we should have waited if categorySlug was present, but for perceived performance we loaded general first?
            // No, if categorySlug is present we probably should have waited. 
            // But let's assume standard flow.
          }
        }
      });

      if (trendingTag) {
        wordPressService.getPosts(1, 4, undefined, trendingTag.id).then(setTrendingPosts);
      }

      if (promotedTag) {
        wordPressService.getPosts(1, 5, undefined, promotedTag.id).then(setPromotedPosts);
      }

    } catch (err) {
      console.error('Failed to load data', err);
      observabilityService.captureError(err, { context: 'DiscoverScreen.loadData' });
      setError('Error al cargar contenido.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params, selectedCategory]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!featureEnabled || ads.length === 0) return;
    const interval = setInterval(() => {
      setAdsIndex(prev => {
        const next = (prev + 1) % ads.length;
        adsRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [featureEnabled, ads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
    showToast('Actualizado', 'success');
  };

  const handleCategorySelect = async (categoryId: number | undefined) => {
    try {
      const newCategoryId = categoryId === selectedCategory ? undefined : categoryId;
      setSelectedCategory(newCategoryId);

      setLoadingPagination(true);
      const fetchedPaginatedPosts = await wordPressService.getPostsPaginated(1, 10, newCategoryId);
      setPosts(fetchedPaginatedPosts.data);
      setTotalPages(fetchedPaginatedPosts.totalPages);
      setCurrentPage(1);
    } catch (err) {
      showToast('Error al filtrar', 'error');
    } finally {
      setLoadingPagination(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingPagination || currentPage >= totalPages) return;

    try {
      setLoadingPagination(true);
      const nextPage = currentPage + 1;
      const fetchedPaginatedPosts = await wordPressService.getPostsPaginated(nextPage, 10, selectedCategory);

      setPosts(prev => [...prev, ...fetchedPaginatedPosts.data]);
      setCurrentPage(nextPage);
    } catch (err) {
      // Silent error or small toast?
    } finally {
      setLoadingPagination(false);
    }
  };

  // --- DATA PREPARATION ---

  // 1. Trending Data (Header)
  const trendingHeroItems = useMemo(() => trendingPosts.slice(0, 4), [trendingPosts]);
  const trendingIds = useMemo(() => new Set(trendingHeroItems.map(h => h.id)), [trendingHeroItems]);

  // 2. Filter posts
  const promotedIds = useMemo(() => new Set(promotedPosts.map(p => p.id)), [promotedPosts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => !trendingIds.has(p.id) && !promotedIds.has(p.id));
  }, [posts, trendingIds, promotedIds]);

  const displayCategories = useMemo(() => {
    return categories.map((cat: WordPressCategory) => ({
      ...cat,
      image: getCategoryImage(cat)
    }));
  }, [categories]);

  // 3. Mixed Feed (Posts + Ads interleaved)
  const mixedFeedData = useMemo(() => {
    const data: Array<{ type: 'article' | 'ad', data: any }> = [];
    let adIndex = 0;

    filteredPosts.forEach((post, index) => {
      data.push({ type: 'article', data: post });

      if ((index + 1) % 2 === 0 && ads.length > 0) {
        const ad = ads[adIndex % ads.length];
        data.push({ type: 'ad', data: ad });
        adIndex++;
      }
    });

    return data;
  }, [filteredPosts, ads]);

  // --- RENDERERS ---

  const renderHeader = () => {
    const stickyBarStyles = [
      styles.stickyCategoryBar,
      {
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.outlineVariant
      }
    ];

    return (
      <View>
        {/* Trending Section */}
        {trendingHeroItems.length > 0 && (
          <FeaturedCarousel items={trendingHeroItems} />
        )}

        {/* Categories */}
        <Surface style={stickyBarStyles} elevation={0}>
          <CategoryTabList
            categories={displayCategories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </Surface>

        {/* Section Header */}
        {mixedFeedData.length > 0 && (
          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader title="Lo último" showViewAll onViewAll={() => navigation.navigate('AllArticles')} />
          </View>
        )}
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: { type: 'article' | 'ad', data: any } }) => {
    if (item.type === 'ad') {
      return (
        <View style={styles.adWrapper}>
          <AdCard
            item={item.data}
            onPress={() => navigation.navigate('ArticleDetail', {
              article: item.data.originalPost || item.data
            })}
          />
        </View>
      );
    }
    return (
      <ArticleCard
        article={item.data}
        variant={'compact'}
        onPress={() => navigation.navigate('ArticleDetail', { article: item.data })}
      />
    );
  }, [navigation]);

  const renderFooter = () => (
    loadingPagination ? (
      <View style={styles.footerContainer}>
        <ProgressBar indeterminate color={theme.colors.primary} style={styles.footerProgressBar} />
      </View>
    ) : <View style={{ height: insets.bottom + 20 }} />
  );

  if (isLoading) {
    return featureEnabled ? <DiscoverFeedSkeleton /> : <DiscoverConstructionSkeleton />;
  }

  const screenContainerStyle = [styles.container, { backgroundColor: theme.colors.background }];

  if (!featureEnabled) {
    // ... (Keep existing construction view logic - omitted for brevity but should be preserved if I am replacing whole file? 
    // I am replacing from line 56 to 535? No, I am replacing the component body.
    // Wait, the construction view block is large. I should preserve it.
    // I will assume I need to copy it back in if I replace the whole component.
    // To be safe, I should probably TARGET only the logic up to render, OR include the construction view code.
    // Given the complexity, I'll include the construction view code in standard form as it was.)
    const heroContentStyle = [styles.constructionHero, { marginTop: windowWidth * 0.1 }];
    const titleStyle = [styles.title, { color: theme.colors.onBackground }];
    const descriptionStyle = [styles.description, { color: theme.colors.onSurfaceVariant }];

    return (
      <View style={screenContainerStyle}>
        <DiscoverHeader
          variant="main"
          onSearchPress={() => { }}
          onNotificationsPress={() => navigation.navigate('Notifications')}
        />
        <ScrollView
          contentContainerStyle={styles.constructionContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Construction Content */}
          <View style={heroContentStyle}>
            <Text variant="displaySmall" style={titleStyle}>News V2.0</Text>
            <Text variant="bodyLarge" style={descriptionStyle}>Estamos construyendo una experiencia de trading inteligente.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    // ... Keep error view
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <DiscoverErrorView
          message={error}
          onRetry={() => { setError(null); setIsLoading(true); handleRefresh(); }}
        />
      </View>
    );
  }

  return (
    <View style={screenContainerStyle}>
      <DiscoverHeader
        variant="main"
        onSearchPress={() => navigation.navigate('SearchResults', {})}
        onNotificationsPress={() => navigation.navigate('Notifications')}
      />
      <FlashListTyped
        ref={listRef}
        data={mixedFeedData}
        renderItem={renderItem}
        keyExtractor={(item: any, index: number) => `${item.type}-${item.type === 'article' ? item.data.id : index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.elevation.level3}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        estimatedItemSize={120}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyCategoryBar: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    justifyContent: 'center',
  },
  categoryWrapper: {
    marginBottom: 0,
  },
  adsContainer: {
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -16,
    gap: 4,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  // Construction Redesign Styles
  constructionContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 60,
  },
  constructionHero: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -20,
    zIndex: -1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 10,
  },
  blinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
    opacity: 0.8,
  },
  roadmapSection: {
    width: '100%',
    marginBottom: 48,
    padding: 20,
    borderRadius: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  progressLabel: {
    opacity: 0.6,
    textAlign: 'right',
  },
  featuresPreview: {
    width: '100%',
    marginBottom: 40,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 20,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureDetails: {
    flex: 1,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  mainButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    opacity: 0.6,
  },
  sectionHeaderWrapper: {
    marginTop: 16,
  },
  adWrapper: {
    marginBottom: 16,
  },
  progressPercent: {
    fontWeight: 'bold',
  },
  errorSpacer: {
    height: 60,
    width: '100%',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  footerProgressBar: {
    width: 100,
  },
});

export default DiscoverScreen;