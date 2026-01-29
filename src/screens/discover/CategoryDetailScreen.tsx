import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CategoryDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { category: initialCategory, slug } = (route.params as any) || {};

  const [category, setCategory] = useState<WordPressCategory | null>(initialCategory || null);
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      setLoading(true);
      try {
        let currentCategory = category;
        if (!currentCategory && slug) {
          currentCategory = await wordPressService.getCategoryBySlug(slug);
          setCategory(currentCategory);
        }

        if (currentCategory) {
          const fetchedPosts = await wordPressService.getPosts(1, 10, currentCategory.id);
          setPosts(fetchedPosts);
          setHasMore(fetchedPosts.length === 10);
        }
      } catch (error) {
        observabilityService.captureError(error, { context: 'CategoryDetailScreen.fetchData', slug });
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndPosts();
  }, [slug]);

  const handleRefresh = async () => {
    if (!category) return;
    setRefreshing(true);
    try {
      const fetchedPosts = await wordPressService.getPosts(1, 10, category.id, undefined, true);
      setPosts(fetchedPosts);
      setPage(1);
      setHasMore(fetchedPosts.length === 10);
    } catch (error) {
       observabilityService.captureError(error, { context: 'CategoryDetailScreen.refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!category || !hasMore || refreshing || loading) return;
    try {
      const nextPage = page + 1;
      const morePosts = await wordPressService.getPosts(nextPage, 10, category.id);
      if (morePosts.length > 0) {
        setPosts([...posts, ...morePosts]);
        setPage(nextPage);
        setHasMore(morePosts.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      observabilityService.captureError(error, { context: 'CategoryDetailScreen.loadMore' });
    }
  };

  const renderHeader = () => (
    <Surface style={[styles.headerContainer, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
        {category?.name || 'Categoría'}
      </Text>
      {category?.description ? (
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {category.description}
        </Text>
      ) : null}
      <View style={[styles.statsContainer, { borderTopColor: theme.colors.outlineVariant }]}>
        <View style={styles.statItem}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="labelLarge" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                {category?.count || 0} Artículos
            </Text>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={category?.name || 'Cargando...'} />
      </Appbar.Header>

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onBackground }}>Cargando artículos...</Text>
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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            hasMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
            ) : posts.length > 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5, color: theme.colors.onSurface }}>
                  Fin de los artículos
              </Text>
            ) : null
          )}
          ListEmptyComponent={
            !loading ? (
              <DiscoverEmptyView message="No hay artículos en esta categoría" />
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
  headerContainer: {
    padding: 24,
    marginBottom: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
});

export default CategoryDetailScreen;
