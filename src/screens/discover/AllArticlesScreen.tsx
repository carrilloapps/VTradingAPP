import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text, useTheme, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { wordPressService, FormattedPost } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import ArticleSkeleton from '../../components/discover/ArticleSkeleton';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AllArticlesScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (pageNum = 1, shouldRefresh = false) => {
    if (pageNum === 1) setLoading(true);
    try {
      const fetchedPosts = await wordPressService.getPosts(pageNum, 10, undefined, undefined, shouldRefresh);
      if (shouldRefresh) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      setHasMore(fetchedPosts.length === 10);
      setPage(pageNum);
    } catch (error) {
      observabilityService.captureError(error, { context: 'AllArticlesScreen.fetchPosts', pageNum });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
  };

  const loadMore = () => {
    if (!hasMore || loading || refreshing) return;
    fetchPosts(page + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Todos los Artículos" />
      </Appbar.Header>

      {loading && page === 1 ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ArticleSkeleton />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            hasMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
            ) : posts.length > 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 32, opacity: 0.5 }}>Has llegado al final</Text>
            ) : null
          )}
          ListEmptyComponent={
            !loading ? (
              <DiscoverEmptyView message="No se encontraron artículos" />
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
});

export default AllArticlesScreen;
