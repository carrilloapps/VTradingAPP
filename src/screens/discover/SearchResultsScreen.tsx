import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text, useTheme, Appbar, Searchbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { wordPressService, FormattedPost } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleSearch(searchQuery, 1);
      } else if (searchQuery.trim().length === 0) {
        setPosts([]);
      }
    }, 500); // 500ms debounce

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
      // Ignore 400 errors from empty/canceled searches, but log others
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
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, paddingRight: 8 }}>
            <Searchbar
                placeholder="Buscar artículos..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={() => handleSearch(searchQuery, 1)}
                style={styles.searchBar}
                inputStyle={{ minHeight: 0 }}
                autoFocus={!initialQuery}
            />
        </View>
      </Appbar.Header>

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Buscando...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArticleCard 
              article={item} 
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={posts.length > 0 ? (
              <Text variant="labelLarge" style={styles.resultsCount}>
                  Resultados para "{searchQuery}"
              </Text>
          ) : null}
          ListFooterComponent={() => (
            hasMore && posts.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
            ) : posts.length > 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5 }}>Fin de los resultados</Text>
            ) : null
          )}
          ListEmptyComponent={
            !loading && searchQuery ? (
              <DiscoverEmptyView message="No se encontraron resultados para tu búsqueda" icon="magnify-close" />
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
  },
  searchBar: {
      elevation: 0,
      backgroundColor: 'transparent',
      height: 48,
  },
  resultsCount: {
      padding: 16,
      opacity: 0.7,
  },
});

export default SearchResultsScreen;
