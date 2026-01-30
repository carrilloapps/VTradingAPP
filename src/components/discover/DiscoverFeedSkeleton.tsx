import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';
import ArticleSkeleton from './ArticleSkeleton';

const DiscoverFeedSkeleton = () => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();

    const containerStyle = [
        styles.container,
        { backgroundColor: theme.colors.background }
    ];

    const headerStyle = [
        styles.header,
        { paddingTop: insets.top + 12 }
    ];

    return (
        <View style={containerStyle}>
            {/* Header placeholder */}
            <View style={headerStyle}>
                <Skeleton width={180} height={32} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Categories Grid placeholder */}
                <View style={styles.categoriesGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Skeleton
                            key={item}
                            width={80}
                            height={36}
                            borderRadius={18}
                            style={styles.categorySkeleton}
                        />
                    ))}
                </View>

                {/* Trending Section placeholder */}
                <View style={styles.sectionHeader}>
                    <Skeleton width={120} height={24} />
                    <Skeleton width={60} height={16} />
                </View>
                <View style={styles.trendingRow}>
                    <Skeleton width={280} height={160} borderRadius={16} style={styles.trendingItem} />
                    <Skeleton width={280} height={160} borderRadius={16} />
                </View>

                {/* Main Feed placeholder */}
                <View style={styles.sectionHeader}>
                    <Skeleton width={150} height={24} />
                </View>

                <ArticleSkeleton variant="featured" />
                <ArticleSkeleton variant="compact" />
                <ArticleSkeleton variant="compact" />
                <ArticleSkeleton variant="compact" />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    content: {
        paddingBottom: 40,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 24,
        justifyContent: 'center',
    },
    categorySkeleton: {
        marginBottom: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 8,
    },
    trendingRow: {
        flexDirection: 'row',
        paddingLeft: 20,
        marginBottom: 32,
    },
    trendingItem: {
        marginRight: 16,
    },
});

export default DiscoverFeedSkeleton;
