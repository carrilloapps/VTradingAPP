import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, StatusBar, RefreshControl, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { Text, Surface, Icon, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DiscoverHeader from '../../components/discover/DiscoverHeader';
import DiscoverSkeleton from '../../components/discover/DiscoverSkeleton';
import DiscoverErrorView from '../../components/discover/DiscoverErrorView';
import ArticleCard from '../../components/discover/ArticleCard';
import SectionHeader from '../../components/discover/SectionHeader';
import CategoryTab from '../../components/discover/CategoryTab';
import AdCard from '../../components/discover/AdCard';
import PartnersSection from '../../components/discover/PartnersSection';
import FeaturedCarousel from '../../components/discover/FeaturedCarousel';

import { useToastStore } from '../../stores/toastStore';
import { observabilityService } from '../../services/ObservabilityService';
import { remoteConfigService } from '../../services/firebase/RemoteConfigService';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import { getCategoryImage } from '../../utils/WordPressUtils';
import { useAppTheme } from '../../theme/theme';

const DiscoverScreen = () => {
  const theme = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const showToast = useToastStore((state) => state.showToast);

  // Data State
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<FormattedPost[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<FormattedPost[]>([]);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  
  // UI State
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  // Ads/Promoted
  const [adsIndex, setAdsIndex] = useState(0);
  const adsRef = useRef<FlatList>(null);
  
  // Map fetched Promoted Posts to Ad Cards
  const ads = useMemo(() => {
      if (promotedPosts.length === 0) return [];
      
      return promotedPosts.map((post, index) => ({
          id: post.id,
          title: post.title,
          subtitle: post.description || post.excerpt || '',
          cta: 'Leer más',
          color: index % 2 === 0 ? theme.colors.primary : theme.colors.secondary, // Cycle colors
          image: post.image,
          originalPost: post // Keep reference just in case we want to navigate to ArticleDetail instead
      }));
  }, [promotedPosts, theme.colors]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await remoteConfigService.fetchAndActivate(); 
        
        const isEnabled = true; 
        setFeatureEnabled(isEnabled);

        if (!isEnabled) {
            setIsLoading(false);
            return;
        }

        const { categorySlug, tagSlug } = (route.params as any) || {};
        let catId = selectedCategory;
        let filterTagId: number | undefined;

        // Fetch Tags (Trending & Promoted) & Categories
        const [
            fetchedCategories, 
            trendingTagEn, trendingTagEs,
            promotedTagEn, promotedTagEs
        ] = await Promise.all([
            wordPressService.getCategories(),
            wordPressService.getTagBySlug('trending'),
            wordPressService.getTagBySlug('tendencias'),
            wordPressService.getTagBySlug('promoted'),
            wordPressService.getTagBySlug('promocionado')
        ]);
        
        const trendingTag = trendingTagEn || trendingTagEs;
        const promotedTag = promotedTagEn || promotedTagEs;
        
        setCategories(fetchedCategories);

        if (categorySlug) {
            const category = fetchedCategories.find(c => c.slug === categorySlug);
            if (category) catId = category.id;
        }

        if (tagSlug) {
            const tag = await wordPressService.getTagBySlug(tagSlug);
            if (tag) filterTagId = tag.id;
        }

        setSelectedCategory(catId);

        // Fetch Content
        const postsPromise = wordPressService.getPosts(1, 10, catId, filterTagId);
        
        let trendingPostsPromise: Promise<FormattedPost[]> = Promise.resolve([]);
        if (trendingTag) {
            trendingPostsPromise = wordPressService.getPosts(1, 3, undefined, trendingTag.id);
        }

        let promotedPostsPromise: Promise<FormattedPost[]> = Promise.resolve([]);
        if (promotedTag) {
            // Fetch latest 5 promoted posts
            promotedPostsPromise = wordPressService.getPosts(1, 5, undefined, promotedTag.id);
        }

        const [fetchedPosts, fetchedTrendingPosts, fetchedPromotedPosts] = await Promise.all([
            postsPromise,
            trendingPostsPromise,
            promotedPostsPromise
        ]);
        
        setPosts(fetchedPosts);
        setTrendingPosts(fetchedTrendingPosts);
        setPromotedPosts(fetchedPromotedPosts);
        
      } catch (err) {
        console.error('Failed to load data', err);
        observabilityService.captureError(err, { context: 'DiscoverScreen.loadData' });
        setError('Error al cargar contenido.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!featureEnabled || ads.length === 0) return;
    const interval = setInterval(() => {
        setAdsIndex(prev => {
            const next = (prev + 1) % ads.length;
            adsRef.current?.scrollToIndex({ index: next, animated: true });
            return next;
        });
    }, 6000);
    return () => clearInterval(interval);
  }, [featureEnabled, ads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch tags to be safe or just use IDs if we stored them? Rethetching is safer for slugs
      const [
          trendingTagEn, trendingTagEs,
          promotedTagEn, promotedTagEs
      ] = await Promise.all([
          wordPressService.getTagBySlug('trending'),
          wordPressService.getTagBySlug('tendencias'),
          wordPressService.getTagBySlug('promoted'),
          wordPressService.getTagBySlug('promocionado')
      ]);
      const trendingTag = trendingTagEn || trendingTagEs;
      const promotedTag = promotedTagEn || promotedTagEs;

      const promises: Promise<any>[] = [
        wordPressService.getCategories(true), 
        wordPressService.getPosts(1, 10, selectedCategory, undefined, true) 
      ];
      
      // Add optional fetches
      if (trendingTag) {
          promises.push(wordPressService.getPosts(1, 3, undefined, trendingTag.id, true));
      } else {
          promises.push(Promise.resolve([])); // Placeholder to keep index alignment
      }

      if (promotedTag) {
          promises.push(wordPressService.getPosts(1, 5, undefined, promotedTag.id, true));
      } else {
          promises.push(Promise.resolve([]));
      }

      const results = await Promise.all(promises);
      setCategories(results[0]);
      setPosts(results[1]);
      setTrendingPosts(results[2]);
      setPromotedPosts(results[3]);
      
      showToast('Actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategorySelect = async (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    try {
      const fetchedPosts = await wordPressService.getPosts(1, 10, categoryId);
      setPosts(fetchedPosts);
    } catch (err) {
      showToast('Error al filtrar', 'error');
    }
  };

  // --- DATA PREPARATION ---
  
  // 1. Trending Data (Header)
  const trendingHeroItems = useMemo(() => trendingPosts.slice(0, 3), [trendingPosts]);
  const trendingIds = useMemo(() => new Set(trendingHeroItems.map(h => h.id)), [trendingHeroItems]);

  // 2. Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => !trendingIds.has(p.id));
  }, [posts, trendingIds]);

  const displayCategories = useMemo(() => {
    return categories.map((cat: WordPressCategory) => ({
          ...cat,
          image: getCategoryImage(cat)
      }));
  }, [categories]);

  // 3. Mixed Feed (Posts + Ads interleaved)
  const mixedFeedData = useMemo(() => {
      const data: Array<{ type: 'article' | 'ad', data: any }> = [];
      let adIndex = 0;

      filteredPosts.forEach((post, index) => {
          data.push({ type: 'article', data: post });
          
          if ((index + 1) % 2 === 0 && ads.length > 0) {
              const ad = ads[adIndex % ads.length];
              data.push({ type: 'ad', data: ad });
              adIndex++;
          }
      });

      return data;
  }, [filteredPosts, ads]);

  // --- RENDERERS ---

  const renderHeader = () => (
    <View>
      {/* Trending Section (Tendencias) */}
      {trendingHeroItems.length > 0 && (
         <FeaturedCarousel items={trendingHeroItems} />
      )}

      {/* Categories */}
      <Surface style={[styles.stickyCategoryBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outlineVariant }]} elevation={0}>
        <View style={styles.categoriesGrid}>
            {displayCategories.map(cat => (
                <View key={cat.id} style={styles.categoryWrapper}>
                    <CategoryTab 
                        name={cat.name}
                        image={cat.image}
                        count={cat.count}
                        selected={selectedCategory === cat.id}
                        onPress={() => handleCategorySelect(cat.id)}
                    />
                </View>
            ))}
        </View>
      </Surface>

      {/* Section Header */}
      {mixedFeedData.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <SectionHeader title="Lo último" showViewAll onViewAll={() => navigation.navigate('AllArticles')} />
          </View>
      )}
    </View>
  );

  const renderItem = useCallback(({ item }: { item: { type: 'article' | 'ad', data: any } }) => {
      if (item.type === 'ad') {
          return (
              <View style={{ marginBottom: 16 }}>
                <AdCard 
                    item={item.data} 
                    onPress={() => navigation.navigate('ArticleDetail', { 
                        article: item.data.originalPost || item.data 
                    })}
                />
              </View>
          );
      }
      return (
          <ArticleCard 
              article={item.data} 
              variant={'compact'}
              onPress={() => navigation.navigate('ArticleDetail', { article: item.data })}
          />
      );
  }, [navigation]);

  if (isLoading) {
    return <DiscoverSkeleton />;
  }

  if (!featureEnabled) {
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
             <DiscoverHeader onSearchPress={() => {}} />
             <ScrollView contentContainerStyle={styles.constructionContent}>
                 <View style={[styles.constructionHero, { marginTop: windowWidth * 0.4 }]}>
                     <View style={styles.iconContainer}>
                        <Icon source="flask" size={60} color={theme.colors.primary} />
                        <View style={styles.gearIcon}>
                           <Icon source="cog" size={30} color={theme.colors.secondary} />
                        </View>
                     </View>
                     <View style={[styles.statusBadge, { borderColor: theme.colors.outline }]}>
                        <View style={[styles.blinkingDot, { backgroundColor: theme.colors.primary }]} />
                        <Text style={[styles.statusText, { color: theme.colors.primary }]}>En Desarrollo</Text>
                     </View>
                     <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                       V2 Próximamente
                     </Text>
                     <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                       Estamos trabajando en una nueva experiencia de noticias.
                     </Text>
                 </View>
                 
                 <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                       <Text variant="labelMedium">Progreso</Text>
                       <Text variant="labelMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>90%</Text>
                    </View>
                    <ProgressBar progress={0.9} color={theme.colors.primary} style={styles.progressBar} />
                 </View>
             </ScrollView>
        </View>
      );
  }

  if (error) {
      return (
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <View style={{ height: 60, width: '100%', backgroundColor: theme.colors.surface }} />
              <DiscoverErrorView 
                  message={error} 
                  onRetry={() => { setError(null); setIsLoading(true); handleRefresh(); }} 
              />
          </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
            backgroundColor="transparent"
            translucent 
            barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />
        <DiscoverHeader 
            onSearchPress={() => navigation.navigate('SearchResults', {})}
        />
        <FlatList
            data={mixedFeedData}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.type}-${item.type === 'article' ? item.data.id : index}`}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={() => (
                <View>
                    <PartnersSection />
                    <View style={{ height: insets.bottom + 80 }} />
                </View>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                />
            }
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyCategoryBar: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    justifyContent: 'center',
  },
  categoryWrapper: {
    marginBottom: 0,
  },
  adsContainer: {
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -16, 
    gap: 4,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  // Construction Styles
  constructionContent: {
      flexGrow: 1,
      alignItems: 'center',
      padding: 24,
  },
  constructionHero: {
      alignItems: 'center',
      marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    position: 'absolute',
    right: -10,
    bottom: -5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  blinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
    opacity: 0.7,
  },
  progressSection: {
      width: '100%',
      maxWidth: 300,
  },
  progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  progressBar: {
      height: 6,
      borderRadius: 3,
  }
});

export default DiscoverScreen;