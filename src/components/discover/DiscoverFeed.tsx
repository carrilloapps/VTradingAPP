import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, FlatList, ImageBackground, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Button, IconButton, useTheme, TouchableRipple } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';

const { width } = Dimensions.get('window');

// --- Mock Data ---

const CATEGORIES = [
  { id: 'all', label: 'Todo', icon: 'view-grid' },
  { id: 'crypto', label: 'Cripto', icon: 'bitcoin' },
  { id: 'forex', label: 'Forex', icon: 'currency-usd' },
  { id: 'tech', label: 'Tecnología', icon: 'chip' },
  { id: 'analysis', label: 'Análisis', icon: 'chart-line' },
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

// --- Components ---

const AdCard = ({ item }: { item: typeof ADS[0] }) => {
    const theme = useAppTheme();
    return (
        <Surface style={[styles.adCard, { borderRadius: theme.roundness * 4, backgroundColor: theme.colors.surface }]} elevation={3}>
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

const FeaturedHero = ({ item }: { item: typeof FEATURED_NEWS }) => {
    const theme = useAppTheme();
    return (
        <View style={styles.heroContainer}>
            <Surface style={[styles.heroCard, { borderRadius: theme.roundness * 5 }]} elevation={4}>
                <ImageBackground source={{ uri: item.image }} style={styles.heroBackground} imageStyle={{ borderRadius: theme.roundness * 5 }}>
                    <LinearGradient 
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']} 
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroContent}>
                            <Surface style={[styles.heroTag, { backgroundColor: item.tagColor }]} elevation={0}>
                                <Text style={styles.heroTagText}>{item.tag}</Text>
                            </Surface>
                            
                            <Text variant="headlineSmall" style={styles.heroTitle}>{item.title}</Text>
                            
                            <View style={styles.heroFooter}>
                                <Text style={styles.heroMeta}>{item.author}</Text>
                                <View style={styles.dotSeparator} />
                                <Text style={styles.heroMeta}>{item.time}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </Surface>
        </View>
    );
};

const NewsListItem = ({ item }: { item: typeof NEWS_LIST[0] }) => {
    const theme = useAppTheme();
    
    return (
        <TouchableRipple onPress={() => {}} style={{ borderRadius: theme.roundness * 3, marginHorizontal: 20, marginBottom: 16 }} borderless>
            <Surface style={[styles.newsItem, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
                <View style={styles.newsContent}>
                    <View style={styles.newsHeader}>
                        <Surface style={[styles.sourceChip, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                            <Text style={[styles.sourceText, { color: theme.colors.onSecondaryContainer }]}>{item.source}</Text>
                        </Surface>
                        <Text style={[styles.newsTime, { color: theme.colors.outline }]}>{item.time}</Text>
                    </View>
                    
                    <Text variant="titleMedium" style={[styles.newsTitle, { color: theme.colors.onSurface }]} numberOfLines={3}>
                        {item.title}
                    </Text>
                    
                    <View style={styles.newsFooter}>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{item.readTime} de lectura</Text>
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
                </View>
                
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.image }} style={[styles.newsImage, { borderRadius: theme.roundness * 3 }]} />
                </View>
            </Surface>
        </TouchableRipple>
    );
};

const DiscoverFeed = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const renderHeader = () => (
    <View style={styles.headerContent}>
        {/* Ads Carousel */}
        <View style={styles.adsContainer}>
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

        {/* Categories */}
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesContainer}
        >
            {CATEGORIES.map((cat) => (
                <Chip 
                    key={cat.id} 
                    icon={selectedCategory === cat.id ? 'check' : cat.icon}
                    selected={selectedCategory === cat.id} 
                    onPress={() => setSelectedCategory(cat.id)}
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
                    {cat.label}
                </Chip>
            ))}
        </ScrollView>

        {/* Featured Hero */}
        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Destacado</Text>
        <FeaturedHero item={FEATURED_NEWS} />

        <View style={styles.listHeader}>
            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginBottom: 0 }]}>Más Noticias</Text>
            <Button mode="text" compact onPress={() => {}}>Ver todo</Button>
        </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList 
        data={NEWS_LIST}
        renderItem={({ item }) => <NewsListItem item={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
  },
  headerContent: {
    marginBottom: 8,
  },
  // ADS
  adsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  adCard: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    overflow: 'hidden',
    marginTop: 16,
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
});

export default DiscoverFeed;
