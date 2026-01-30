import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';

const ArticleDetailSkeleton = () => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={150} height={20} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Skeleton width="100%" height={280} borderRadius={0} />

                <View style={styles.content}>
                    <View style={styles.categoriesRow}>
                        <Skeleton width={80} height={24} borderRadius={12} style={{ marginRight: 8 }} />
                        <Skeleton width={100} height={24} borderRadius={12} />
                    </View>

                    <Skeleton width="90%" height={32} style={styles.title} />
                    <Skeleton width="70%" height={32} style={styles.titleLine} />

                    <View style={styles.metadata}>
                        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                            <View style={styles.metaRow}>
                                <Skeleton width={80} height={12} style={{ marginRight: 8 }} />
                                <Skeleton width={60} height={12} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.body}>
                        <Skeleton width="100%" height={16} style={styles.paragraphLine} />
                        <Skeleton width="100%" height={16} style={styles.paragraphLine} />
                        <Skeleton width="100%" height={16} style={styles.paragraphLine} />
                        <Skeleton width="80%" height={16} style={styles.paragraphLine} />

                        <Skeleton width="100%" height={180} borderRadius={16} style={styles.imageBlock} />

                        <Skeleton width="100%" height={16} style={styles.paragraphLine} />
                        <Skeleton width="100%" height={16} style={styles.paragraphLine} />
                        <Skeleton width="60%" height={16} style={styles.paragraphLine} />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    content: {
        padding: 20,
    },
    categoriesRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    title: {
        marginBottom: 8,
    },
    titleLine: {
        marginBottom: 24,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    body: {
        marginTop: 20,
    },
    paragraphLine: {
        marginBottom: 12,
        borderRadius: 4,
    },
    imageBlock: {
        marginVertical: 24,
    },
});

export default ArticleDetailSkeleton;
