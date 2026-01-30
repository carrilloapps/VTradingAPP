import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';

interface ArticleSkeletonProps {
    variant?: 'compact' | 'featured';
}

const ArticleSkeleton = ({ variant = 'compact' }: ArticleSkeletonProps) => {
    const theme = useAppTheme();
    const isFeatured = variant === 'featured';

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
                    <Skeleton width="100%" height={200} borderRadius={0} />
                )}

                <View style={[styles.content, isFeatured ? styles.featuredContent : styles.compactContent]}>
                    <Skeleton width="30%" height={10} style={{ marginBottom: 12 }} />
                    <Skeleton width="90%" height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width="70%" height={18} style={{ marginBottom: 16 }} />
                    
                    <View style={styles.footer}>
                        <View style={styles.authorSection}>
                            <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
                            <Skeleton width={60} height={10} />
                        </View>
                        <Skeleton width={40} height={10} />
                    </View>
                </View>

                {!isFeatured && (
                    <View style={styles.compactImage}>
                        <Skeleton width={85} height={85} borderRadius={12} />
                    </View>
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
    compactImage: {
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
});

export default React.memo(ArticleSkeleton);
