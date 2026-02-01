import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Text, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';

import { FormattedPost } from '@/services/WordPressService';
import SafeLogger from '@/utils/safeLogger';

interface FeaturedCarouselProps {
  items: FormattedPost[];
}

const FeaturedCarousel = ({ items }: FeaturedCarouselProps) => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlashListRef<FormattedPost>>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Immersive height (approx 45% of screen or min 400)
  const CAROUSEL_HEIGHT = Math.max(height * 0.45, 400);

  // Auto-scroll
  useEffect(() => {
    if (items.length <= 1 || !isAutoScrolling) return;

    const interval = setInterval(() => {
      if (!flatListRef.current) return;

      const nextIndex = (currentIndex + 1) % items.length;
      try {
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      } catch (e) {
        SafeLogger.error('CalculatorEngine.memoryAdd error', e);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex, items.length, isAutoScrolling]);

  const handleScrollBegin = () => setIsAutoScrolling(false);
  const handleScrollEnd = () => setIsAutoScrolling(true);

  const renderItem = ({ item }: { item: FormattedPost }) => {
    const rippleStyle = [
      styles.ripple,
      { width, height: CAROUSEL_HEIGHT }, // Optimized: width/height inline
    ];

    // Memoized static styles could help but inline is fine for this complexity

    return (
      <TouchableRipple
        onPress={() => navigation.navigate('ArticleDetail', { article: item })}
        style={rippleStyle}
        borderless
        accessibilityLabel={`Artículo destacado: ${item.title}. Autor: ${item.author?.name || 'VTrading'}`}
        accessibilityRole="button"
      >
        <View style={styles.slide}>
          <FastImage
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={[
              'transparent',
              theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
              theme.colors.background,
            ]}
            locations={[0, 0.6, 1]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {item.categories && item.categories.length > 0 && (
                <Surface
                  style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                  elevation={2}
                >
                  <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
                    {item.categories[0].name.toUpperCase()}
                  </Text>
                </Surface>
              )}
              <Text
                variant="headlineMedium"
                style={[styles.title, { color: theme.colors.onBackground }]}
                numberOfLines={3}
              >
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.author?.name || 'VTrading'}
                </Text>
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.time}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableRipple>
    );
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Memoize active dot style to avoid inline style warning
  const activeDotStyle = React.useMemo(
    () => ({
      backgroundColor: theme.colors.primary,
      width: 24,
    }),
    [theme.colors.primary],
  );

  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <FlashList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={item => `featured-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      />
      {/* Pagination Lines */}
      <View
        style={styles.pagination}
        accessibilityRole="adjustable"
        accessibilityLabel={`Página ${currentIndex + 1} de ${items.length}`}
      >
        {items.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index}
              style={[styles.dot, isActive ? activeDotStyle : styles.inactiveDot]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ripple: {
    // dynamic dimensions applied inline
  },
  container: {
    marginBottom: 0,
  },
  slide: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  content: {
    gap: 8,
  },
  title: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 32,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  inactiveDot: {
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default FeaturedCarousel;
