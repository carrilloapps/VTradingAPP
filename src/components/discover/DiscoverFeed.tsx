import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, FlatList, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Surface, Chip, Button, IconButton, useTheme, TouchableRipple, Divider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { WordPressCategory, FormattedPost } from '../../services/WordPressService';

const { width } = Dimensions.get('window');

// --- Mock Data ---

// Default categories if WordPress categories are not available
const DEFAULT_CATEGORIES = [
  { id: 0, name: 'Todo', slug: 'all', count: 0, description: '', link: '', taxonomy: 'category', parent: 0 },
];

const ADS = [
  {
    id: 'ad1',
    title: 'VTrading Pro',
    subtitle: 'Herramientas premium para traders serios',
    image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=1000&auto=format&fit=crop',
    color: '#4F46E5',
    cta: 'Mejorar Plan'
  },
  {
    id: 'ad2',
    title: 'Comisiones 0%',
    subtitle: 'Opera BTC y ETH sin fees por 30 días',
    image: 'https://public.bnbstatic.com/image/cms/blog/20220215/7cd507d6-3e42-49a5-8276-358b6cb6c93c.png',
    color: '#F59E0B',
    cta: 'Aprovechar'
  },
  {
    id: 'ad3',
    title: 'Masterclass Trading',
    subtitle: 'Aprende estrategias de scalping en vivo',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=1000&auto=format&fit=crop',
    color: '#10B981',
    cta: 'Ver Clases'
  }
];

const FEATURED_NEWS = {
  id: 'f1',
  title: 'Bitcoin rompe barreras: Análisis del nuevo máximo histórico',
  author: 'CryptoDaily',
  time: 'Hace 2h',
  image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1000&auto=format&fit=crop',
  tag: 'Tendencia',
  tagColor: '#EF4444'
};

const NEWS_LIST = [
  {
    id: 'n1',
    title: 'Inflación Global: ¿Qué esperar para el Q3?',
    description: 'Los bancos centrales ajustan estrategias ante la persistencia de precios altos en el sector servicios.',
    source: 'FinanzasHoy',
    time: '4h',
    image: 'https://images.unsplash.com/photo-1526304640155-24e4cbc0716e?q=80&w=1000&auto=format&fit=crop',
    category: 'forex',
    readTime: '5 min'
  },
  {
    id: 'n2',
    title: 'Merge de Ethereum completado con éxito',
    description: 'La red pasa a Proof of Stake reduciendo su consumo energético en un 99.9%.',
    source: 'TechCrunch',
    time: '6h',
    image: 'https://images.unsplash.com/photo-1622790698141-94e30457ef12?q=80&w=1000&auto=format&fit=crop',
    category: 'crypto',
    readTime: '3 min'
  },
  {
    id: 'n3',
    title: 'Nvidia y el auge de la IA generativa',
    description: 'Reporte trimestral supera expectativas por tercera vez consecutiva.',
    source: 'MarketWatch',
    time: '8h',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
    category: 'tech',
    readTime: '4 min'
  },
  {
    id: 'n4',
    title: 'Oro busca soporte en la zona de 1900',
    description: 'Análisis técnico de los niveles clave para la semana entrante.',
    source: 'TradingView',
    time: '12h',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=1000&auto=format&fit=crop',
    category: 'analysis',
    readTime: '6 min'
  }
];

const PROMOTED_ARTICLES = [
    {
        id: 'p1',
        title: 'Las 5 Mejores Wallets Frías de 2024',
        source: 'Publicidad',
        image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1000&auto=format&fit=crop',
        isPromo: true
    },
    {
        id: 'p2',
        title: 'Invierte en startups tecnológicas con alto potencial',
        source: 'Patrocinado',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1000&auto=format&fit=crop',
        isPromo: true
    }
];

const RECOMMENDED_APPS = [
    { id: 'app1', name: 'TradingView', icon: 'chart-box-outline', color: 'adaptive' },
    { id: 'app2', name: 'MetaMask', icon: 'wallet-outline', color: '#F6851B' },
    { id: 'app3', name: 'Binance', icon: 'bitcoin', color: '#F3BA2F' },
    { id: 'app4', name: 'CoinGecko', icon: 'finance', color: '#8DC351' },
];

const PARTNERS = [
    { id: 'part1', name: 'AWS', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/1024px-Amazon_Web_Services_Logo.svg.png' },
    { id: 'part2', name: 'Firebase', image: 'https://firebase.google.com/static/images/brand-guidelines/logo-vertical.png' },
    { id: 'part3', name: 'Google Cloud', image: 'https://cloud.google.com/images/social-icon-google-cloud-1200-630.png' },
];

// --- Components ---

const AdCard = ({ item }: { item: typeof ADS[0] }) => {
    const theme = useAppTheme();
    return (
        <Surface style={[styles.adCard, { borderRadius: theme.roundness * 4, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
            <ImageBackground source={{ uri: item.image }} style={styles.adBackground} imageStyle={{ borderRadius: theme.roundness * 4 }}>
                <LinearGradient 
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']} 
                    style={styles.adGradient}
                >
                    <View style={styles.adContent}>
                        <Surface style={[styles.adBadge, { backgroundColor: item.color }]} elevation={0}>
                            <Text style={styles.adBadgeText}>Promocionado</Text>
                        </Surface>
                        
                        <View>
                            <Text variant="titleLarge" style={styles.adTitle}>{item.title}</Text>
                            <Text variant="bodyMedium" style={styles.adSubtitle}>{item.subtitle}</Text>
                        </View>

                        <Button 
                            mode="contained" 
                            buttonColor={item.color}
                            textColor="#fff"
                            style={styles.adButton}
                            labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                            onPress={() => {}}
                        >
                            {item.cta}
                        </Button>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Surface>
    );
};

const FeaturedHero = ({ item }: { item: FormattedPost }) => {
    const theme = useAppTheme();
    const navigation = useNavigation<any>();
    
    const handlePress = () => {
        if (item) {
            navigation.navigate('ArticleDetail', { article: item });
        }
    };
    
    // Get tag for display - use first tag or category
    const displayTag = item.tags && item.tags.length > 0 
        ? item.tags[0].name 
        : (item.categories && item.categories.length > 0 ? item.categories[0].name : 'Destacado');
    
    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <View style={styles.heroContainer}>
                <Surface style={[styles.heroCard, { borderRadius: theme.roundness * 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                    <ImageBackground source={{ uri: item.image }} style={styles.heroBackground} imageStyle={{ borderRadius: theme.roundness * 5 }}>
                        <LinearGradient 
                            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']} 
                            style={styles.heroGradient}
                        >
                            <View style={styles.heroContent}>
                                <Surface style={[styles.heroTag, { backgroundColor: theme.colors.primary }]} elevation={0}>
                                    <Text style={styles.heroTagText}>{displayTag}</Text>
                                </Surface>
                                
                                <Text variant="headlineSmall" style={styles.heroTitle}>{item.title}</Text>
                                
                                <View style={styles.heroFooter}>
                                    <Text style={styles.heroMeta}>{item.source}</Text>
                                    <View style={styles.dotSeparator} />
                                    <Text style={styles.heroMeta}>{item.time}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </Surface>
            </View>
        </TouchableOpacity>
    );
};

// ...

const NewsListItem = ({ item }: { item: any }) => {
    const theme = useAppTheme();
    const navigation = useNavigation<any>();
    const isPromo = item.isPromo;
    
    return (
        <TouchableRipple 
            onPress={() => {
                // Determine if it's an article to open or just a promo link
                if (!isPromo) {
                    navigation.navigate('ArticleDetail', { article: item });
                }
            }} 
            style={{ borderRadius: theme.roundness * 3, marginHorizontal: 20, marginBottom: 16 }} 
            borderless
        >
            <Surface style={[
                styles.newsItem, 
                { 
                    backgroundColor: isPromo ? (theme.dark ? '#1e293b' : '#f0f9ff') : theme.colors.elevation.level1,
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant
                }
            ]} elevation={0}>
                <View style={styles.newsContent}>
                    <View style={styles.newsHeader}>
                        <Surface style={[styles.sourceChip, { backgroundColor: isPromo ? theme.colors.primaryContainer : theme.colors.secondaryContainer }]} elevation={0}>
                            <Text style={[styles.sourceText, { color: isPromo ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer }]}>{item.source}</Text>
                        </Surface>
                        {!isPromo && <Text style={[styles.newsTime, { color: theme.colors.onSurfaceVariant }]}>{item.time}</Text>}
                    </View>
                    
                    <Text variant="titleMedium" style={[styles.newsTitle, { color: theme.colors.onSurface }]} numberOfLines={3}>
                        {item.title}
                    </Text>
                    
                    {!isPromo && (
                        <View style={styles.newsFooter}>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500' }}>{item.readTime} de lectura</Text>
                            <View style={styles.actionsRow}>
                                <IconButton 
                                    icon="bookmark-outline" 
                                    size={20} 
                                    iconColor={theme.colors.onSurfaceVariant}
                                    onPress={() => {}}
                                    style={{ margin: 0 }}
                                />
                                <IconButton 
                                    icon="share-variant-outline" 
                                    size={20} 
                                    iconColor={theme.colors.onSurfaceVariant}
                                    onPress={() => {}} 
                                    style={{ margin: 0 }}
                                />
                            </View>
                        </View>
                    )}
                    {isPromo && (
                       <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Anuncio sugerido</Text>
                    )}
                </View>
                
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.image }} style={[styles.newsImage, { borderRadius: theme.roundness * 3 }]} />
                </View>
            </Surface>
        </TouchableRipple>
    );
};

const PartnersSection = () => {
    const theme = useAppTheme();
    return (
        <View style={styles.partnersContainer}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginBottom: 12 }]}>Apps Recomendadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsScroll}>
                {RECOMMENDED_APPS.map(app => (
                    <Surface 
                        key={app.id} 
                        style={[
                            styles.appCard, 
                            { 
                                backgroundColor: theme.colors.elevation.level2,
                                borderWidth: 1,
                                borderColor: theme.colors.outlineVariant
                            }
                        ]} 
                        elevation={0}
                    >
                        <IconButton 
                            icon={app.icon} 
                            iconColor={app.color === 'adaptive' ? theme.colors.onSurface : app.color} 
                            size={28} 
                            style={{ margin: 0 }} 
                        />
                        <Text variant="labelSmall" style={{ marginTop: 4, color: theme.colors.onSurface }}>{app.name}</Text>
                    </Surface>
                ))}
            </ScrollView>

            <View style={styles.dividerContainer}>
                <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
            </View>

            <Text variant="labelMedium" style={[styles.partnersTitle, { color: theme.colors.onSurfaceVariant, opacity: 0.8 }]}>PARTNERS OFICIALES</Text>
            <View style={styles.partnersRow}>
                {PARTNERS.map(p => (
                    <Text key={p.id} style={{ fontSize: 16, fontWeight: '700', color: theme.colors.onSurfaceVariant, opacity: 0.9 }}>{p.name}</Text>
                ))}
            </View>
        </View>
    );
};

interface DiscoverFeedProps {
  items?: any[];
  categories?: WordPressCategory[];
  selectedCategory?: number;
  onCategorySelect?: (id: number | undefined) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  featuredPost?: any;
  refreshControl?: React.ReactElement<any>;
}

const DiscoverFeed = ({ 
    items = NEWS_LIST, 
    categories,
    selectedCategory,
    onCategorySelect,
    onEndReached,
    isLoadingMore = false,
    featuredPost,
    refreshControl
}: DiscoverFeedProps) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  
  // Use WordPress categories or fallback to defaults
  const displayCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    // Add "All" category at the beginning
    return [
      { id: 0, name: 'Todo', slug: 'all', count: 0, description: '', link: '', taxonomy: 'category', parent: 0 },
      ...categories
    ];
  }, [categories]);
  
  // Lifted state to parent
  const handleCategorySelect = (id: number) => {
      // If "All" (id: 0) is selected, pass undefined to fetch all posts
      onCategorySelect?.(id === 0 ? undefined : id);
  };

  // Auto-scroll for ads
  const adsRef = useRef<FlatList>(null);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        let nextIndex = adIndex + 1;
        if (nextIndex >= ADS.length) nextIndex = 0;
        adsRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setAdIndex(nextIndex);
    }, 6000);
    return () => clearInterval(interval);
  }, [adIndex]);

  // Mix news with promoted articles
  const feedData = useMemo(() => {
      const sourceList = items && items.length > 0 ? items : NEWS_LIST;
      const combinedItems = [];
      let promoIdx = 0;
      for (let i = 0; i < sourceList.length; i++) {
          combinedItems.push(sourceList[i]);
          // Insert promo every 2 items
          if ((i + 1) % 2 === 0 && promoIdx < PROMOTED_ARTICLES.length) {
              combinedItems.push(PROMOTED_ARTICLES[promoIdx]);
              promoIdx++;
          }
      }
      return combinedItems;
  }, [items]);

  const renderHeader = () => (
    <View style={styles.headerContent}>
        {/* 1. Featured Hero - Use featuredPost prop from DiscoverScreen */}
        {featuredPost && <FeaturedHero item={featuredPost} />}

        {/* 2. Categories */}
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesContainer}
        >
            {displayCategories.map((cat) => (
                <Chip 
                    key={cat.id} 
                    icon={selectedCategory === cat.id ? 'check' : 'tag'}
                    selected={selectedCategory === cat.id} 
                    onPress={() => handleCategorySelect(cat.id)}
                    style={[
                        styles.categoryChip, 
                        selectedCategory === cat.id && { backgroundColor: theme.colors.secondaryContainer },
                        { borderColor: theme.colors.outlineVariant }
                    ]}
                    textStyle={{
                        color: selectedCategory === cat.id ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                    }}
                    mode="outlined"
                    showSelectedOverlay
                >
                    {cat.name}
                </Chip>
            ))}
        </ScrollView>

        {/* 3. Ads Carousel */}
        <View style={styles.adsContainer}>
            {/* ... Ads Content ... */}
            <View style={styles.adsHeader}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, paddingHorizontal: 0, marginBottom: 0 }]}>Promociones</Text>
                <Chip icon="star" style={{ height: 24, backgroundColor: 'rgba(245, 158, 11, 0.1)' }} textStyle={{ fontSize: 10, color: '#F59E0B', marginVertical: 0, marginHorizontal: 2 }}>Exclusive</Chip>
            </View>
            <FlatList 
                ref={adsRef}
                data={ADS}
                renderItem={({ item }) => <AdCard item={item} />}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width} // Full width swipe
                decelerationRate="fast"
                contentContainerStyle={{ paddingBottom: 10 }}
                onMomentumScrollEnd={(ev) => {
                    const idx = Math.round(ev.nativeEvent.contentOffset.x / width);
                    setAdIndex(idx);
                }}
            />
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
                {ADS.map((_, index) => (
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

        <View style={styles.listHeader}>
            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginBottom: 0 }]}>Más Noticias</Text>
            <Button mode="text" compact onPress={() => {}}>Ver todo</Button>
        </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList 
        data={feedData}
        renderItem={({ item }) => <NewsListItem item={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => (
            <View>
                <PartnersSection />
                {isLoadingMore && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                         <Text variant="bodySmall">Cargando más artículos...</Text>
                    </View>
                )}
            </View>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={refreshControl}
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
  // ADS
  adsContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  adsHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingHorizontal: 20, 
    alignItems: 'center', 
    marginBottom: 8
  },
  adCard: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  adBackground: {
    width: '100%',
    height: '100%',
  },
  adGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  adContent: {
    gap: 8,
    alignItems: 'flex-start',
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  adBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adTitle: {
    color: 'white',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  adSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  adButton: {
    borderRadius: 20,
    marginTop: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
    justifyContent: 'center',
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  
  // Hero
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heroCard: {
    height: 260,
    overflow: 'hidden',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    gap: 8,
  },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 4,
  },
  heroTagText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 11,
  },
  heroTitle: {
    color: 'white',
    fontWeight: '800',
    lineHeight: 28,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    fontSize: 12,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    marginRight: 0,
  },

  // Section Headers
  sectionTitle: {
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
    marginBottom: 16,
  },

  // News List
  newsItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  newsContent: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'space-between',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  sourceChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  newsTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  newsTitle: {
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 0,
  },
  imageWrapper: {
    justifyContent: 'center',
  },
  newsImage: {
    width: 90,
    height: 90,
    backgroundColor: '#eee',
  },
  
  // Partners Section
  partnersContainer: {
      paddingBottom: 20,
      paddingTop: 10,
  },
  appsScroll: {
      paddingHorizontal: 20,
      gap: 12,
      paddingBottom: 10,
  },
  appCard: {
      width: 90,
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
  },
  dividerContainer: {
      paddingHorizontal: 20,
      marginVertical: 20,
  },
  partnersTitle: {
      textAlign: 'center',
      fontWeight: 'bold',
      letterSpacing: 2,
      marginBottom: 16,
  },
  partnersRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
});

export default DiscoverFeed;
