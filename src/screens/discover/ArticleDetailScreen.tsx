import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Text, IconButton, Chip, Button, Divider, Avatar, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import FastImage from 'react-native-fast-image';

import CustomDialog from '@/components/ui/CustomDialog';
import CustomButton from '@/components/ui/CustomButton';
import ShareableDetail from '@/components/discover/ShareableDetail';
import { deepLinkService } from '@/services/DeepLinkService';
import { useToastStore } from '@/stores/toastStore';
import { useAppTheme } from '@/theme';
import { analyticsService, ANALYTICS_EVENTS } from '@/services/firebase/AnalyticsService';
import { wordPressService, FormattedComment, FormattedPost } from '@/services/WordPressService';
import { remoteConfigService } from '@/services/firebase/RemoteConfigService';
import { observabilityService } from '@/services/ObservabilityService';
import { CommentsList } from '@/components/discover/CommentsList';
import ArticleCard from '@/components/discover/ArticleCard';
import ArticleDetailSkeleton from '@/components/discover/ArticleDetailSkeleton';
import AuthorCard from '@/components/discover/AuthorCard';
import DiscoverErrorView from '@/components/discover/DiscoverErrorView';
import XIcon from '@/components/common/XIcon';
import FacebookIcon from '@/components/common/FacebookIcon';
import { shareTextContent } from '@/utils/ShareUtils';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import SafeLogger from '@/utils/safeLogger';

const BlockParagraph = ({ text, theme }: any) => {
  const paragraphStyle = [styles.paragraph, { color: theme.colors.onSurface }];
  return (
    <Text variant="bodyLarge" style={paragraphStyle}>
      {text}
    </Text>
  );
};

const BlockHeading = ({ text, theme }: any) => {
  const headingStyle = [styles.heading, { color: theme.colors.primary }];
  return (
    <Text variant="titleLarge" style={headingStyle}>
      {text}
    </Text>
  );
};

const BlockQuote = ({ text, author, theme }: any) => {
  const quoteContainerStyle = [
    styles.quoteContainer,
    {
      borderLeftColor: theme.colors.primary,
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: theme.roundness * 2,
    },
  ];
  const quoteTextStyle = [styles.quoteText, { color: theme.colors.onSurface }];
  const quoteAuthorStyle = [styles.quoteAuthor, { color: theme.colors.outline }];

  return (
    <View style={quoteContainerStyle}>
      <MaterialCommunityIcons
        name="format-quote-open"
        size={32}
        color={theme.colors.primary}
        style={styles.quoteIcon}
      />
      <Text style={quoteTextStyle}>{text}</Text>
      {author && (
        <Text variant="labelMedium" style={quoteAuthorStyle}>
          — {author}
        </Text>
      )}
    </View>
  );
};

const BlockImage = ({ url, caption, theme }: any) => {
  const contentImageStyle = [
    styles.contentImage,
    {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surfaceVariant,
    },
  ];
  const imageCaptionStyle = [styles.imageCaption, { color: theme.colors.outline }];

  return (
    <View style={styles.imageBlock}>
      <FastImage
        source={{ uri: url }}
        style={contentImageStyle}
        accessibilityRole="image"
        accessibilityLabel={caption || 'Imagen del artículo'}
      />
      {caption && (
        <Text variant="labelSmall" style={imageCaptionStyle}>
          {caption}
        </Text>
      )}
    </View>
  );
};

const BlockList = ({ items, theme }: any) => {
  const bulletStyle = [styles.bullet, { backgroundColor: theme.colors.primary }];
  const listItemTextStyle = [styles.listItemText, { color: theme.colors.onSurface }];

  return (
    <View style={styles.listBlock}>
      {items.map((item: string, index: number) => (
        <View key={index} style={styles.listItem}>
          <View style={bulletStyle} />
          <Text variant="bodyMedium" style={listItemTextStyle}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

const ArticleDetailScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [webViewHeight, setWebViewHeight] = React.useState(100);
  const [comments, setComments] = React.useState<FormattedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [commentsEnabled, setCommentsEnabled] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // New states for deep linking
  const [articleData, setArticleData] = React.useState<FormattedPost | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = React.useState<FormattedPost[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(false);
  const [contentHeight, setContentHeight] = React.useState(0);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Share Logic
  const viewShotRef = React.useRef<any>(null);
  const [isShareDialogVisible, setShareDialogVisible] = React.useState(false);
  const [shareFormat, setShareFormat] = React.useState<'1:1' | '16:9'>('1:1');
  const [_sharing, setSharing] = React.useState(false);
  const showToast = useToastStore(state => state.showToast);

  // Safe width calculation for header content
  // Logic to merge incoming params or fetched data
  // Logic to prioritize fetched data (full article) over incoming params (partial article)
  const params = route.params as { article?: FormattedPost; slug?: string; id?: string };
  const incomingArticle = articleData || params?.article;
  const slug = params?.slug;
  const articleId = params?.id;

  const article = incomingArticle
    ? {
        ...incomingArticle,
        author: {
          ...(incomingArticle?.author || {}),
        },
        // Use WordPress tags if available
        tags:
          incomingArticle?.tags?.map((tag: any) =>
            typeof tag === 'string' ? { name: tag } : tag,
          ) || [],
        // Use WordPress categories if available
        categories: incomingArticle?.categories || [],
        // Use Yoast SEO description if available
        seoDescription:
          (incomingArticle as any)?.yoastSEO?.description ||
          (incomingArticle as any)?.seoDescription ||
          '',
      }
    : null;

  // Effect to load article by slug if not provided
  React.useEffect(() => {
    const loadArticleAndRelated = async () => {
      let currentArticle = params?.article;

      // Clear previous article data to avoid flickering or stale content when navigating between posts
      setArticleData(null);
      setWebViewHeight(100);

      // Always fetch full article data to ensure we have the complete content,
      // as list views might only contain excerpts or truncated content.
      if (slug || articleId || currentArticle?.id) {
        setIsLoading(true); // Always show skeleton while fetching full data
        setError(null);
        try {
          const fetchedArticle = slug
            ? await wordPressService.getPostBySlug(slug)
            : await wordPressService.getPostById(Number(articleId || currentArticle?.id), true); // Force bypass cache for detail

          if (fetchedArticle) {
            setArticleData(fetchedArticle);
            currentArticle = fetchedArticle;
          } else if (!currentArticle) {
            setError('Artículo no encontrado');
          }
        } catch (e) {
          observabilityService.captureError(e, {
            context: 'ArticleDetailScreen.loadArticle',
            slug,
            id: currentArticle?.id,
          });
          if (!currentArticle) setError('Error al cargar el artículo');
        } finally {
          setIsLoading(false);
        }
      }

      // Fetch related posts if we have an article
      if (currentArticle?.id && currentArticle?.categories?.[0]?.id) {
        setLoadingRelated(true);
        try {
          // Enrich author data if it was slim (social might be missing in embed)
          if (currentArticle.author?.id) {
            wordPressService.getUserById(currentArticle.author.id).then(fullAuthor => {
              if (fullAuthor) {
                setArticleData((prev: any) => {
                  const base = prev || params?.article;
                  if (!base) return null;
                  return { ...base, author: fullAuthor };
                });
              }
            });
          }

          const fetchedRelated = await wordPressService.getRelatedPosts(
            Number(currentArticle.id),
            currentArticle.categories[0].id,
          );
          setRelatedPosts(fetchedRelated);
        } catch (e) {
          SafeLogger.error('Error fetching related posts:', e);
        } finally {
          setLoadingRelated(false);
        }
      }
    };
    loadArticleAndRelated();
  }, [slug, params?.article?.id, params?.article]); // Depend on id to refetch if switching articles via related section

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
      } catch (e) {
        observabilityService.captureError(e, {
          context: 'ArticleDetailScreen.loadCommentsFeature',
        });
        setCommentsLoading(false);
      }
    };

    loadCommentsFeature();
  }, [article?.id]);

  if (isLoading || !article) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ArticleDetailSkeleton />
      </View>
    );
  }

  if (error) {
    return <DiscoverErrorView message={error} onRetry={() => setArticleData(null)} />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (commentsEnabled && article?.id) {
        // Force bypass cache to get fresh comments
        const fetchedComments = await wordPressService.getComments(
          Number(article.id),
          1,
          100,
          true,
        );
        setComments(fetchedComments);
      }
    } catch (e) {
      observabilityService.captureError(e, {
        context: 'ArticleDetailScreen.handleRefresh',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced Share with Deep Links
  const handleShareButton = () => {
    setShareDialogVisible(true);
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

        if (!uri) throw new Error('URI generation failed');

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        // Generate deep link for context
        // Use slug if available, otherwise fallback to ID.
        // Format centralized in DeepLinkService
        const articleSlug = article.slug || article.id || 'unknown';
        const webLink = deepLinkService.getArticleLink(articleSlug);

        // Feature Flag: Toggle sharing exact deep link vs generic promo
        // Controlled by 'discover_web' remote config
        let shareExactDeepLink = true;
        try {
          shareExactDeepLink = await remoteConfigService.getFeature('discover_web');
        } catch (e) {
          SafeLogger.warn('ArticleDetailScreen: Remote config fetch failed', e);
          shareExactDeepLink = false;
        }

        const shareMessage = shareExactDeepLink
          ? `📰 ${article.title}\n\n${article.excerpt}\n\n🔗 ${webLink}`
          : `📰 ${article.title}\n\n${article.excerpt}\n\n🚀 ¡Domina los mercados con VTrading!\n📲 Noticias, análisis y señales en tiempo real.\n\n👇 Descárgala GRATIS aquí:\nhttps://vtrading.app`;

        await Share.open({
          url: sharePath,
          title: article.title,
          message: shareMessage, // Adding text for some platforms
          type: 'image/jpeg',
        });

        analyticsService.logShare(
          'article_detail',
          article.id.toString() || 'unknown',
          format === '1:1' ? 'image_square' : 'image_story',
        );
      } catch (e: any) {
        if (e.message !== 'User did not share' && e.message !== 'CANCELLED') {
          observabilityService.captureError(e, {
            context: 'ArticleDetailScreen.shareImage',
          });
          showToast('Error al compartir imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    const success = await shareTextContent({
      title: article.title,
      excerpt: article.excerpt,
      url: `https://discover.vtrading.app/article/${article.id || article.slug}`,
      type: 'ARTICLE',
      author: article.author?.name,
    });

    if (success) {
      analyticsService.logEvent(ANALYTICS_EVENTS.ARTICLE_SHARED, {
        article_id: article.id || 'unknown',
        method: 'text',
      });
    }
  };

  interface ContentBlock {
    type: string;
    text?: string;
    author?: string;
    url?: string;
    caption?: string;
    items?: any[];
  }

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return <BlockParagraph key={index} text={block.text} theme={theme} />;
      case 'heading':
        return <BlockHeading key={index} text={block.text} theme={theme} />;
      case 'quote':
        return <BlockQuote key={index} text={block.text} author={block.author} theme={theme} />;
      case 'image':
        return <BlockImage key={index} url={block.url} caption={block.caption} theme={theme} />;
      case 'list':
        return <BlockList key={index} items={block.items} theme={theme} />;
      default:
        return null;
    }
  };

  /*
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  */

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
                font-size: 17px;
                line-height: 1.6;
                color: ${textColor};
                background-color: transparent;
                margin: 0;
                padding: 0;
              }
              h1, h2, h3 { color: ${textColor}; font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
              p { margin-bottom: 16px; font-size: 17px; }
              a { color: ${linkColor}; text-decoration: none; font-weight: 600; }
              img { max-width: 100%; height: auto; border-radius: ${theme.roundness * 3}px; margin: 16px 0; background-color: ${theme.colors.surfaceVariant}; }
              blockquote {
                border-left: 4px solid ${theme.colors.primary};
                padding: 4px 0 4px 16px;
                margin: 20px 0;
                font-style: italic;
                color: ${theme.colors.onSurfaceVariant};
                background-color: ${theme.colors.elevation.level1};
                border-radius: ${theme.roundness}px;
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

    const webViewStyle = [styles.webView, { height: webViewHeight }];

    return (
      <WebView
        key={`${article.id}-${article.content?.length || 0}`}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={webViewStyle}
        scrollEnabled={false}
        onMessage={event => {
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
    return <ArticleDetailSkeleton />;
  }

  if (error || !article) {
    const errorContainerStyle = [styles.container, { backgroundColor: theme.colors.background }];
    const errorSubContainerStyle = { flex: 1, paddingTop: insets.top };
    const errorHeaderStyle = {
      height: 56,
      justifyContent: 'center' as const,
      paddingHorizontal: 4,
    };

    return (
      <View style={errorContainerStyle}>
        <StatusBar
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <View style={errorSubContainerStyle}>
          <View style={errorHeaderStyle}>
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

  const mainContainerStyle = [styles.container, { backgroundColor: theme.colors.background }];
  const scrollViewContentStyle = { paddingBottom: insets.bottom + 40 };

  const heroPlaceholderStyle = [
    styles.heroContainer,
    { backgroundColor: theme.colors.surfaceVariant, height: 280 },
  ];
  const heroPlaceholderIconSubStyle = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  };
  const heroPlaceholderIconStyle = { opacity: 0.3 };

  const promoBadgeStyle = [styles.promoBadge, { backgroundColor: theme.colors.warning }];
  const trendingBadgeStyle = [
    styles.promoBadge,
    { backgroundColor: theme.colors.onPrimaryContainer },
  ];
  const badgeIconStyle = { marginRight: 4 };
  const badgeTextStyle = [styles.promoText, { color: theme.colors.onPrimary }];

  return (
    <View style={mainContainerStyle}>
      <DiscoverHeader
        variant="detail"
        onBackPress={() => navigation.goBack()}
        onSharePress={handleShareButton}
        title={article.title}
        scrollY={scrollY}
        contentHeight={contentHeight}
      />

      {/* Reading Progress Bar (Attached to header) */}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={scrollViewContentStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.elevation.level3}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Hero Image with Theme-Aware Gradient */}
        {article.image ? (
          <View style={styles.heroContainer}>
            <FastImage source={{ uri: article.image }} style={styles.heroImage} />
            <LinearGradient
              colors={[
                'transparent',
                theme.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
                theme.colors.background,
              ]}
              style={styles.heroGradient}
            />
            {article.isPromo ? (
              <Surface style={promoBadgeStyle} elevation={4}>
                <MaterialCommunityIcons
                  name="bullhorn-variant-outline"
                  size={12}
                  color={theme.colors.onPrimary}
                  style={badgeIconStyle}
                />
                <Text style={badgeTextStyle}>PROMO</Text>
              </Surface>
            ) : article.isTrending ? (
              <Surface style={trendingBadgeStyle} elevation={4}>
                <MaterialCommunityIcons
                  name="star"
                  size={12}
                  color={theme.colors.onPrimary}
                  style={badgeIconStyle}
                />
                <Text style={badgeTextStyle}>TRENDING</Text>
              </Surface>
            ) : null}
          </View>
        ) : (
          <View style={heroPlaceholderStyle}>
            <View style={heroPlaceholderIconSubStyle}>
              <MaterialCommunityIcons
                name="newspaper-variant-outline"
                size={64}
                color={theme.colors.onSurfaceVariant}
                style={heroPlaceholderIconStyle}
              />
            </View>
            {article.isPromo ? (
              <Surface style={promoBadgeStyle} elevation={4}>
                <MaterialCommunityIcons
                  name="bullhorn-variant-outline"
                  size={12}
                  color={theme.colors.onPrimary}
                  style={badgeIconStyle}
                />
                <Text style={badgeTextStyle}>PROMO</Text>
              </Surface>
            ) : article.isTrending ? (
              <Surface style={trendingBadgeStyle} elevation={4}>
                <MaterialCommunityIcons
                  name="star"
                  size={12}
                  color={theme.colors.onPrimary}
                  style={badgeIconStyle}
                />
                <Text style={badgeTextStyle}>TRENDING</Text>
              </Surface>
            ) : null}
          </View>
        )}

        <View style={styles.contentContainer}>
          {/* Category Badges - Multi-support */}
          {article.categories && article.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {article.categories.map((cat: any, idx: number) => {
                const categoryChipStyle = [
                  styles.categoryBadge,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    marginRight: 8,
                    borderRadius: theme.roundness * 2,
                  },
                ];
                const categoryChipTextStyle = {
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: '700' as const,
                  fontSize: 10,
                  letterSpacing: 0.5,
                };

                return (
                  <Chip
                    key={idx}
                    style={categoryChipStyle}
                    textStyle={categoryChipTextStyle}
                    compact
                    onPress={() =>
                      navigation.navigate('CategoryDetail', {
                        category: cat,
                        slug: cat.slug,
                      })
                    }
                  >
                    {cat.name.toUpperCase()}
                  </Chip>
                );
              })}
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
                <Text
                  variant="labelLarge"
                  style={{
                    fontWeight: '600' as const,
                    color: theme.colors.onSurface,
                  }}
                >
                  {article.author?.name || article.source}
                </Text>
                {article.author?.role && article.author.role.length < 50 && (
                  <>
                    <Text
                      variant="bodySmall"
                      style={[styles.metadataSeparator, { color: theme.colors.onSurfaceVariant }]}
                    >
                      •
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                      numberOfLines={1}
                    >
                      {article.author.role}
                    </Text>
                  </>
                )}
                {article.author?.social && (
                  <View style={styles.socialRow}>
                    {article.author.social.twitter && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.twitter!)}
                      >
                        <XIcon size={16} color={theme.colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    )}
                    {article.author.social.facebook && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.facebook!)}
                      >
                        <FacebookIcon size={16} color={theme.colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    )}
                    {article.author.social.instagram && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.instagram!)}
                      >
                        <MaterialCommunityIcons
                          name="instagram"
                          size={16}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    )}
                    {article.author.social.youtube && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.youtube!)}
                      >
                        <MaterialCommunityIcons
                          name="youtube"
                          size={16}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    )}
                    {article.author.social.linkedin && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.linkedin!)}
                      >
                        <MaterialCommunityIcons
                          name="linkedin"
                          size={16}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    )}
                    {article.author.social.tiktok && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(article.author!.social!.tiktok!)}
                      >
                        <MaterialCommunityIcons
                          name="music-note"
                          size={16}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {article.isEdited && article.modifiedTime && (
                  <>
                    <Text
                      variant="bodySmall"
                      style={[styles.separator, { color: theme.colors.onSurfaceVariant }]}
                    >
                      •
                    </Text>
                    <View style={styles.metadataItem}>
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={14}
                        color={theme.colors.onSurfaceVariant}
                        style={styles.metadataIconOpacity}
                      />
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.metadataTextMarginOpacity,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {article.modifiedTime}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              <View style={styles.metadataRow}>
                <View style={styles.metadataItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.metadataTextMargin, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {article.time}
                  </Text>
                </View>

                <Text
                  variant="bodySmall"
                  style={[styles.separator, { color: theme.colors.onSurfaceVariant }]}
                >
                  •
                </Text>

                <View style={styles.metadataItem}>
                  <Text
                    variant="bodySmall"
                    style={[styles.readTimeText, { color: theme.colors.primary }]}
                  >
                    {article.readTime}
                  </Text>
                  {article.wordCount && (
                    <Text
                      variant="bodySmall"
                      style={[styles.wordCountText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      ({article.wordCount} palabras)
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Content Body: Support both Legacy Blocks and HTML (WP) */}
          <View style={styles.articleBody}>
            {typeof article.content === 'string'
              ? renderHtmlContent()
              : article.content
                ? (article.content as ContentBlock[]).map((block: ContentBlock, idx: number) =>
                    renderBlock(block, idx),
                  )
                : null}
          </View>

          {/* SEO/Tags */}
          {article.tags && article.tags.length > 0 && (
            <>
              <Text
                variant="titleSmall"
                style={[styles.tagTitle, { color: theme.colors.onSurface }]}
              >
                Etiquetas
              </Text>
              <View style={styles.tagsContainer}>
                {article.tags.map((tag: any, idx: number) => (
                  <Chip
                    key={idx}
                    style={[styles.tagChip, { borderRadius: theme.roundness * 2 }]}
                    textStyle={styles.tagChipText}
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

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Recommended Articles Section */}
          <View style={styles.recommendedSection}>
            <View style={styles.sectionHeader}>
              <Text
                variant="titleLarge"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Relacionados
              </Text>
              <Button
                mode="text"
                onPress={() =>
                  navigation.navigate('CategoryDetail', {
                    category: article.categories[0],
                    slug: article.categories[0].slug,
                  })
                }
              >
                Ver más
              </Button>
            </View>

            {loadingRelated ? (
              <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
            ) : relatedPosts.length > 0 ? (
              <View style={styles.relatedGrid}>
                {relatedPosts.map(related => (
                  <ArticleCard
                    key={related.id}
                    article={related}
                    onPress={() => navigation.push('ArticleDetail', { article: related })}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay recomendaciones en este momento</Text>
            )}
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Comments Section - WordPress Integration */}
          {commentsEnabled && (
            <>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

              <View style={styles.commentsSection}>
                <Text
                  variant="titleMedium"
                  style={[styles.commentsTitle, { color: theme.colors.onSurface }]}
                >
                  Comentarios ({comments.length})
                </Text>

                <CommentsList comments={comments} loading={commentsLoading} />
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>
      <ShareableDetail
        viewShotRef={viewShotRef}
        title={article?.title || 'Artículo'}
        type="ARTICLE"
        image={article?.image}
        description={
          article?.content
            ? article.content
                .replace(/<[^>]*>/g, '')
                .replace(/\n+/g, ' ')
                .slice(0, 400) + '...'
            : ''
        }
        author={
          article.author
            ? {
                name: article.author.name || '',
                avatar: article.author.avatar || '',
                role: article.date
                  ? new Date(article.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : article.time || '',
                socials: article.author.social as any,
              }
            : undefined
        }
        categoryName={
          article?.categories && article.categories.length > 0
            ? article.categories[0].name
            : 'Artículo'
        }
        aspectRatio={shareFormat}
        items={[
          // Hero Item (Current Article)
          {
            title: article?.title || 'Artículo',
            image: article?.image,
            date: article?.date ? new Date(article.date).toLocaleDateString() : article?.time || '',
            author: article?.author?.name || 'VTrading',
          },
          // Related Items (List)
          ...relatedPosts.slice(0, shareFormat === '16:9' ? 4 : 2).map(p => ({
            title: p.title.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
            image: p.image,
            date: new Date(p.date).toLocaleDateString(),
            author: p.author?.name || 'VTrading',
          })),
        ]}
      />

      {/* Standard Dialog for Sharing Options */}
      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir artículo"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text
          variant="bodyMedium"
          style={[styles.dialogDescription, { color: theme.colors.onSurfaceVariant }]}
        >
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
  loadingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  summaryBox: {
    padding: 20,
    paddingTop: 24,
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
  },
  summaryText: {
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  contentContainer: {
    padding: 24,
    marginTop: -20,
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
  promoBadge: {
    position: 'absolute',
    top: 110,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 5,
  },
  promoText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
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
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: 4,
    opacity: 0.5,
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
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  shareOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    flex: 1,
  },
  webViewWrapper: {
    width: '100%',
    height: 400,
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 40,
    opacity: 0.5,
  },
  divider: {
    marginVertical: 32,
  },
  tagTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  tagChipText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  commentsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dialogDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogActions: {
    gap: 12,
  },
  metadataSeparator: {
    marginHorizontal: 6,
  },
  metadataIconOpacity: {
    opacity: 0.7,
  },
  metadataTextMarginOpacity: {
    marginLeft: 4,
    opacity: 0.8,
  },
  metadataTextMargin: {
    marginLeft: 4,
  },
  readTimeText: {
    fontWeight: '700' as const,
  },
  wordCountText: {
    marginLeft: 6,
    fontSize: 10,
  },
  summaryLabelText: {
    fontWeight: 'bold' as const,
    color: '#FFFFFF', // Guaranteed contrast
  },
});

export default ArticleDetailScreen;
