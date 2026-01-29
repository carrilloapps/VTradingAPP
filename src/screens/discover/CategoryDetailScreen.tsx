import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import { observabilityService } from '../../services/ObservabilityService';
import { useAppTheme } from '../../theme/theme';
import ArticleCard from '../../components/discover/ArticleCard';
import DiscoverEmptyView from '../../components/discover/DiscoverEmptyView';
import GradientAppbar from '../../components/common/GradientAppbar';
import DetailHeroHeader from '../../components/discover/DetailHeroHeader';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import CustomDialog from '../../components/ui/CustomDialog';
import CustomButton from '../../components/ui/CustomButton';
import ShareableDetail from '../../components/discover/ShareableDetail';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import { useToastStore } from '../../stores/toastStore';

const CategoryDetailScreen = () => {
  const theme = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { category: initialCategory, slug } = (route.params as any) || {};

  const [category, setCategory] = useState<WordPressCategory | null>(initialCategory || null);
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Share Logic
  const viewShotRef = React.useRef<any>(null);
  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [sharing, setSharing] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

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
          // Refetch to get latest count
          const freshCategory = await wordPressService.getCategoryById(currentCategory.id);
          if (freshCategory) {
            setCategory(freshCategory);
            currentCategory = freshCategory;
          }

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
      setRefreshing(false);
      setHasMore(fetchedPosts.length === 10);
    } catch (error) {
      observabilityService.captureError(error, { context: 'CategoryDetailScreen.refresh' });
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '---';
    }
  };

  const renderHeader = () => {
    const firstArticleImage = posts.length > 0 ? posts[0].image : null;
    const lastUpdateDate = posts.length > 0 ? posts[0].date : undefined;

    return (
      <DetailHeroHeader
        image={firstArticleImage}
        categoryName="CATEGORÍA"
        title={category?.name || 'Categoría'}
        description={category?.yoast_head_json?.description || category?.description || 'Explora las noticias más recientes y análisis técnicos profundos en nuestra sección especializada.'}
        lastUpdateDate={lastUpdateDate}
        articleCount={category?.count || 0}
        sectionTitle={`PRÓXIMAS LECTURAS EN ${category?.name.toUpperCase()}`}
        type="CATEGORY"
      />
    );
  };

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);

    // Wait for render
    await new Promise(resolve => setTimeout(() => resolve(null), 300));

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
          message: `Mira lo nuevo en ${category?.name || 'VTrading'}`,
        });

        analyticsService.logShare('category_detail', category?.id.toString() || 'unknown', format === '1:1' ? 'image_square' : 'image_story');
      } catch (e: any) {
        if (e.message !== 'User did not share' && e.message !== 'CANCELLED') {
          observabilityService.captureError(e, { context: 'CategoryDetailScreen.shareImage' });
          showToast('Error al compartir imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    try {
      const topNews = posts.slice(0, 3).map(p => `• ${p.title}`).join('\n');
      const message = `📂 *Categoría: ${category?.name}*\n\n` +
        `${topNews || category?.description || 'Descubre los mejores artículos.'}\n\n` +
        `🔗 _Leelo en VTrading_`;

      await Share.open({ message });
      analyticsService.logShare('category_detail', category?.id.toString() || 'unknown', 'text');
    } catch (e: any) {
      if (e.message !== 'User did not share' && e.message !== 'CANCELLED') {
        showToast('Error al compartir', 'error');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <GradientAppbar
        title={category?.name || ''}
        onBack={() => navigation.goBack()}
        onShare={() => setShareDialogVisible(true)}
      />

      <ShareableDetail
        viewShotRef={viewShotRef}
        title={category?.name || 'Categoría'}
        type="CATEGORY"
        count={category?.count || 0}
        image={posts.length > 0 ? posts[0].image : undefined}
        aspectRatio={shareFormat}
        items={posts.slice(0, 6).map(p => ({
          title: p.title.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
          image: p.image,
          date: new Date(p.date).toLocaleDateString(),
          author: p.author?.name || 'VTrading'
        }))}
      />

      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>Preparando contenido exclusivo...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              variant={index === 0 ? 'featured' : 'compact'}
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
              <ActivityIndicator style={{ marginVertical: 32 }} color={theme.colors.primary} />
            ) : posts.length > 0 ? (
              <View style={styles.endContainer}>
                <View style={[styles.endLine, { backgroundColor: theme.colors.outlineVariant }]} />
                <Text variant="labelLarge" style={styles.endText}>HAS LLEGADO AL FINAL</Text>
              </View>
            ) : null
          )}
          ListEmptyComponent={
            !loading ? (
              <DiscoverEmptyView message="No hay artículos en esta categoría" />
            ) : null
          }
        />
      )}
      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir Categoría"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20, color: theme.colors.onSurfaceVariant }}>
          Comparte esta categoría con tus amigos
        </Text>

        <View style={{ gap: 12 }}>
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
  endLine: {
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
});

export default CategoryDetailScreen;
