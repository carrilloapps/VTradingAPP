import React from 'react';
import { View, StyleSheet, Image, Animated, Share, StatusBar, useWindowDimensions, RefreshControl, ActivityIndicator, Linking, TouchableOpacity, ScrollView as RNScrollView, Dimensions, Platform } from 'react-native';
import { Text, IconButton, Chip, Divider, Avatar, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/theme';
import { analyticsService } from '../../services/firebase/AnalyticsService';
import { wordPressService, FormattedComment, FormattedPost } from '../../services/WordPressService';
import { remoteConfigService } from '../../services/firebase/RemoteConfigService';
import { observabilityService } from '../../services/ObservabilityService';
import { CommentsList } from '../../components/discover/CommentsList';
import ArticleCard from '../../components/discover/ArticleCard';
import AuthorCard from '../../components/discover/AuthorCard';
import DiscoverErrorView from '../../components/discover/DiscoverErrorView';


const BlockParagraph = ({ text, theme }: any) => (
    <Text variant="bodyLarge" style={[styles.paragraph, { color: theme.colors.onSurface }]}>{text}</Text>
);

const BlockHeading = ({ text, theme }: any) => (
    <Text variant="titleLarge" style={[styles.heading, { color: theme.colors.primary }]}>{text}</Text>
);

const BlockQuote = ({ text, author, theme }: any) => (
    <View style={[styles.quoteContainer, { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.elevation.level2 }]}>
        <MaterialCommunityIcons name="format-quote-open" size={32} color={theme.colors.primary} style={styles.quoteIcon} />
        <Text style={[styles.quoteText, { color: theme.colors.onSurface }]}>{text}</Text>
        {author && <Text style={[styles.quoteAuthor, { color: theme.colors.outline }]}>— {author}</Text>}
    </View>
);

const BlockImage = ({ url, caption, theme }: any) => (
    <View style={styles.imageBlock}>
        <Image 
          source={{ uri: url }} 
          style={styles.contentImage} 
          accessibilityRole="image"
          accessibilityLabel={caption || 'Imagen del artículo'}
        />
        {caption && <Text style={[styles.imageCaption, { color: theme.colors.outline }]}>{caption}</Text>}
    </View>
);

const BlockList = ({ items, theme }: any) => (
    <View style={styles.listBlock}>
        {items.map((item: string, index: number) => (
            <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.listItemText, { color: theme.colors.onSurface }]}>{item}</Text>
            </View>
        ))}
    </View>
);

const ArticleDetailScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [webViewHeight, setWebViewHeight] = React.useState(100);
  const [comments, setComments] = React.useState<FormattedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [commentsEnabled, setCommentsEnabled] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  
  // New states for deep linking
  const [articleData, setArticleData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = React.useState<FormattedPost[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(false);
  const [contentHeight, setContentHeight] = React.useState(0);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Safe width calculation for header content
  const headerContentWidth = windowWidth - 120; // Space between back and share buttons
  
  // Logic to merge incoming params or fetched data
  // Logic to prioritize fetched data (full article) over incoming params (partial article)
  const params = route.params as any;
  const incomingArticle = articleData || params?.article;
  const slug = params?.slug;

  const article = incomingArticle ? {
      ...incomingArticle, 
      author: {
          ...(incomingArticle?.author || {})
      },
      // Use WordPress tags if available
      tags: incomingArticle?.tags?.map((tag: any) => typeof tag === 'string' ? { name: tag } : tag) || [],
      // Use WordPress categories if available
      categories: incomingArticle?.categories || [],
      // Use Yoast SEO description if available
      seoDescription: incomingArticle?.yoastSEO?.description || incomingArticle?.seoDescription || '',
  } : null;

  // Effect to load article by slug if not provided
  React.useEffect(() => {
    const loadArticleAndRelated = async () => {
      let currentArticle = params?.article;
      
      // Clear previous article data to avoid flickering or stale content when navigating between posts
      setArticleData(null);
      setWebViewHeight(100);
      
      // Always fetch full article data to ensure we have the complete content, 
      // as list views might only contain excerpts or truncated content.
      if (slug || currentArticle?.id) {
        setIsLoading(!currentArticle); // Only show full loader if we don't even have partial data
        setError(null);
        try {
          const fetchedArticle = slug 
            ? await wordPressService.getPostBySlug(slug)
            : await wordPressService.getPostById(Number(currentArticle.id), true); // Force bypass cache for detail

          if (fetchedArticle) {
            setArticleData(fetchedArticle);
            currentArticle = fetchedArticle;
          } else if (!currentArticle) {
            setError('Artículo no encontrado');
          }
        } catch (err) {
            observabilityService.captureError(err, { context: 'ArticleDetailScreen.loadArticle', slug, id: currentArticle?.id });
            if (!currentArticle) setError('Error al cargar el artículo');
        } finally {
            setIsLoading(true); // Temporally keep it so transitions are smooth
            setTimeout(() => setIsLoading(false), 300);
        }
      }

      // Fetch related posts if we have an article
      if (currentArticle?.id && currentArticle?.categories?.[0]?.id) {
        setLoadingRelated(true);
        try {
          const fetchedRelated = await wordPressService.getRelatedPosts(
            Number(currentArticle.id),
            currentArticle.categories[0].id
          );
          setRelatedPosts(fetchedRelated);
        } catch (err) {
          console.error('Error fetching related posts:', err);
        } finally {
          setLoadingRelated(false);
        }
      }
    };
    loadArticleAndRelated();
  }, [slug, params?.article?.id]); // Depend on id to refetch if switching articles via related section

  React.useEffect(() => {
    if (article?.id) {
        analyticsService.logScreenView('ArticleDetail', article.title);
    }
  }, [article?.id, article?.title]);

  // Check comments feature flag and fetch comments
  React.useEffect(() => {
    const loadCommentsFeature = async () => {
      try {
        await remoteConfigService.fetchAndActivate();
        const isCommentsActive = await remoteConfigService.getFeature('comments');
        setCommentsEnabled(isCommentsActive);

        if (isCommentsActive && article?.id) {
          setCommentsLoading(true);
          const fetchedComments = await wordPressService.getComments(Number(article.id));
          setComments(fetchedComments);
          setCommentsLoading(false);
        }
      } catch (error) {
        observabilityService.captureError(error, { context: 'ArticleDetailScreen.loadCommentsFeature' });
        setCommentsLoading(false);
      }
    };

    loadCommentsFeature();
  }, [article?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      if (commentsEnabled && article?.id) {
        // Force bypass cache to get fresh comments
        const fetchedComments = await wordPressService.getComments(Number(article.id), 1, 100, true);
        setComments(fetchedComments);
      }
    } catch (error) {
      observabilityService.captureError(error, { context: 'ArticleDetailScreen.handleRefresh' });
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced Share with Deep Links
  const handleShare = async () => {
    try {
      // Generate deep link for the article
      const articleId = article.id || article.slug || 'unknown';
      const deepLink = `vtrading://article/${articleId}`;
      const webLink = `https://discover.vtrading.app/article/${articleId}`;
      
      const shareMessage = `📰 ${article.title}\n\n${article.excerpt || ''}\n\n🔗 Leer más: ${webLink}\n\nAbrir en la app: ${deepLink}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: article.title,
        url: webLink, // iOS uses this
      });
      
      if (result.action === Share.sharedAction) {
        analyticsService.logEvent('article_shared', {
          article_id: articleId,
          article_title: article.title,
          share_method: result.activityType || 'unknown',
        });
      }
    } catch (error) {
      observabilityService.captureError(error, { context: 'ArticleDetailScreen.handleShare' });
    }
  };



  const renderBlock = (block: any, index: number) => {
      switch (block.type) {
          case 'paragraph': return <BlockParagraph key={index} text={block.text} theme={theme} />;
          case 'heading': return <BlockHeading key={index} text={block.text} theme={theme} />;
          case 'quote': return <BlockQuote key={index} text={block.text} author={block.author} theme={theme} />;
          case 'image': return <BlockImage key={index} url={block.url} caption={block.caption} theme={theme} />;
          case 'list': return <BlockList key={index} items={block.items} theme={theme} />;
          default: return null;
      }
  };

  const headerOpacity = scrollY.interpolate({
      inputRange: [0, 200],
      outputRange: [0, 1],
      extrapolate: 'clamp'
  });
  
  // HTML Content Renderer (WebView)
  const renderHtmlContent = () => {
      const textColor = theme.colors.onSurface;
      const linkColor = theme.colors.primary;
      
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
              body { 
                font-family: -apple-system, Roboto, sans-serif; 
                font-size: 16px; 
                line-height: 1.6; 
                color: ${textColor}; 
                background-color: transparent;
                margin: 0;
                padding: 0;
              }
              h1, h2, h3 { color: ${textColor}; font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
              p { margin-bottom: 16px; }
              a { color: ${linkColor}; text-decoration: none; }
              img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
              blockquote { 
                border-left: 4px solid ${theme.colors.primary};
                padding-left: 16px;
                margin-left: 0;
                font-style: italic;
                color: ${theme.colors.onSurfaceVariant};
              }
              ul, ol { padding-left: 20px; }
              li { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div id="content-wrapper" style="padding: 1px 0;">
              ${article.content}
            </div>
            <script>
              function sendHeight() {
                const wrapper = document.getElementById('content-wrapper');
                if (wrapper) {
                  const height = Math.ceil(wrapper.getBoundingClientRect().height);
                  window.ReactNativeWebView.postMessage(height.toString());
                }
              }
              const resizeObserver = new ResizeObserver(sendHeight);
              if (document.getElementById('content-wrapper')) {
                resizeObserver.observe(document.getElementById('content-wrapper'));
              }
              // Multiple triggers to ensure height is correct after images/styles load
              window.onload = sendHeight;
              document.addEventListener('DOMContentLoaded', sendHeight);
              setTimeout(sendHeight, 500);
              setTimeout(sendHeight, 1500);
              setTimeout(sendHeight, 3000);
            </script>
          </body>
        </html>
      `;

      return (
        <WebView
          key={`${article.id}-${article.content?.length || 0}`}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{ height: webViewHeight, backgroundColor: 'transparent' }}
          scrollEnabled={false}
          onMessage={(event) => {
            const h = Number(event.nativeEvent.data);
            if (h > 0) setWebViewHeight(h);
          }}
          javaScriptEnabled={true}
          showsVerticalScrollIndicator={false}
          domStorageEnabled={true}
          mixedContentMode="always"
        />
      );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Cargando artículo...</Text>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
          <View style={{ flex: 1, paddingTop: insets.top }}>
              <View style={{ height: 56, justifyContent: 'center', paddingHorizontal: 4 }}>
                  <IconButton icon="chevron-left" onPress={() => navigation.goBack()} />
              </View>
              <DiscoverErrorView 
                  message={error || 'Artículo no encontrado'} 
                  onRetry={() => navigation.goBack()} 
              />
          </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Sticky Header Background (Fades In) */}
        <Animated.View style={[styles.headerBar, { 
            height: 56 + insets.top,
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outlineVariant
        }]} />

        {/* Reading Progress Bar (Attached to header) */}
        <Animated.View 
            style={[
                styles.progressContainer, 
                { 
                    top: 56 + insets.top,
                    opacity: headerOpacity.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0, 1]
                    })
                }
            ]}
        >
            <Animated.View 
                style={[
                    styles.progressBar, 
                    { 
                        backgroundColor: theme.colors.primary,
                        transform: [{
                            scaleX: scrollY.interpolate({
                                inputRange: [0, contentHeight > 0 ? contentHeight - windowHeight : 1],
                                outputRange: [0.0001, 1],
                                extrapolate: 'clamp',
                            })
                        }, {
                            translateX: scrollY.interpolate({
                                inputRange: [0, contentHeight > 0 ? contentHeight - windowHeight : 1],
                                outputRange: [-windowWidth / 2, 0],
                                extrapolate: 'clamp',
                            })
                        }]
                    }
                ]} 
            />
        </Animated.View>

        {/* Header Content (Title fades in, Buttons always visible) */}
        <View style={[styles.headerOverlay, { top: insets.top, height: 64 }]}>
            
            {/* Left Button - High Clarity */}
            <View style={styles.leftButtonContainer}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={[styles.headerIconButton, { backgroundColor: theme.colors.surface + 'CC' }]}
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
                </TouchableOpacity>
            </View>

            {/* Centered Title & Reading Indicator (Fades In) */}
            <Animated.View style={[
                styles.titleContainer, 
                { 
                    opacity: headerOpacity, 
                    width: headerContentWidth,
                    transform: [{
                        translateY: headerOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0]
                        })
                    }]
                }
            ]}>
                <Text 
                    variant="titleSmall" 
                    numberOfLines={1} 
                    style={{
                        fontWeight: '700',
                        color: theme.colors.onSurface,
                        textAlign: 'center',
                    }}
                >
                    {article.title}
                </Text>
            </Animated.View>

            {/* Right Buttons - Minimalist Editorial */}
            <View style={styles.rightButtonsContainer}>
                <TouchableOpacity 
                    onPress={handleShare}
                    activeOpacity={0.7}
                    style={[styles.headerIconButton, { backgroundColor: theme.colors.surface + 'CC' }]}
                >
                    <MaterialCommunityIcons name="share-variant-outline" size={22} color={theme.colors.onSurface} />
                </TouchableOpacity>
            </View>
        </View>

        <Animated.ScrollView 
            showsVerticalScrollIndicator={false}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
        >
            {/* Hero Image with Theme-Aware Gradient */}
            {article.image ? (
              <View style={styles.heroContainer}>
                  <Image source={{ uri: article.image }} style={styles.heroImage} />
                  <LinearGradient 
                      colors={[
                        'transparent', 
                        theme.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
                        theme.colors.background
                      ]} 
                      style={styles.heroGradient}
                  />
              </View>
            ) : (
              <View style={[styles.heroContainer, { backgroundColor: theme.colors.surfaceVariant, height: 280 }]}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <MaterialCommunityIcons 
                      name="newspaper-variant-outline" 
                      size={64} 
                      color={theme.colors.onSurfaceVariant}
                      style={{ opacity: 0.3 }}
                    />
                  </View>
              </View>
            )}

            <View style={styles.contentContainer}>
                {/* Category Badges - Multi-support */}
                {article.categories && article.categories.length > 0 && (
                  <View style={styles.categoriesRow}>
                    {article.categories.map((cat: any, idx: number) => (
                      <Chip 
                        key={idx}
                        style={[styles.categoryBadge, { backgroundColor: theme.colors.primaryContainer, marginRight: 8 }]} 
                        textStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 }}
                        compact
                        onPress={() => navigation.navigate('CategoryDetail', { category: cat, slug: cat.slug })}
                      >
                        {cat.name.toUpperCase()}
                      </Chip>
                    ))}
                  </View>
                )}
                
                {/* Title */}
                <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {article.title}
                </Text>
                
                {/* Compact Author Metadata - Single Line */}
                <View style={styles.compactMetadata}>
                  {article.author ? (
                    <Avatar.Image size={40} source={{ uri: article.author.avatar }} />
                  ) : (
                    <Avatar.Text size={40} label={article.source[0]} />
                  )}
                  
                  <View style={styles.metadataText}>
                    <View style={styles.metadataRow}>
                      <Text variant="labelLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                        {article.author?.name || article.source}
                      </Text>
                      {article.author?.role && article.author.role.length < 50 && (
                        <>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 6 }}>•</Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                            {article.author.role}
                          </Text>
                        </>
                      )}
                    </View>
                    <View style={styles.metadataRow}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
                      <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                        {article.time}
                      </Text>
                      {article.modifiedTime && article.modifiedTime !== article.time && (
                        <>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 6 }}>•</Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                            Actualizado {article.modifiedTime}
                          </Text>
                        </>
                      )}
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 6 }}>•</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                        {article.readTime}
                      </Text>
                      {article.wordCount && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6, fontSize: 10 }}>
                          ({article.wordCount} palabras)
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                {/* Summary / Lead Paragraph Section */}
                {article.seoDescription && (
                    <View style={[styles.summaryBox, { marginTop: 16, backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]}>
                        <View style={[styles.summaryLabel, { backgroundColor: theme.colors.primary }]}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>EN RESUMEN</Text>
                        </View>
                        <Text variant="bodyMedium" style={[styles.summaryText, { color: theme.colors.onSurfaceVariant }]}>
                            {article.seoDescription}
                        </Text>
                    </View>
                )}

                {/* Content Body: Support both Legacy Blocks and HTML (WP) */}
                <View style={styles.articleBody}>
                    {typeof article.content === 'string' ? (
                        renderHtmlContent()
                    ) : (
                        article.content.map((block: any, idx: number) => renderBlock(block, idx))
                    )}
                </View>

                {/* SEO/Tags */}
                {article.tags && article.tags.length > 0 && (
                    <>
                        <Text variant="titleSmall" style={{ marginBottom: 12, fontWeight: 'bold', color: theme.colors.onSurface }}>Etiquetas</Text>
                        <View style={styles.tagsContainer}>
                            {article.tags.map((tag: any, idx: number) => (
                                <Chip 
                                    key={idx} 
                                    style={styles.tagChip} 
                                    textStyle={{ fontSize: 12 }} 
                                    mode="outlined"
                                    onPress={() => navigation.navigate('TagDetail', { tag, slug: tag.slug })}
                                >
                                    {tag.name}
                                </Chip>
                            ))}
                        </View>
                    </>
                )}

                {/* Author Section */}
                {article.author && <AuthorCard author={article.author} />}

                <Divider style={{ marginVertical: 32, backgroundColor: theme.colors.outlineVariant }} />

                {/* Recommended Articles Section */}
                <View style={styles.recommendedSection}>
                    <View style={styles.sectionHeader}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Relacionados</Text>
                        <Button mode="text" onPress={() => navigation.navigate('CategoryDetail', { category: article.categories[0], slug: article.categories[0].slug })}>
                            Ver más
                        </Button>
                    </View>
                    
                    {loadingRelated ? (
                        <ActivityIndicator style={{ marginVertical: 40 }} color={theme.colors.primary} />
                    ) : relatedPosts.length > 0 ? (
                        <View style={styles.relatedGrid}>
                            {relatedPosts.map((related) => (
                                <ArticleCard 
                                    key={related.id} 
                                    article={related} 
                                    onPress={() => navigation.push('ArticleDetail', { article: related })}
                                />
                            ))}
                        </View>
                    ) : (
                        <Text style={{ textAlign: 'center', marginVertical: 40, opacity: 0.5 }}>No hay recomendaciones en este momento</Text>
                    )}
                </View>

                <Divider style={{ marginVertical: 32, backgroundColor: theme.colors.outlineVariant }} />

                {/* Comments Section - WordPress Integration */}
                {commentsEnabled && (
                  <>
                    <Divider style={{ marginVertical: 32, backgroundColor: theme.colors.outlineVariant }} />
                    
                    <View style={styles.commentsSection}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onSurface }}>
                        Comentarios ({comments.length})
                      </Text>
                      
                      <CommentsList comments={comments} loading={commentsLoading} />
                    </View>
                  </>
                )}

            </View>
        </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 10,
  },
  headerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      pointerEvents: 'box-none',
  },
  headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
  },
  leftButtonContainer: {
      zIndex: 25,
  },
  rightButtonsContainer: {
      flexDirection: 'row',
      zIndex: 25,
      gap: 8,
  },
  titleContainer: {
      position: 'absolute',
      left: 60,
      right: 60,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 15,
      height: '100%',
      pointerEvents: 'none',
  },
  summaryBox: {
      padding: 20,
      paddingTop: 24,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
      position: 'relative',
  },
  summaryLabel: {
      position: 'absolute',
      top: -10,
      left: 16,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  summaryText: {
      lineHeight: 22,
      fontStyle: 'italic',
      fontWeight: '500',
  },
  heroContainer: {
      height: 350,
      width: '100%',
      position: 'relative',
  },
  heroImage: {
      width: '100%',
      height: '100%',
  },
  heroGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 180,
      justifyContent: 'flex-end',
      padding: 24,
      paddingBottom: 40,
  },
  categoryChip: {
      alignSelf: 'flex-start',
      backgroundColor: '#EF4444',
      height: 28,
  },
  contentContainer: {
      padding: 24,
      marginTop: -20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: 'transparent',
  },
  title: {
      fontWeight: '700',
      lineHeight: 40,
      marginTop: 8,
      marginBottom: 16,
      letterSpacing: -0.5,
  },
  categoryBadge: {
      alignSelf: 'flex-start',
      marginBottom: 5,
  },
  categoriesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
  },
  compactMetadata: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
  },
  metadataText: {
      marginLeft: 12,
      flex: 1,
  },
  metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
  },

  articleBody: {
      gap: 16,
  },
  paragraph: {
      lineHeight: 28,
      fontSize: 17,
      marginBottom: 12,
      opacity: 0.9,
  },
  heading: {
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
  },
  quoteContainer: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      marginVertical: 24,
      backgroundColor: 'rgba(0,0,0,0.03)',
      borderLeftWidth: 6,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
  },
  quoteIcon: {
      marginBottom: 12,
      opacity: 0.8,
  },
  quoteText: {
      fontStyle: 'italic',
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '700',
      letterSpacing: -0.5,
  },
  quoteAuthor: {
      marginTop: 16,
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'right',
      opacity: 0.8,
  },
  imageBlock: {
      marginVertical: 16,
  },
  contentImage: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      marginBottom: 8,
  },
  imageCaption: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
  },
  listBlock: {
      paddingLeft: 8,
      gap: 8,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 12,
  },
  listItemText: {
      fontSize: 16,
      lineHeight: 24,
  },
  tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 32,
  },
  tagChip: {
      height: 32,
  },
  authorCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 24,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorBio: {
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentsSection: {
      marginTop: 8,
  },
  commentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 12,
  },
  commentInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      paddingHorizontal: 16,
  },
  commentItem: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
  },
  commentContent: {
      flex: 1,
  },
  commentHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4,
  },
  recommendedSection: {
      marginTop: 8,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 0,
  },
  relatedGrid: {
      marginHorizontal: -20, // To compensate for ArticleCard margin
  },
  progressContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 1001,
  },
  progressBar: {
    height: '100%',
  },
});

export default ArticleDetailScreen;
