import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, Image, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FormattedPost } from '../../services/WordPressService';

interface FeaturedCarouselProps {
    items: FormattedPost[];
}

const FeaturedCarousel = ({ items }: FeaturedCarouselProps) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const { width, height } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    
    // Immersive height (approx 45% of screen or min 400)
    const CAROUSEL_HEIGHT = Math.max(height * 0.45, 400);

    // Auto-scroll
    useEffect(() => {
        if (items.length <= 1) return;
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % items.length;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, 8000); 
        return () => clearInterval(interval);
    }, [currentIndex, items.length]);

    const renderItem = ({ item }: { item: FormattedPost }) => (
        <TouchableRipple 
            onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            style={{ width, height: CAROUSEL_HEIGHT }} 
            borderless
        >
            <View style={styles.slide}>
                <Image 
                    source={{ uri: item.image }} 
                    style={styles.image} 
                    resizeMode="cover" 
                />
                <LinearGradient 
                    colors={['transparent', theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)', theme.colors.background]} 
                    locations={[0, 0.6, 1]}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        {item.categories && item.categories.length > 0 && (
                            <Surface style={[styles.badge, { backgroundColor: theme.colors.primary }]} elevation={2}>
                                <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>{item.categories[0].name.toUpperCase()}</Text>
                            </Surface>
                        )}
                        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]} numberOfLines={3}>
                            {item.title}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>{item.author?.name || 'VTrading'}</Text>
                            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>•</Text>
                            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>{item.time}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </TouchableRipple>
    );

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    if (!items.length) return null;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => `featured-${item.id}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScroll}
                scrollEventThrottle={16}
                snapToInterval={width}
                decelerationRate="fast"
                bounces={false}
            />
            {/* Pagination Lines */}
            <View style={styles.pagination}>
                {items.map((_, index) => (
                    <View 
                        key={index}
                        style={[
                            styles.dot,
                            { 
                                backgroundColor: index === currentIndex ? theme.colors.primary : 'rgba(255,255,255,0.3)',
                                width: index === currentIndex ? 24 : 12
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default FeaturedCarousel;
