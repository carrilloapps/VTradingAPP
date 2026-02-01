import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import FastImage from 'react-native-fast-image';

import { FormattedPost } from '@/services/WordPressService';

interface ArticleCardProps {
  article: FormattedPost;
  onPress: () => void;
  variant?: 'compact' | 'featured';
}

const ArticleCard = React.memo(
  ({ article, onPress, variant = 'compact' }: ArticleCardProps) => {
    const theme = useTheme();
    // const scale = React.useRef(new Animated.Value(1)).current; // Removed for performance

    const isFeatured = variant === 'featured';
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, isFeatured, slideAnim]);

    // Simplified touch handling (removed redundant scale animation)
    const handlePressIn = () => {};
    const handlePressOut = () => {};

    const animatedContainerStyle = [
      styles.animatedContainer,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ];

    const touchableStyle = [
      styles.touchable,
      { borderRadius: theme.roundness * 5 },
      isFeatured ? styles.featuredTouchable : styles.compactTouchable,
    ];

    const surfaceStyle = [
      styles.container,
      isFeatured ? styles.featuredContainer : styles.compactContainer,
      {
        elevation: isFeatured ? 3 : 1,
        backgroundColor: theme.colors.surface,
      },
    ];

    const featuredImageStyle = [
      styles.featuredImage,
      { backgroundColor: theme.colors.surfaceVariant },
    ];

    const floatingCategoryStyle = [
      styles.floatingCategory,
      {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness * 1.5,
      },
    ];

    const floatingCategoryTextStyle = [
      styles.floatingCategoryText,
      { color: theme.colors.onPrimary },
    ];

    const categoryTextStyle = [
      styles.category,
      { color: theme.colors.primary },
    ];

    const timeTextStyle = [
      styles.time,
      { color: theme.colors.onSurfaceVariant },
    ];

    const badgeStyle = [
      styles.badge,
      {
        backgroundColor: article.isPromo
          ? theme.colors.primary
          : theme.colors.error,
        borderRadius: theme.roundness,
      },
    ];

    const badgeTextStyle = [
      styles.badgeText,
      {
        color: article.isPromo ? theme.colors.onPrimary : theme.colors.onError,
      },
    ];

    const titleStyle = [
      styles.title,
      { color: theme.colors.onSurface },
      isFeatured ? styles.featuredTitle : styles.compactTitle,
    ];

    const excerptStyle = [
      styles.excerpt,
      { color: theme.colors.onSurfaceVariant },
    ];

    const featuredTimeTextStyle = { color: theme.colors.onSurfaceVariant };

    const compactImageStyle = [
      styles.compactImage,
      { borderRadius: theme.roundness * 3 },
    ];

    return (
      <Animated.View style={animatedContainerStyle}>
        <TouchableRipple
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={touchableStyle}
          borderless
        >
          <Surface style={surfaceStyle} elevation={0}>
            {isFeatured && (
              <View style={styles.imageWrapper}>
                <FastImage
                  source={{ uri: article.image }}
                  style={featuredImageStyle}
                  resizeMode={FastImage.resizeMode.cover}
                />
                {article.categories && article.categories.length > 0 && (
                  <Surface style={floatingCategoryStyle} elevation={2}>
                    <Text style={floatingCategoryTextStyle}>
                      {article.categories[0].name.toUpperCase()}
                    </Text>
                  </Surface>
                )}
              </View>
            )}

            <View
              style={[
                styles.content,
                isFeatured ? styles.featuredContent : styles.compactContent,
              ]}
            >
              {!isFeatured && (
                <View style={styles.compactHeader}>
                  {article.categories && article.categories.length > 0 && (
                    <Text variant="labelSmall" style={categoryTextStyle}>
                      {article.categories[0].name.toUpperCase()}
                    </Text>
                  )}
                  <Text variant="bodySmall" style={timeTextStyle}>
                    {article.time}
                  </Text>
                </View>
              )}

              <View style={styles.titleContainer}>
                {(article.isTrending ||
                  article.tags?.some(t => t.slug === 'breaking') ||
                  article.isPromo) && (
                  <View style={badgeStyle}>
                    <Text style={badgeTextStyle}>
                      {article.tags?.some(t => t.slug === 'breaking')
                        ? 'BREAKING'
                        : article.isTrending
                          ? 'TRENDING'
                          : 'PROMO'}
                    </Text>
                  </View>
                )}
                <Text
                  variant={isFeatured ? 'headlineSmall' : 'titleMedium'}
                  style={titleStyle}
                  numberOfLines={isFeatured ? 3 : 2}
                >
                  {article.title}
                </Text>
              </View>

              {isFeatured && article.excerpt && (
                <Text
                  variant="bodyMedium"
                  style={excerptStyle}
                  numberOfLines={3}
                >
                  {article.excerpt.replace(/<[^>]*>?/gm, '').trim()}
                </Text>
              )}

              <View style={styles.footer}>
                <View style={styles.authorSection}>
                  {article.author?.avatar && (
                    <FastImage
                      source={{ uri: article.author.avatar }}
                      style={styles.authorAvatar}
                    />
                  )}
                  <Text variant="labelSmall" style={styles.authorText}>
                    {article.author?.name || article.source}
                  </Text>
                  <Text variant="labelSmall" style={styles.dotSeparator}>
                    •
                  </Text>
                  <Text variant="labelSmall" style={styles.readTimeText}>
                    {article.readTime}
                  </Text>
                </View>

                {isFeatured && (
                  <View style={styles.featuredTime}>
                    <Text variant="labelSmall" style={featuredTimeTextStyle}>
                      {article.time}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!isFeatured && (
              <FastImage
                source={{ uri: article.image }}
                style={compactImageStyle}
              />
            )}
          </Surface>
        </TouchableRipple>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  compactTouchable: {
    // Standard margin
  },
  featuredTouchable: {
    marginBottom: 32,
  },
  container: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  compactContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  featuredContainer: {
    flexDirection: 'column',
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  compactImage: {
    width: 85,
    height: 85,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  compactContent: {
    justifyContent: 'center',
  },
  featuredContent: {
    padding: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  time: {
    fontSize: 11,
  },
  title: {
    fontWeight: 'bold',
    lineHeight: 22,
  },
  compactTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  featuredTitle: {
    marginBottom: 10,
  },
  excerpt: {
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: -8,
  },
  miniAction: {
    margin: 0,
  },
  titleContainer: {
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  floatingCategory: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  floatingCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredTime: {
    justifyContent: 'center',
  },
  animatedContainer: {
    width: '100%',
  },
  authorText: {
    fontWeight: '700',
  },
  dotSeparator: {
    marginHorizontal: 4,
  },
  readTimeText: {},
});

export default ArticleCard;
