import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, useTheme, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  wordPressService,
  FormattedPost,
} from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import ArticleCard from '../../components/discover/ArticleCard';
import ArticleSkeleton from '../../components/discover/ArticleSkeleton';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';

const ListFooter = ({
  hasMore,
  postsLength,
  theme,
}: {
  hasMore: boolean;
  postsLength: number;
  theme: any;
}) => {
  if (hasMore) {
    return (
      <ActivityIndicator
        style={styles.footerLoader}
        color={theme.colors.primary}
      />
    );
  }
  if (postsLength > 0) {
    return (
      <Text style={[styles.footerText, { color: theme.colors.onSurface }]}>
        Has llegado al final
      </Text>
    );
  }
  return null;
};

const FlashListTyped = FlashList as any;

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
      const fetchedPosts = await wordPressService.getPosts(
        pageNum,
        10,
        undefined,
        undefined,
        shouldRefresh,
      );
      if (shouldRefresh) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      setHasMore(fetchedPosts.length === 10);
      setPage(pageNum);
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'AllArticlesScreen.fetchPosts',
        pageNum,
      });
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

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
  ];

  const renderSkeleton = () => <ArticleSkeleton />;
  const renderItem = ({ item }: { item: FormattedPost }) => (
    <ArticleCard
      article={item}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
    />
  );
  const renderFooter = () => (
    <ListFooter hasMore={hasMore} postsLength={posts.length} theme={theme} />
  );
  const renderEmpty = () =>
    !loading ? (
      <DiscoverEmptyView message="No se encontraron artículos" />
    ) : null;

  return (
    <View style={containerStyle}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Todos los Artículos" />
      </Appbar.Header>

      {loading && page === 1 ? (
        <FlashListTyped
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item: any) => item.toString()}
          renderItem={renderSkeleton}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlashListTyped
          data={posts}
          keyExtractor={(item: FormattedPost) => item.id.toString()}
          renderItem={renderItem}
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
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
  footerLoader: {
    marginVertical: 20,
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 32,
    opacity: 0.5,
  },
});

export default AllArticlesScreen;
