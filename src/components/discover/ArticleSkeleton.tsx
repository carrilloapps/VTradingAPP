import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';

interface ArticleSkeletonProps {
    variant?: 'compact' | 'featured';
}

const ArticleSkeleton = ({ variant = 'compact' }: ArticleSkeletonProps) => {
    const theme = useAppTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;
    const isFeatured = variant === 'featured';

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <View style={[styles.touchable, isFeatured && styles.featuredTouchable]}>
            <Surface 
                style={[
                    styles.container, 
                    isFeatured ? styles.featuredContainer : styles.compactContainer,
                    { 
                        backgroundColor: theme.colors.elevation.level1,
                        borderColor: theme.colors.outlineVariant,
                        borderWidth: 0.5,
                    }
                ]} 
                elevation={0}
            >
                {isFeatured && (
                    <Animated.View style={[styles.featuredImage, { opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                )}

                <View style={[styles.content, isFeatured ? styles.featuredContent : styles.compactContent]}>
                    <Animated.View style={[styles.skeletonLine, { width: '30%', height: 10, marginBottom: 12, opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                    <Animated.View style={[styles.skeletonLine, { width: '90%', height: 18, marginBottom: 8, opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                    <Animated.View style={[styles.skeletonLine, { width: '70%', height: 18, marginBottom: 16, opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                    
                    <View style={styles.footer}>
                        <View style={styles.authorSection}>
                            <Animated.View style={[styles.authorAvatar, { opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                            <Animated.View style={[styles.skeletonLine, { width: 60, height: 10, opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                        </View>
                        <Animated.View style={[styles.skeletonLine, { width: 40, height: 10, opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                    </View>
                </View>

                {!isFeatured && (
                    <Animated.View style={[styles.compactImage, { opacity, backgroundColor: theme.colors.surfaceDisabled }]} />
                )}
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    touchable: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    featuredTouchable: {
        marginBottom: 32,
    },
    container: {
        borderRadius: 16,
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
        borderRadius: 12,
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
    skeletonLine: {
        borderRadius: 4,
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
});

export default React.memo(ArticleSkeleton);
