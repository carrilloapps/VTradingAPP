import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar, Keyboard } from 'react-native';
import { Text, useTheme, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { wordPressService, FormattedPost } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import SearchBar from '../../components/ui/SearchBar';

const SearchResultsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { initialQuery } = (route.params as any) || {};

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch(searchQuery, 1);
      } else if (searchQuery.trim().length === 0) {
        setPosts([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string, pageNum = 1) => {
    if (!query.trim()) return;
    if (pageNum === 1) setLoading(true);
    
    try {
      const results = await wordPressService.searchPosts(query, pageNum, 10);
      if (pageNum === 1) {
        setPosts(results);
      } else {
        setPosts(prev => [...prev, ...results]);
      }
      setHasMore(results.length === 10);
      setPage(pageNum);
    } catch (error: any) {
      if (error?.message?.includes('400')) return;
      observabilityService.captureError(error, { context: 'SearchResultsScreen.handleSearch', query, pageNum });
    } finally {
      if (pageNum === 1) setLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    handleSearch(searchQuery, page + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, paddingRight: 16 }}>
             <SearchBar
                placeholder="Buscar artículos..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={() => {
                    handleSearch(searchQuery, 1);
                    Keyboard.dismiss();
                }}
                autoFocus={!initialQuery}
            />
        </View>
      </Appbar.Header>

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>Buscando...</Text>
        </View>
      ) : (
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={posts.length > 0 ? (
              <Text variant="labelLarge" style={[styles.resultsCount, { color: theme.colors.onSurfaceVariant }]}>
                  Resultados para "{searchQuery}"
              </Text>
          ) : null}
          ListFooterComponent={() => (
            hasMore && posts.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
            ) : posts.length > 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5, color: theme.colors.onSurface }}>
                  Fin de los resultados
              </Text>
            ) : null
          )}
          ListEmptyComponent={
            !loading && searchQuery ? (
              <DiscoverEmptyView message="No se encontraron resultados" icon="magnify-close" />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  resultsCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default SearchResultsScreen;
