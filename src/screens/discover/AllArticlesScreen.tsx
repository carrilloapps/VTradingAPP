import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { wordPressService, FormattedPost } from '@/services/WordPressService';
import { observabilityService } from '@/services/ObservabilityService';
import { useAppTheme } from '@/theme';
import ArticleCard from '@/components/discover/ArticleCard';
import CategoryTagSkeleton from '@/components/discover/CategoryTagSkeleton';
import DiscoverEmptyView from '@/components/discover/DiscoverEmptyView';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import DetailHeroHeader from '@/components/discover/DetailHeroHeader';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as any;

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
      <View style={styles.endContainer}>
        <View
          style={[
            styles.endDash,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <Text variant="labelLarge" style={styles.endText}>
          HAS LLEGADO AL FINAL
        </Text>
      </View>
    );
  }
  return null;
};

const AllArticlesScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const renderItem = ({ item, index }: { item: FormattedPost; index: number }) => (
    <ArticleCard
      article={item}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      variant={index === 0 ? 'featured' : 'compact'}
    />
  );

  const renderFooter = () => (
    <ListFooter hasMore={hasMore} postsLength={posts.length} theme={theme} />
  );

  const renderEmpty = () =>
    !loading ? (
      <DiscoverEmptyView message="No se encontraron artículos" />
    ) : null;

  const renderHeader = () => {
    const firstPostImage = posts.length > 0 ? posts[0].image : null;
    const lastUpdateDate = posts.length > 0 ? posts[0].date : undefined;

    return (
      <DetailHeroHeader
        image={firstPostImage}
        categoryName="EXPLORAR"
        title="Todos los Artículos"
        description="Mantente informado con las últimas noticias, análisis y actualizaciones del mercado financiero."
        lastUpdateDate={lastUpdateDate}
        articleCount={posts.length}
        sectionTitle="LO MÁS RECIENTE"
        type="CATEGORY"
      />
    );
  };

  return (
    <View style={containerStyle}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <DiscoverHeader
        variant="category"
        title="Todos los Artículos"
        onBackPress={() => navigation.goBack()}
        scrollY={scrollY}
      />

      {loading && posts.length === 0 ? (
        <CategoryTagSkeleton />
      ) : (
        <AnimatedFlashList
          data={posts}
          keyExtractor={(item: FormattedPost) => item.id.toString()}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          renderItem={renderItem}
          estimatedItemSize={250}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingBottom: 40,
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  endDash: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.2,
  },
  endText: {
    opacity: 0.3,
    letterSpacing: 2,
    fontWeight: '900',
  },
  footerLoader: {
    marginVertical: 32,
  },
});

export default AllArticlesScreen;
