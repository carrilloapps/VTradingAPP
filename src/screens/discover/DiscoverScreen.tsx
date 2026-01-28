import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing, StatusBar, RefreshControl } from 'react-native';
import { Text, useTheme, Button, ProgressBar, Surface } from 'react-native-paper';
import UnifiedHeader from '../../components/ui/UnifiedHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DiscoverSkeleton from '../../components/discover/DiscoverSkeleton';

import { storageService } from '../../services/StorageService';
import { fcmService } from '../../services/firebase/FCMService';
import { useToastStore } from '../../stores/toastStore';
import { observabilityService } from '../../services/ObservabilityService';
import { useRoute } from '@react-navigation/native';

import { remoteConfigService } from '../../services/firebase/RemoteConfigService';
import { wordPressService, FormattedPost, WordPressCategory } from '../../services/WordPressService';
import DiscoverFeed from '../../components/discover/DiscoverFeed';
import { useNavigation } from '@react-navigation/native';
import DiscoverErrorView from '../../components/discover/DiscoverErrorView';

const FeatureItem = ({ icon, title, description, theme }: any) => {
  const iconBgColor = theme.dark ? 'rgba(16, 185, 129, 0.1)' : '#E6FFFA';
  
  return (
    <Surface 
      style={[
        styles.featureItem, 
        { 
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outline,
          borderWidth: 1,
          elevation: 0,
        }
      ]} 
      elevation={0}
    >
      <View style={[styles.featureIconBox, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text variant="titleSmall" style={[styles.featureTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text variant="bodySmall" style={[styles.featureDescription, { color: theme.colors.onSurfaceVariant }]}>{description}</Text>
      </View>
    </Surface>
  );
};

const DiscoverScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const showToast = useToastStore((state) => state.showToast);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDiscoveryActive, setIsDiscoveryActive] = useState(false);
  const [posts, setPosts] = useState<FormattedPost[]>([]);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredPost, setFeaturedPost] = useState<FormattedPost | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const settings = await storageService.getSettings();
        setIsSubscribed(settings.newsSubscription ?? false);
        
        // Fetch Remote Config & Evaluate Feature Flag
        await remoteConfigService.fetchAndActivate();
        
        // 1. Check Advanced Feature Flag (feature_flags key)
        const isFeatureActive = await remoteConfigService.getFeature('discover');
        
        // 2. Check Simple Config (strings key) - Optional fallback
        // const stringsConfig = remoteConfigService.getJson<any>('strings');
        // const isSimpleActive = stringsConfig?.screens?.discovery === true;

        // Enable if either method allows it
        const active = isFeatureActive; // || isSimpleActive;
        setIsDiscoveryActive(active);

        if (active) {
          try {
             // 3. Handle Deep Link Slugs
             const { categorySlug, tagSlug } = (route.params as any) || {};
             let catId = selectedCategory;
             let filterTagId: number | undefined;

             // Fetch WP categories and posts
             const [fetchedCategories] = await Promise.all([
               wordPressService.getCategories(),
             ]);
             
             setCategories(fetchedCategories);

             if (categorySlug) {
               const category = fetchedCategories.find(c => c.slug === categorySlug);
               if (category) {
                 catId = category.id;
                 setSelectedCategory(catId);
               }
             }

             if (tagSlug) {
               const tag = await wordPressService.getTagBySlug(tagSlug);
               if (tag) {
                 filterTagId = tag.id;
               }
             }

             const fetchedPosts = await wordPressService.getPosts(1, 10, catId, filterTagId);
             setPosts(fetchedPosts);
             
             // Set featured post: latest with 'trending' tag or most recent post
             const trendingPost = fetchedPosts.find(post => 
               post.tags?.some(tag => tag.slug.toLowerCase() === 'trending')
             );
             setFeaturedPost(trendingPost || fetchedPosts[0]);
          } catch (err) {
             console.error('Failed to load discovery data', err);
             observabilityService.captureError(err, { context: 'DiscoverScreen.loadData' });
             setError('No se pudo cargar el contenido. Por favor intenta de nuevo.');
          }
        }

      } catch (e) {
        observabilityService.captureError(e);
        // Failed to load subscription state
      } finally {
        setIsLoadingSubscription(false);
      }

      // Simulate backend data fetching for real-time progress
      setTimeout(() => {
        // This value would come from the backend: { "progress": 0.75 }
        setProgress(0.90);
        setIsLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) return;

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse Effect for Main Icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate Effect for Gear
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [isLoading, fadeAnim, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleToggleSubscription = async () => {
    const newState = !isSubscribed;
    setIsSubscribed(newState);

    try {
      if (newState) {
        await fcmService.subscribeToTopic('news_updates');
      } else {
        await fcmService.unsubscribeFromTopic('news_updates');
      }
      await storageService.saveSettings({ newsSubscription: newState });
    } catch (e) {
      observabilityService.captureError(e);
      showToast('Error al actualizar suscripción', 'error');
      // Revert state on error
      setIsSubscribed(!newState);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Force bypass cache to get fresh data
      const [fetchedCategories, fetchedPosts] = await Promise.all([
        wordPressService.getCategories(true), // bypassCache = true
        wordPressService.getPosts(1, 10, selectedCategory, undefined, true) // bypassCache = true
      ]);
      
      setCategories(fetchedCategories);
      setPosts(fetchedPosts);
      
      // Update featured post
      const trendingPost = fetchedPosts.find(post => 
        post.tags?.some(tag => tag.slug.toLowerCase() === 'trending')
      );
      setFeaturedPost(trendingPost || fetchedPosts[0]);
      
      showToast('Contenido actualizado', 'success');
    } catch (err) {
      observabilityService.captureError(err, { context: 'DiscoverScreen.handleRefresh' });
      showToast('Error al actualizar contenido', 'error');
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
      observabilityService.captureError(err, { context: 'DiscoverScreen.handleCategorySelect' });
      showToast('Error al filtrar por categoría', 'error');
    }
  };

  if (isLoading) {
    return <DiscoverSkeleton />;
  }

  if (isDiscoveryActive && error) {
      return (
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
              <UnifiedHeader variant="section" title="Descubre" />
              <DiscoverErrorView 
                  message={error} 
                  onRetry={() => {
                      setError(null);
                      setIsLoading(true);
                      navigation.replace('Discover'); // Reload screen
                  }} 
              />
          </View>
      );
  }

  if (isDiscoveryActive) {
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar 
                backgroundColor="transparent"
                translucent 
                barStyle={theme.dark ? 'light-content' : 'dark-content'} 
            />
            <UnifiedHeader 
                variant="section" 
                title="Descubre" 
                showSecondaryAction={isDiscoveryActive}
                secondaryActionIcon="magnify"
                onSecondaryActionPress={() => navigation.navigate('SearchResults', {})}
            />
            <DiscoverFeed 
                items={posts} 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                featuredPost={featuredPost}
                onViewAllPress={() => navigation.navigate('AllArticles')}
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
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor="transparent"
        translucent 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
      />
      <UnifiedHeader 
        variant="section" 
        title="Descubre" 
      />
      
      <ScrollView 
        contentContainerStyle={[styles.content, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons name="compass" size={80} color={theme.colors.primary} />
              </Animated.View>
              <Animated.View style={[styles.gearIcon, { transform: [{ rotate: spin }] }]}>
                <MaterialCommunityIcons name="wrench" size={32} color={theme.colors.tertiary} />
              </Animated.View>
            </View>

            <View style={[styles.statusBadge, { borderColor: theme.colors.outline }]}>
              <View style={styles.blinkingDot} />
              <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>EN CONSTRUCCIÓN</Text>
            </View>

            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              Noticias & finanzas
            </Text>
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Próximamente encontrarás aquí las mejores noticias financieras y aplicaciones recomendadas para potenciar tu trading.
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="labelMedium" style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>Progreso de desarrollo</Text>
              <Text variant="labelMedium" style={[styles.progressText, { color: theme.colors.primary }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
          </View>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <Text variant="titleMedium" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
              Lo que vendrá
            </Text>
            <FeatureItem 
              icon="newspaper" 
              title="Noticias en Tiempo Real" 
              description="Mantente informado con las últimas novedades del mercado financiero."
              theme={theme}
            />
            <FeatureItem 
              icon="apps" 
              title="Apps Recomendadas" 
              description="Selección seleccionada de las mejores herramientas y billeteras."
              theme={theme}
            />
            <FeatureItem 
              icon="trending-up" 
              title="Oportunidades" 
              description="Análisis técnico y señales para mejorar tus decisiones de inversión."
              theme={theme}
            />
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <Button 
              mode={isSubscribed ? "outlined" : "contained"}
              onPress={handleToggleSubscription}
              loading={isLoadingSubscription}
              disabled={isLoadingSubscription}
              icon={isSubscribed ? "bell-off" : "bell-ring"}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isSubscribed ? "Desactivar notificaciones" : "Suscribirme a noticias"}
            </Button>
            {!isSubscribed && (
               <Text variant="bodySmall" style={[styles.notificationText, { color: theme.colors.onSurfaceVariant }]}>
                 Recibirás una notificación cuando publiquemos novedades.
               </Text>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gearIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'transparent',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // amber-500
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24, // Matches standard
    marginBottom: 12,
    gap: 16,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    borderRadius: 12,
  },
  featureTitle: {
    fontWeight: 'bold',
  },
  headerStyle: {
    borderBottomWidth: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  animatedView: {
    alignItems: 'center',
  },
  progressText: {
    fontWeight: 'bold',
  },
  buttonContent: {
    height: 48,
  },
  notificationText: {
    marginTop: 12,
  },
  featureDescription: {
    marginTop: 2,
  },
  progressLabel: {
    marginBottom: 4,
  },
});

export default DiscoverScreen;