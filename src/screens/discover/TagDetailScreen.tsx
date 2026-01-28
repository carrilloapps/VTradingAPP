import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { wordPressService, FormattedPost, WordPressTag } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TagDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { tag: initialTag, slug } = (route.params as any) || {};

  const [tag, setTag] = useState<WordPressTag | null>(initialTag || null);
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchTagAndPosts = async () => {
      setLoading(true);
      try {
        let currentTag = tag;
        if (!currentTag && slug) {
          currentTag = await wordPressService.getTagBySlug(slug);
          setTag(currentTag);
        }

        if (currentTag) {
          const fetchedPosts = await wordPressService.getPosts(1, 10, undefined, currentTag.id);
          setPosts(fetchedPosts);
          setHasMore(fetchedPosts.length === 10);
        }
      } catch (error) {
        observabilityService.captureError(error, { context: 'TagDetailScreen.fetchData', slug });
      } finally {
        setLoading(false);
      }
    };

    fetchTagAndPosts();
  }, [slug]);

  const handleRefresh = async () => {
    if (!tag) return;
    setRefreshing(true);
    try {
      const fetchedPosts = await wordPressService.getPosts(1, 10, undefined, tag.id, true);
      setPosts(fetchedPosts);
      setPage(1);
      setHasMore(fetchedPosts.length === 10);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!tag || !hasMore || refreshing || loading) return;
    try {
      const nextPage = page + 1;
      const morePosts = await wordPressService.getPosts(nextPage, 10, undefined, tag.id);
      if (morePosts.length > 0) {
        setPosts([...posts, ...morePosts]);
        setPage(nextPage);
        setHasMore(morePosts.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderHeader = () => (
    <Surface style={[styles.headerContainer, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
        <View style={styles.tagIconContainer}>
            <MaterialCommunityIcons name="tag-outline" size={32} color={theme.colors.primary} />
        </View>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        #{tag?.name || 'Tag'}
      </Text>
      <View style={[styles.statsContainer, { borderTopColor: theme.colors.outlineVariant }]}>
        <View style={styles.statItem}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="labelLarge" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                {tag?.count || 0} Artículos
            </Text>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header style={{ backgroundColor: 'transparent' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`#${tag?.name || 'Cargando...'}`} />
      </Appbar.Header>

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Buscando artículos...</Text>
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
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5 }}>Fin de los artículos</Text>
            ) : null
          )}
          ListEmptyComponent={
            !loading ? (
              <DiscoverEmptyView message="No hay artículos con este hashtag" icon="tag-off-outline" />
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
    alignItems: 'center',
  },
  tagIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
});

export default TagDetailScreen;
