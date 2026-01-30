import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { Text, Surface, Icon, ProgressBar } from 'react-native-paper';
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
import PartnersSection from '../../components/discover/PartnersSection';
import FeaturedCarousel from '../../components/discover/FeaturedCarousel';
import PaginationControls from '../../components/discover/PaginationControls';

import { useToastStore } from '../../stores/toastStore';
import { observabilityService } from '../../services/ObservabilityService';
import { remoteConfigService } from '../../services/firebase/RemoteConfigService';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import { getCategoryImage } from '../../utils/WordPressUtils';
import { useAppTheme } from '../../theme/theme';

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
  const [adsIndex, setAdsIndex] = useState(0);
  const adsRef = useRef<FlatList>(null);
  const listRef = useRef<FlatList>(null);

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

  useEffect(() => {
    const loadData = async () => {
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

        // Fetch Tags (Trending & Promoted) & Categories
        const [
          fetchedCategories,
          trendingTagEn, trendingTagEs,
          promotedTagEn, promotedTagEs
        ] = await Promise.all([
          wordPressService.getCategories(),
          wordPressService.getTagBySlug('trending'),
          wordPressService.getTagBySlug('tendencias'),
          wordPressService.getTagBySlug('promoted'),
          wordPressService.getTagBySlug('promocionado')
        ]);

        const trendingTag = trendingTagEn || trendingTagEs;
        const promotedTag = promotedTagEn || promotedTagEs;

        setCategories(fetchedCategories);

        if (categorySlug) {
          const category = fetchedCategories.find(c => c.slug === categorySlug);
          if (category) catId = category.id;
        }

        if (tagSlug) {
          const tag = await wordPressService.getTagBySlug(tagSlug);
          if (tag) filterTagId = tag.id;
        }

        setSelectedCategory(catId);

        // Fetch Content with Pagination
        const postsPromise = wordPressService.getPostsPaginated(1, 10, catId, filterTagId);

        let trendingPostsPromise: Promise<FormattedPost[]> = Promise.resolve([]);
        if (trendingTag) {
          trendingPostsPromise = wordPressService.getPosts(1, 3, undefined, trendingTag.id);
        }

        let promotedPostsPromise: Promise<FormattedPost[]> = Promise.resolve([]);
        if (promotedTag) {
          // Fetch latest 5 promoted posts
          promotedPostsPromise = wordPressService.getPosts(1, 5, undefined, promotedTag.id);
        }

        const [fetchedPaginatedPosts, fetchedTrendingPosts, fetchedPromotedPosts] = await Promise.all([
          postsPromise,
          trendingPostsPromise,
          promotedPostsPromise
        ]);

        setPosts(fetchedPaginatedPosts.data);
        setTotalPages(fetchedPaginatedPosts.totalPages);
        setCurrentPage(1);

        setTrendingPosts(fetchedTrendingPosts);
        setPromotedPosts(fetchedPromotedPosts);

      } catch (err) {
        console.error('Failed to load data', err);
        observabilityService.captureError(err, { context: 'DiscoverScreen.loadData' });
        setError('Error al cargar contenido.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
    try {
      // Re-fetch tags
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

      const promises: Promise<any>[] = [
        wordPressService.getCategories(true),
        wordPressService.getPostsPaginated(1, 10, selectedCategory, undefined, true)
      ];

      // Add optional fetches
      if (trendingTag) {
        promises.push(wordPressService.getPosts(1, 3, undefined, trendingTag.id, true));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (promotedTag) {
        promises.push(wordPressService.getPosts(1, 5, undefined, promotedTag.id, true));
      } else {
        promises.push(Promise.resolve([]));
      }

      const results = await Promise.all(promises);
      setCategories(results[0]);

      const postsResult = results[1];
      setPosts(postsResult.data);
      setTotalPages(postsResult.totalPages);
      setCurrentPage(1);

      setTrendingPosts(results[2]);
      setPromotedPosts(results[3]);

      showToast('Actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategorySelect = async (categoryId: number | undefined) => {
    try {
      const newCategoryId = categoryId === selectedCategory ? undefined : categoryId;
      setSelectedCategory(newCategoryId);

      // Load first page of new category
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

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || loadingPagination) return;

    try {
      setLoadingPagination(true);
      const fetchedPaginatedPosts = await wordPressService.getPostsPaginated(newPage, 10, selectedCategory);
      setPosts(fetchedPaginatedPosts.data);
      setCurrentPage(newPage);

      // Scroll to top of list
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err) {
      showToast('Error al cargar página', 'error');
    } finally {
      setLoadingPagination(false);
    }
  };

  // --- DATA PREPARATION ---

  // 1. Trending Data (Header)
  const trendingHeroItems = useMemo(() => trendingPosts.slice(0, 3), [trendingPosts]);
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

  const renderHeader = () => (
    <View>
      {/* Trending Section (Tendencias) */}
      {trendingHeroItems.length > 0 && (
        <FeaturedCarousel items={trendingHeroItems} />
      )}

      {/* Categories */}
      <Surface style={[styles.stickyCategoryBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outlineVariant }]} elevation={0}>
        <CategoryTabList
          categories={displayCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      </Surface>

      {/* Section Header */}
      {mixedFeedData.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Lo último" showViewAll onViewAll={() => navigation.navigate('AllArticles')} />
        </View>
      )}
    </View>
  );

  const renderItem = useCallback(({ item }: { item: { type: 'article' | 'ad', data: any } }) => {
    if (item.type === 'ad') {
      return (
        <View style={{ marginBottom: 16 }}>
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

  if (isLoading) {
    return featureEnabled ? <DiscoverFeedSkeleton /> : <DiscoverConstructionSkeleton />;
  }

  if (!featureEnabled) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <DiscoverHeader
          variant="main"
          onSearchPress={() => { }}
          onNotificationsPress={() => navigation.navigate('Notifications')}
        />
        <ScrollView
          contentContainerStyle={styles.constructionContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={[styles.constructionHero, { marginTop: windowWidth * 0.1 }]}>
            <View style={[styles.glowContainer, { backgroundColor: theme.colors.primaryContainer, opacity: 0.15 }]} />
            <View style={styles.iconContainer}>
              <Icon source="rocket-launch" size={80} color={theme.colors.primary} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.blinkingDot, { backgroundColor: theme.colors.primary }]} />
              <Text variant="labelLarge" style={[styles.statusText, { color: theme.colors.primary }]}>En Laboratorio</Text>
            </View>
            <Text variant="displaySmall" style={[styles.title, { color: theme.colors.onBackground }]}>
              News V2.0
            </Text>
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Estamos construyendo una experiencia de trading inteligente con noticias en tiempo real potenciadas por IA.
            </Text>
          </View>

          {/* Roadmap Section */}
          <View style={styles.roadmapSection}>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium">Fase de Desarrollo</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>95%</Text>
            </View>
            <ProgressBar progress={0.95} color={theme.colors.primary} style={styles.progressBar} />
            <Text variant="labelSmall" style={styles.progressLabel}>Casi listo para el lanzamiento beta</Text>
          </View>

          {/* Features Preview List */}
          <View style={styles.featuresPreview}>
            <Text variant="titleLarge" style={styles.sectionTitle}>¿Qué esperar?</Text>

            <Surface style={styles.featureItem} elevation={1}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon source="star" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.featureDetails}>
                <Text variant="titleMedium">Alertas Inteligentes</Text>
                <Text variant="bodySmall">Notificaciones personalizadas según tu portafolio.</Text>
              </View>
            </Surface>

            <Surface style={styles.featureItem} elevation={1}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Icon source="trending-up" size={24} color={theme.colors.secondary} />
              </View>
              <View style={styles.featureDetails}>
                <Text variant="titleMedium">Análisis de Sentimiento</Text>
                <Text variant="bodySmall">IA procesando el pulso del mercado en segundos.</Text>
              </View>
            </Surface>
          </View>

          {/* Action CTA */}
          <View style={styles.ctaContainer}>
            <Surface style={[styles.mainButton, { backgroundColor: theme.colors.primary }]} elevation={4}>
              <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>Notificarme al Lanzamiento</Text>
            </Surface>
            <Text variant="bodySmall" style={styles.ctaSubtitle}>Únete a los +10,000 inversores esperando.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ height: 60, width: '100%', backgroundColor: theme.colors.surface }} />
        <DiscoverErrorView
          message={error}
          onRetry={() => { setError(null); setIsLoading(true); handleRefresh(); }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <DiscoverHeader
        variant="main"
        onSearchPress={() => navigation.navigate('SearchResults', {})}
        onNotificationsPress={() => navigation.navigate('Notifications')}
      />
      <FlatList
        ref={listRef}
        data={mixedFeedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.type === 'article' ? item.data.id : index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={Boolean(mixedFeedData.length) ? () => (
          <View>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={() => handlePageChange(currentPage - 1)}
              onNext={() => handlePageChange(currentPage + 1)}
              loading={loadingPagination}
            />
            <PartnersSection />
            <View style={{ height: insets.bottom + 80 }} />
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
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
  }
});

export default DiscoverScreen;