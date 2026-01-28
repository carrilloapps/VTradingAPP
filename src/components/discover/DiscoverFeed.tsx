import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Chip, Avatar, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { WordPressCategory, FormattedPost } from '../../services/WordPressService';
import ArticleCard from './ArticleCard';
import SectionHeader from './SectionHeader';
import FeaturedHero from './FeaturedHero';
import ArticleSkeleton from './ArticleSkeleton';
import CategoryTab from './CategoryTab';
import AdCard from './AdCard';
import PartnersSection from './PartnersSection';

// Mocks removed to adhere to zero-mock architecture
// These should be fetched via RemoteConfig or WordPressService in the future
const DEFAULT_ADS: any[] = [];
const DEFAULT_PROMOTES: any[] = [];

interface DiscoverFeedProps {
  items?: any[];
  categories?: WordPressCategory[];
  selectedCategory?: number;
  onCategorySelect?: (id: number | undefined) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  featuredPost?: any;
  refreshControl?: React.ReactElement<any>;
  onViewAllPress?: () => void;
  ads?: any[];
  promotedArticles?: any[];
}

const DiscoverFeed = ({ 
    items = [], 
    categories = [],
    selectedCategory,
    onCategorySelect,
    onEndReached,
    isLoadingMore = false,
    featuredPost,
    refreshControl,
    onViewAllPress,
    ads = DEFAULT_ADS,
    promotedArticles = DEFAULT_PROMOTES
}: DiscoverFeedProps) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  
  // Use WordPress categories
  const displayCategories = useMemo(() => {
    // Helper to extract image from category
    const getCategoryImage = (cat: WordPressCategory) => {
        // Try Yoast OG image
        if (cat.yoast_head_json?.og_image?.[0]?.url) {
            return cat.yoast_head_json.og_image[0].url;
        }
        // Try ACF image (common fields: image, icon, thumbnail)
        if (cat.acf?.image?.url) return cat.acf.image.url;
        if (cat.acf?.icon?.url) return cat.acf.icon.url;
        if (typeof cat.acf?.image === 'string' && cat.acf.image.startsWith('http')) return cat.acf.image;
        return undefined;
    };

    // Add "All" category at the beginning
    const allCategory = { 
        id: 0, 
        name: 'Todo', 
        slug: 'all', 
        count: 0, 
        description: 'Todos los artículos', 
        link: '', 
        taxonomy: 'category', 
        parent: 0,
        image: undefined 
    };

    return [
      allCategory,
      ...categories.map(cat => ({
          ...cat,
          image: getCategoryImage(cat)
      }))
    ];
  }, [categories]);
  
  const handleCategorySelect = useCallback((id: number) => {
      onCategorySelect?.(id === 0 ? undefined : id);
  }, [onCategorySelect]);

  // Auto-scroll for ads
  const adsRef = useRef<FlatList>(null);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
        setAdIndex(prev => {
            const next = (prev + 1) % ads.length;
            adsRef.current?.scrollToIndex({ index: next, animated: true });
            return next;
        });
    }, 6000);
    return () => clearInterval(interval);
  }, [ads]);

  // Unified data source for the list
  const feedData = useMemo(() => {
    // 1. The Category Bar is logically the first item of the scrolable list content (sticky)
    const data: any[] = [{ type: 'categories', id: 'sticky-categories' }];

    if (items.length === 0 && isLoadingMore) {
        // Show initial loading skeletons
        data.push(...[1, 2, 3, 4].map(i => ({ type: 'skeleton', id: `skel-${i}`, variant: i === 1 ? 'featured' : 'compact' })));
        return data;
    }

    // 2. Mix news with promoted articles
    let thermoData = [...items];
    if (promotedArticles.length) {
        const combined = [];
        let promoIdx = 0;
        for (let i = 0; i < thermoData.length; i++) {
            combined.push(thermoData[i]);
            if ((i + 1) % 4 === 0 && promoIdx < promotedArticles.length) {
                combined.push({ ...promotedArticles[promoIdx], isPromo: true });
                promoIdx++;
            }
        }
        thermoData = combined;
    }

    // Wrap elements into data objects
    const articleItems = thermoData.map(item => ({ type: 'article', id: item.id, data: item }));
    
    // 3. Middle Section Header (Flattened into list to avoid overlap)
    // We insert it after the "featured" slot if we want a specific editorial flow
    // or just at the beginning of the news list.
    data.push({ type: 'section_header', id: 'more-news-header', title: 'Más Noticias' });
    data.push(...articleItems);

    return data;
  }, [items, promotedArticles, isLoadingMore]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContent}>
        {/* 1. Featured Hero */}
        {featuredPost && <FeaturedHero item={featuredPost} />}

        {/* 2. Ads Carousel */}
        {ads.length > 0 && (
            <View style={styles.adsContainer}>
                <FlatList 
                    ref={adsRef}
                    data={ads}
                    renderItem={({ item }) => <AdCard item={item} />}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={windowWidth} 
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingBottom: 10 }}
                    onMomentumScrollEnd={(ev) => {
                        const idx = Math.round(ev.nativeEvent.contentOffset.x / windowWidth);
                        setAdIndex(idx);
                    }}
                />
                <View style={styles.paginationContainer}>
                    {ads.map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.paginationDot, 
                                { 
                                    backgroundColor: index === adIndex ? theme.colors.primary : theme.colors.surfaceDisabled,
                                    width: index === adIndex ? 16 : 6
                                }
                            ]} 
                        />
                    ))}
                </View>
            </View>
        )}
    </View>
  ), [featuredPost, ads, theme, adIndex, windowWidth]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item.type === 'categories') {
        return (
            <Surface style={[styles.stickyCategoryBar, { backgroundColor: theme.colors.background }]} elevation={2}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {displayCategories.map((cat: any) => (
                        <CategoryTab 
                            key={cat.id}
                            name={cat.name}
                            image={cat.image}
                            count={cat.count}
                            selected={selectedCategory === cat.id}
                            onPress={() => handleCategorySelect(cat.id)}
                        />
                    ))}
                </ScrollView>
            </Surface>
        );
    }

    if (item.type === 'section_header') {
        return <SectionHeader title={item.title} showViewAll onViewAll={onViewAllPress} />;
    }

    if (item.type === 'skeleton') {
        return <ArticleSkeleton variant={item.variant} />;
    }

    // Article item
    const article = item.data;
    // index 0 is categories, index 1 is section header, so index 2 is the first real article item
    const isFirstArticle = index === 2;
    const variant = isFirstArticle && !article.isPromo ? 'featured' : 'compact';
    
    return (
        <ArticleCard 
            article={article as FormattedPost} 
            variant={article.isPromo ? 'compact' : variant}
            onPress={() => {
                if (!article.isPromo) {
                    navigation.navigate('ArticleDetail', { article });
                }
            }}
        />
    );
  }, [displayCategories, selectedCategory, theme, handleCategorySelect, navigation, onViewAllPress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList 
        data={feedData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]} // Categories is index 0 in feedData
        ListFooterComponent={() => (
            <View>
                <PartnersSection />
                {isLoadingMore && (
                    <View style={{ paddingBottom: 40 }}>
                         <ArticleSkeleton variant="compact" />
                         <ArticleSkeleton variant="compact" />
                    </View>
                )}
            </View>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={refreshControl}
        // Performance optimizations
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
  },
  headerContent: {
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    height: 52, // Increased for taller tabs
  },
  categoryChip: { // Keep for back-compat if needed, though we switched to CategoryTab
    height: 36,
    borderRadius: 12,
  },
  adsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  stickyCategoryBar: {
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default React.memo(DiscoverFeed);
