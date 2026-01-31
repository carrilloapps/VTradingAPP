import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { wordPressService, FormattedPost, WordPressTag } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import { useAppTheme } from '../../theme/theme';
import ArticleCard from '../../components/discover/ArticleCard';
import CategoryTagSkeleton from '../../components/discover/CategoryTagSkeleton';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import DiscoverHeader from '../../components/discover/DiscoverHeader';
import DetailHeroHeader from '../../components/discover/DetailHeroHeader';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import CustomDialog from '../../components/ui/CustomDialog';
import CustomButton from '../../components/ui/CustomButton';
import ShareableDetail from '../../components/discover/ShareableDetail';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import { useToastStore } from '../../stores/toastStore';
import { shareTextContent } from '../../utils/ShareUtils';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as any;

const ListFooter = ({ hasMore, postsLength, theme }: { hasMore: boolean; postsLength: number; theme: any }) => {
  if (hasMore) {
    return <ActivityIndicator style={styles.footerLoader} color={theme.colors.primary} />;
  }
  if (postsLength > 0) {
    return (
      <View style={styles.endContainer}>
        <View style={[styles.endDash, { backgroundColor: theme.colors.outlineVariant }]} />
        <Text variant="labelLarge" style={styles.endText}>HAS LLEGADO AL FINAL</Text>
      </View>
    );
  }
  return null;
};

const TagDetailScreen = () => {
  const theme = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { tag: initialTag, slug } = (route.params as any) || {};

  const [tag, setTag] = useState<WordPressTag | null>(initialTag || null);
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Share Logic
  const viewShotRef = React.useRef<any>(null);
  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [, setSharing] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

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
          // Refetch to get latest count
          const freshTag = await wordPressService.getTagById(currentTag.id);
          if (freshTag) {
            setTag(freshTag);
            currentTag = freshTag;
          }

          const fetchedPosts = await wordPressService.getPosts(1, 10, undefined, currentTag.id);
          setPosts(fetchedPosts);
          setHasMore(fetchedPosts.length === 10);
        }
      } catch (e) {
        observabilityService.captureError(e, { context: 'TagDetailScreen.fetchData', slug });
      } finally {
        setLoading(false);
      }
    };

    fetchTagAndPosts();
  }, [slug, tag]);

  const handleRefresh = async () => {
    if (!tag) return;
    setRefreshing(true);
    try {
      const fetchedPosts = await wordPressService.getPosts(1, 10, undefined, tag.id, true);
      setPosts(fetchedPosts);
      setPage(1);
      setHasMore(fetchedPosts.length === 10);
    } catch (e) {
      observabilityService.captureError(e, { context: 'TagDetailScreen.refresh' });
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
    } catch (e) {
      observabilityService.captureError(e, { context: 'TagDetailScreen.loadMore' });
    }
  };

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);

    // Wait for render
    showToast('Generando imagen, por favor espera...', 'info');
    await new Promise(resolve => setTimeout(() => resolve(null), 500));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current, {
          format: 'jpg',
          quality: 1.0,
          result: 'tmpfile',
          width: 1080,
          height: format === '1:1' ? 1080 : 1920,
        });

        if (!uri) throw new Error("URI generation failed");

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `Mira esta etiqueta #${tag?.name || 'VTrading'}`,
        });

        analyticsService.logShare('tag_detail', tag?.id.toString() || 'unknown', format === '1:1' ? 'image_square' : 'image_story');
      } catch (e) {
        const err = e as any;
        if (err.message !== 'User did not share' && err.message !== 'CANCELLED') {
          observabilityService.captureError(e, { context: 'TagDetailScreen.shareImage' });
          showToast('Error al compartir imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    await shareTextContent({
      title: `#${tag?.name}`,
      excerpt: tag?.description,
      url: `https://discover.vtrading.app/tag/${tag?.slug || tag?.id}`,
      type: 'TAG',
      count: tag?.count
    });
    analyticsService.logShare('tag_detail', tag?.id.toString() || 'unknown', 'text');
  };

  const renderHeader = () => {
    const firstPostImage = posts.length > 0 ? posts[0].image : null;
    const lastUpdateDate = posts.length > 0 ? posts[0].date : undefined;

    return (
      <DetailHeroHeader
        image={firstPostImage}
        categoryName="ETIQUETA"
        title={`#${tag?.name || 'Tag'}`}
        description={tag?.yoast_head_json?.description || tag?.description}
        lastUpdateDate={lastUpdateDate}
        articleCount={tag?.count || 0}
        sectionTitle="ARTÍCULOS CON ESTA ETIQUETA"
        type="TAG"
      />
    );
  };

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];
  const dialogDescriptionStyle = [styles.dialogDescription, { color: theme.colors.onSurfaceVariant }];

  const renderArticle = ({ item, index }: { item: FormattedPost; index: number }) => (
    <ArticleCard
      article={item}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      variant={index === 0 ? 'featured' : 'compact'}
    />
  );

  const renderFooter = () => (
    <ListFooter hasMore={hasMore} postsLength={posts.length} theme={theme} />
  );

  const renderEmpty = () => (
    !loading ? (
      <DiscoverEmptyView message="No hay artículos con esta etiqueta" icon="tag-off-outline" />
    ) : null
  );

  return (
    <View style={containerStyle}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      <DiscoverHeader
        variant="tag"
        title={tag?.name || ''}
        onBackPress={() => navigation.goBack()}
        onSharePress={() => setShareDialogVisible(true)}
        scrollY={scrollY}
      />

      <ShareableDetail
        viewShotRef={viewShotRef}
        title={`#${tag?.name || 'Etiqueta'}`}
        type="TAG"
        count={tag?.count || 0}
        image={posts.length > 0 ? posts[0].image : undefined}
        aspectRatio={shareFormat}
        items={posts.slice(0, 6).map(p => ({
          title: p.title.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
          image: p.image,
          date: new Date(p.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          author: p.author?.name || 'VTrading',
          authorAvatar: p.author?.avatar
        }))}
      />

      {loading && posts.length === 0 ? (
        <CategoryTagSkeleton />
      ) : (
        <AnimatedFlashList
          data={posts}
          keyExtractor={(item: any) => item.id.toString()}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          renderItem={renderArticle as any}
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
      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir etiqueta"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={dialogDescriptionStyle}>
          Selecciona el formato ideal para compartir en tus redes sociales
        </Text>
        <View style={styles.dialogActions}>
          <CustomButton
            variant="primary"
            label="Imagen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton
            variant="secondary"
            label="Imagen vertical"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton
            variant="outlined"
            label="Solo texto"
            icon="text-short"
            onPress={handleShareText}
            fullWidth
          />
        </View>
      </CustomDialog>
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
  loadingText: {
    marginTop: 16,
    opacity: 0.6,
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
  dialogDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogActions: {
    gap: 12,
  },
});

export default TagDetailScreen;
