import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar, Keyboard, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Appbar, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { wordPressService, FormattedPost, WordPressCategory, WordPressTag } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import SearchBar from '../../components/ui/SearchBar';
import { useDebounce } from '../../hooks/useDebounce';
import CategoryCard from '../../components/discover/CategoryCard';
import TagCloud from '../../components/discover/TagCloud';
import AppRecommendations from '../../components/discover/AppRecommendations';
import SectionHeader from '../../components/discover/SectionHeader';

type SearchState = 'idle' | 'searching' | 'success' | 'error' | 'too_short';

// Layout constants for consistent spacing
const LAYOUT = {
  HORIZONTAL_PADDING: 12, // Reduced from 20
  SECTION_SPACING: 14,
  BOTTOM_PADDING: 40,
};

const SearchResultsScreen = () => {
  const theme = useTheme();
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
          wordPressService.getTags()
        ]);
        
        setCategories(cats.slice(0, 5)); // Show top 5 categories
        setTrendingTags(tags.slice(0, 10)); // Top 10 tags
      } catch (error) {
        observabilityService.captureError(error, { context: 'SearchResultsScreen.fetchDiscoveryContent' });
        console.error('[SearchResults] Failed to load discovery content:', error);
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    fetchDiscoveryContent();
  }, []);

  // Handle search execution
  const executeSearch = useCallback(async (query: string, pageNum = 1, isLoadMore = false) => {
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
      const results = await wordPressService.searchPosts(trimmedQuery, pageNum, 10);

      if (pageNum === 1) {
        setPosts(results);
      } else {
        setPosts(prev => [...prev, ...results]);
      }
      
      setHasMore(results.length === 10);
      setPage(pageNum);
      setSearchState(results.length === 0 && pageNum === 1 ? 'success' : 'success');
    } catch (error: any) {
      const isNetworkError = error?.message?.toLowerCase().includes('network');
      const is400Error = error?.message?.includes('400');
      
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
        observabilityService.captureError(error, { 
          context: 'SearchResultsScreen.executeSearch', 
          query: trimmedQuery, 
          pageNum 
        });
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      }
    }
  }, []);

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
        wordPressService.getTags()
      ]);
      setCategories(cats.slice(0, 5));
      setTrendingTags(tags.slice(0, 10));
    } catch (error) {
      observabilityService.captureError(error, { context: 'SearchResultsScreen.handleRefresh' });
      console.error('[SearchResults] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle category press - filter by category ID
  const handleCategoryPress = useCallback(async (category: WordPressCategory) => {
    
    // Set flag to skip auto-search
    skipAutoSearchRef.current = true;
    
    setSearchQuery(category.name); // Update search bar (won't trigger search due to flag)
    setSearchState('searching');
    setErrorMessage('');
    
    try {
      // Use category filtering instead of text search
      const results = await wordPressService.getPostsByCategory(category.id, 1, 10);
      setPosts(results);
      setHasMore(results.length === 10);
      setPage(1);
      setSearchState('success');
    } catch (error: any) {
      console.error('[SearchResults] Category filter error:', error);
      setSearchState('error');
      setErrorMessage('Error al buscar en esta categoría');
      observabilityService.captureError(error, { context: 'SearchResultsScreen.handleCategoryPress' });
    }
  }, []);

  // Handle tag press - filter by tag ID
  const handleTagPress = useCallback(async (tagName: string) => {

    // Find the tag object to get its ID
    const tagObj = trendingTags.find(t => t.name === tagName.replace('#', ''));
    
    if (!tagObj) {
      console.error('[SearchResults] Tag not found in trendingTags:', {
        searchedFor: tagName.replace('#', ''),
        availableTags: trendingTags.map(t => t.name)
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
    } catch (error: any) {
      console.error('[SearchResults] Tag filter error:', error);
      setSearchState('error');
      setErrorMessage('Error al buscar con este tag');
      observabilityService.captureError(error, { context: 'SearchResultsScreen.handleTagPress' });
    }
  }, [trendingTags]);

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
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Categories Section */}
        <SectionHeader title="Categorías" />
        <View style={styles.sectionContent}>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={handleCategoryPress}
              />
            ))
          )}
        </View>

        {/* Trending Tags Section */}
        <SectionHeader title="Tags populares" />
        <View style={styles.sectionContent}>
          {loadingTags ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : trendingTags.length > 0 ? (
            <TagCloud 
              tags={trendingTags.map(t => `#${t.name}`)} 
              onTagPress={handleTagPress} 
            />
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
              No hay tags disponibles
            </Text>
          )}
        </View>

        {/* Recommended Apps Section */}
        <SectionHeader title="Apps de Interés" />
        <AppRecommendations />
      </ScrollView>
    );
  };

  // Render helper text based on state
  const renderHelperContent = () => {
    if (searchState === 'too_short') {
      return (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
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
            style={{ marginTop: 16 }}
          >
            Reintentar
          </Button>
        </View>
      );
    }

    return null;
  };

  // Determine what to show
  const showDiscoveryContent = searchState === 'idle' && searchQuery.trim().length === 0;
  const showSearchResults = posts.length > 0 && searchState === 'success';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header 
        elevated 
        style={{ 
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline 
        }}
      >
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
             <SearchBar
                placeholder="Buscar noticias, tickers o tags..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={() => {
                    executeSearch(searchQuery, 1, false);
                    Keyboard.dismiss();
                }}
                autoFocus={!initialQuery}
            />
        </View>
        <Appbar.Action 
          icon="bell-outline" 
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="Notificaciones"
        />
      </Appbar.Header>

      {searchState === 'searching' && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>Buscando...</Text>
        </View>
      ) : showDiscoveryContent ? (
        renderDiscoveryContent()
      ) : showSearchResults ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ArticleCard 
              article={item} 
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              variant="compact"
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={(
              <Text variant="labelLarge" style={[styles.resultsCount, { color: theme.colors.onSurfaceVariant }]}>
                  {posts.length} resultado{posts.length !== 1 ? 's' : ''} para "{debouncedQuery}"
              </Text>
          )}
          ListFooterComponent={() => (
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
            ) : !hasMore && posts.length > 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5, color: theme.colors.onSurface }}>
                  Fin de los resultados
              </Text>
            ) : null
          )}
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
});

export default SearchResultsScreen;
