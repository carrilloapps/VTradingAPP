import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  wordPressService,
  FormattedPost,
  WordPressCategory,
  WordPressTag,
} from '@/services/WordPressService';
import { observabilityService } from '@/services/ObservabilityService';
import SafeLogger from '@/utils/safeLogger';
import ArticleCard from '@/components/discover/ArticleCard';
import ArticleSkeleton from '@/components/discover/ArticleSkeleton';
import DiscoverEmptyView from '@/components/discover/DiscoverEmptyView';
import Skeleton from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import CategoryCard from '@/components/discover/CategoryCard';
import TagCloud from '@/components/discover/TagCloud';
import AppRecommendations from '@/components/discover/AppRecommendations';
import SectionHeader from '@/components/discover/SectionHeader';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import { useAppTheme } from '@/theme';

type SearchState = 'idle' | 'searching' | 'success' | 'error' | 'too_short';

const FlashListTyped = FlashList as any;

// Layout constants for consistent spacing
const LAYOUT = {
  HORIZONTAL_PADDING: 16,
  SECTION_SPACING: 20,
  BOTTOM_PADDING: 40,
};

const ListHeader = ({
  count,
  query,
  theme,
}: {
  count: number;
  query: string;
  theme: any;
}) => (
  <Text
    variant="labelLarge"
    style={[styles.resultsCount, { color: theme.colors.onSurfaceVariant }]}
  >
    {count} resultado{count !== 1 ? 's' : ''} para "{query}"
  </Text>
);

const ListFooter = ({
  loadingMore,
  hasMore,
  postsLength,
  theme,
}: {
  loadingMore: boolean;
  hasMore: boolean;
  postsLength: number;
  theme: any;
}) => {
  if (loadingMore) {
    return (
      <ActivityIndicator
        style={styles.footerLoader}
        color={theme.colors.primary}
      />
    );
  }
  if (!hasMore && postsLength > 0) {
    return (
      <Text style={[styles.endOfResults, { color: theme.colors.onSurface }]}>
        Fin de los resultados
      </Text>
    );
  }
  return null;
};

const SearchResultsScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { initialQuery } = (route.params as any) || {};

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Discovery content state
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [trendingTags, setTrendingTags] = useState<WordPressTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  // Refresh state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Flag to skip auto-search when filtering by category/tag
  const skipAutoSearchRef = useRef(false);

  // Debounce search query with 600ms delay
  const debouncedQuery = useDebounce(searchQuery, 600);

  // Fetch categories and tags on mount
  useEffect(() => {
    const fetchDiscoveryContent = async () => {
      try {
        setLoadingCategories(true);
        setLoadingTags(true);

        // Fetch categories and tags in parallel
        const [cats, tags] = await Promise.all([
          wordPressService.getCategories(),
          wordPressService.getTags(),
        ]);

        setCategories(cats.slice(0, 5)); // Show top 5 categories
        setTrendingTags(tags.slice(0, 10)); // Top 10 tags
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'SearchResultsScreen.fetchDiscoveryContent',
        });
        SafeLogger.error(
          '[SearchResults] Failed to load discovery content:',
          e,
        );
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    fetchDiscoveryContent();
  }, []);

  // Handle search execution
  const executeSearch = useCallback(
    async (query: string, pageNum = 1, isLoadMore = false) => {
      const trimmedQuery = query.trim();

      // Validate minimum length
      if (trimmedQuery.length === 0) {
        setPosts([]);
        setSearchState('idle');
        return;
      }

      if (trimmedQuery.length < 2) {
        setPosts([]);
        setSearchState('too_short');
        return;
      }

      // Set loading state
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setSearchState('searching');
        setErrorMessage('');
      }

      try {
        const results = await wordPressService.searchPosts(
          trimmedQuery,
          pageNum,
          10,
        );

        if (pageNum === 1) {
          setPosts(results);
        } else {
          setPosts(prev => [...prev, ...results]);
        }

        setHasMore(results.length === 10);
        setPage(pageNum);
        setSearchState(
          results.length === 0 && pageNum === 1 ? 'success' : 'success',
        );
      } catch (e) {
        const isNetworkError = (e as Error)?.message
          ?.toLowerCase()
          .includes('network');
        const is400Error = (e as Error)?.message?.includes('400');

        let userMessage = 'Error al buscar. Por favor, intenta de nuevo.';

        if (isNetworkError) {
          userMessage = 'Sin conexión a internet. Verifica tu conexión.';
        } else if (is400Error) {
          userMessage = 'Búsqueda inválida. Intenta con otros términos.';
        }

        setErrorMessage(userMessage);
        setSearchState('error');

        // Only capture non-network errors to Sentry
        if (!isNetworkError) {
          observabilityService.captureError(e, {
            context: 'SearchResultsScreen.executeSearch',
            query: trimmedQuery,
            pageNum,
          });
        }
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  // Effect: Execute search when debounced query changes
  useEffect(() => {
    // Skip if we're filtering by category/tag
    if (skipAutoSearchRef.current) {
      skipAutoSearchRef.current = false; // Reset flag
      return;
    }

    executeSearch(debouncedQuery, 1, false);
  }, [debouncedQuery, executeSearch]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || searchState === 'searching') return;
    executeSearch(debouncedQuery, page + 1, true);
  }, [hasMore, loadingMore, searchState, debouncedQuery, page, executeSearch]);

  // Handle retry
  const handleRetry = useCallback(() => {
    executeSearch(searchQuery, 1, false);
  }, [searchQuery, executeSearch]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [cats, tags] = await Promise.all([
        wordPressService.getCategories(),
        wordPressService.getTags(),
      ]);
      setCategories(cats.slice(0, 5));
      setTrendingTags(tags.slice(0, 10));
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'SearchResultsScreen.handleRefresh',
      });
      SafeLogger.error('[SearchResults] Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle category press - filter by category ID
  const handleCategoryPress = useCallback(
    async (category: WordPressCategory) => {
      // Set flag to skip auto-search
      skipAutoSearchRef.current = true;

      setSearchQuery(category.name); // Update search bar (won't trigger search due to flag)
      setSearchState('searching');
      setErrorMessage('');

      try {
        // Use category filtering instead of text search
        const results = await wordPressService.getPostsByCategory(
          category.id,
          1,
          10,
        );
        setPosts(results);
        setHasMore(results.length === 10);
        setPage(1);
        setSearchState('success');
      } catch (e) {
        SafeLogger.error('[SearchResults] Category filter error:', e);
        setSearchState('error');
        setErrorMessage('Error al buscar en esta categoría');
        observabilityService.captureError(e, {
          context: 'SearchResultsScreen.handleCategoryPress',
        });
      }
    },
    [],
  );

  // Handle tag press - filter by tag ID
  const handleTagPress = useCallback(
    async (tagName: string) => {
      // Find the tag object to get its ID
      const tagObj = trendingTags.find(
        t => t.name === tagName.replace('#', ''),
      );

      if (!tagObj) {
        SafeLogger.error('[SearchResults] Tag not found in trendingTags:', {
          searchedFor: tagName.replace('#', ''),
          availableTags: trendingTags.map(t => t.name),
        });
        return;
      }

      // Set flag to skip auto-search
      skipAutoSearchRef.current = true;

      setSearchQuery(tagObj.name); // Update search bar (won't trigger search due to flag)
      setSearchState('searching');
      setErrorMessage('');

      try {
        // Use tag filtering instead of text search
        const results = await wordPressService.getPostsByTag(tagObj.id, 1, 10);
        setPosts(results);
        setHasMore(results.length === 10);
        setPage(1);
        setSearchState('success');
      } catch (e) {
        SafeLogger.error('[SearchResults] Tag filter error:', e);
        setSearchState('error');
        setErrorMessage('Error al buscar con este tag');
        observabilityService.captureError(e, {
          context: 'SearchResultsScreen.handleTagPress',
        });
      }
    },
    [trendingTags],
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
  ];
  const helperTextStyle = [
    styles.helperText,
    { color: theme.colors.onSurfaceVariant },
  ];
  const retryButtonStyle = [styles.retryButton, { marginTop: 16 }];
  const noTagsTextStyle = [
    styles.noTagsText,
    { color: theme.colors.onSurfaceVariant },
  ];

  // Render discovery content (idle state)
  const renderDiscoveryContent = () => {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
      >
        {/* Categories Section */}
        <SectionHeader title="Categorías" paddingHorizontal={0} />
        <View style={styles.sectionContent}>
          {loadingCategories ? (
            <View style={styles.skeletonsContainer}>
              <Skeleton width="100%" height={60} borderRadius={12} />
              <Skeleton width="100%" height={60} borderRadius={12} />
              <Skeleton width="100%" height={60} borderRadius={12} />
            </View>
          ) : (
            categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={handleCategoryPress}
              />
            ))
          )}
        </View>

        {/* Trending Tags Section */}
        <SectionHeader title="Tags populares" paddingHorizontal={0} />
        <View style={styles.sectionContent}>
          {loadingTags ? (
            <View style={styles.tagsSkeletonContainer}>
              <Skeleton width={80} height={32} borderRadius={16} />
              <Skeleton width={60} height={32} borderRadius={16} />
              <Skeleton width={90} height={32} borderRadius={16} />
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : trendingTags.length > 0 ? (
            <TagCloud
              tags={trendingTags.map(t => `#${t.name}`)}
              onTagPress={handleTagPress}
            />
          ) : (
            <Text variant="bodySmall" style={noTagsTextStyle}>
              No hay tags disponibles
            </Text>
          )}
        </View>

        {/* Recommended Apps Section */}
        <SectionHeader title="Apps Recomendadas" paddingHorizontal={0} />
        <AppRecommendations />
      </ScrollView>
    );
  };

  // Render helper text based on state
  const renderHelperContent = () => {
    if (searchState === 'too_short') {
      return (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={helperTextStyle}>
            Escribe al menos 2 caracteres para buscar
          </Text>
        </View>
      );
    }

    if (searchState === 'error') {
      return (
        <View style={styles.centered}>
          <DiscoverEmptyView
            message={errorMessage}
            icon="alert-circle-outline"
          />
          <Button
            mode="contained"
            onPress={handleRetry}
            style={retryButtonStyle}
          >
            Reintentar
          </Button>
        </View>
      );
    }

    return null;
  };

  const renderArticle = ({ item }: { item: FormattedPost }) => (
    <ArticleCard
      article={item}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      variant="compact"
    />
  );

  const renderSearchResultsHeader = () => (
    <ListHeader count={posts.length} query={debouncedQuery} theme={theme} />
  );

  const renderSearchResultsFooter = () => (
    <ListFooter
      loadingMore={loadingMore}
      hasMore={hasMore}
      postsLength={posts.length}
      theme={theme}
    />
  );

  // Determine what to show
  const showDiscoveryContent =
    searchState === 'idle' && searchQuery.trim().length === 0;
  const showSearchResults =
    posts.length > 0 &&
    (searchState === 'success' || (searchState === 'searching' && page > 1));

  const renderSkeleton = () => <ArticleSkeleton />;

  return (
    <View style={containerStyle}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <DiscoverHeader
        variant="search"
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          executeSearch(searchQuery, 1, false);
          Keyboard.dismiss();
        }}
        onBackPress={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        autoFocus={!initialQuery}
      />

      {searchState === 'searching' && page === 1 ? (
        <FlashListTyped
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item: any) => item.toString()}
          renderItem={renderSkeleton}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : showDiscoveryContent ? (
        renderDiscoveryContent()
      ) : showSearchResults ? (
        <FlashListTyped
          data={posts}
          keyExtractor={(item: FormattedPost) => item.id.toString()}
          renderItem={renderArticle}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderSearchResultsHeader}
          ListFooterComponent={renderSearchResultsFooter}
        />
      ) : (
        renderHelperContent()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingTop: LAYOUT.SECTION_SPACING,
    paddingBottom: LAYOUT.BOTTOM_PADDING,
  },
  sectionContent: {
    marginBottom: LAYOUT.SECTION_SPACING,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.HORIZONTAL_PADDING,
  },
  listContent: {
    paddingBottom: LAYOUT.BOTTOM_PADDING,
    paddingTop: 8,
  },
  resultsCount: {
    paddingHorizontal: LAYOUT.HORIZONTAL_PADDING,
    paddingVertical: 12,
  },
  skeletonsContainer: {
    gap: 8,
    marginVertical: 8,
  },
  tagsSkeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  noTagsText: {
    fontStyle: 'italic',
  },
  helperText: {
    textAlign: 'center',
  },
  retryButton: {
    // marginTop is handled in computed style for theme consistency
  },
  footerLoader: {
    marginVertical: 20,
  },
  endOfResults: {
    textAlign: 'center',
    marginVertical: 32,
    opacity: 0.5,
  },
});

export default SearchResultsScreen;
