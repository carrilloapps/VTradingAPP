import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions, Animated } from 'react-native';
import { Text, Surface, TouchableRipple, useTheme, IconButton } from 'react-native-paper';
import { FormattedPost } from '../../services/WordPressService';

interface ArticleCardProps {
    article: FormattedPost;
    onPress: () => void;
    variant?: 'compact' | 'featured';
}

const ArticleCard = React.memo(({ article, onPress, variant = 'compact' }: ArticleCardProps) => {
    const theme = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const scale = React.useRef(new Animated.Value(1)).current;

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
    }, []);

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [
                { scale },
                { translateY: slideAnim }
            ]
        }}>
            <TouchableRipple
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.touchable,
                    { borderRadius: theme.roundness * 4 },
                    isFeatured ? styles.featuredTouchable : styles.compactTouchable
                ]}
                borderless
            >
                <Surface style={[
                    styles.container,
                    isFeatured ? styles.featuredContainer : styles.compactContainer,
                    {
                        elevation: isFeatured ? 2 : 0,
                        borderRadius: theme.roundness * 4,
                    }
                ]} elevation={0}>

                    {isFeatured && (
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: article.image }}
                                style={[styles.featuredImage, { backgroundColor: theme.colors.surfaceVariant }]}
                                resizeMode="cover"
                            />
                            {article.categories && article.categories.length > 0 && (
                                <Surface style={[
                                    styles.floatingCategory,
                                    {
                                        backgroundColor: theme.colors.primary,
                                        borderRadius: theme.roundness * 1.5
                                    }
                                ]} elevation={2}>
                                    <Text style={[styles.floatingCategoryText, { color: theme.colors.onPrimary }]}>
                                        {article.categories[0].name.toUpperCase()}
                                    </Text>
                                </Surface>
                            )}
                        </View>
                    )}

                    <View style={[styles.content, isFeatured ? styles.featuredContent : styles.compactContent]}>
                        {!isFeatured && (
                            <View style={styles.compactHeader}>
                                {article.categories && article.categories.length > 0 && (
                                    <Text variant="labelSmall" style={[styles.category, { color: theme.colors.primary }]}>
                                        {article.categories[0].name.toUpperCase()}
                                    </Text>
                                )}
                                <Text variant="bodySmall" style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>{article.time}</Text>
                            </View>
                        )}

                        <View style={styles.titleContainer}>
                            {(article.isTrending ||
                                article.tags?.some(t => t.slug === 'breaking') ||
                                article.isPromo) && (
                                    <View style={[
                                        styles.badge,
                                        {
                                            backgroundColor: article.isPromo
                                                ? theme.colors.primary
                                                : theme.colors.error,
                                            borderRadius: theme.roundness
                                        }
                                    ]}>
                                        <Text style={[styles.badgeText, { color: article.isPromo ? theme.colors.onPrimary : theme.colors.onError }]}>
                                            {article.tags?.some(t => t.slug === 'breaking') ? 'BREAKING' :
                                                article.isTrending ? 'TRENDING' : 'PROMO'}
                                        </Text>
                                    </View>
                                )}
                            <Text
                                variant={isFeatured ? "headlineSmall" : "titleMedium"}
                                style={[
                                    styles.title,
                                    { color: theme.colors.onSurface },
                                    isFeatured ? styles.featuredTitle : styles.compactTitle
                                ]}
                                numberOfLines={isFeatured ? 3 : 2}
                            >
                                {article.title}
                            </Text>
                        </View>

                        {isFeatured && article.excerpt && (
                            <Text
                                variant="bodyMedium"
                                style={[styles.excerpt, { color: theme.colors.onSurfaceVariant }]}
                                numberOfLines={3}
                            >
                                {article.excerpt.replace(/<[^>]*>?/gm, '').trim()}
                            </Text>
                        )}

                        <View style={styles.footer}>
                            <View style={styles.authorSection}>
                                {article.author?.avatar && (
                                    <Image source={{ uri: article.author.avatar }} style={styles.authorAvatar} />
                                )}
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
                                    {article.author?.name || article.source}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 4 }}>•</Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {article.readTime}
                                </Text>
                            </View>

                            {isFeatured && (
                                <View style={styles.featuredTime}>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{article.time}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {!isFeatured && (
                        <Image source={{ uri: article.image }} style={[styles.compactImage, { borderRadius: theme.roundness * 2 }]} />
                    )}
                </Surface>
            </TouchableRipple>
        </Animated.View>
    );
});

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
});

export default ArticleCard;
