import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import ArticleSkeleton from './ArticleSkeleton';
import { useAppTheme } from '@/theme';
import Skeleton from '@/components/ui/Skeleton';

const CategoryTagSkeleton = () => {
  const theme = useAppTheme();

  const renderHeader = () => (
    <View style={styles.header}>
      <Skeleton width="100%" height={300} borderRadius={0} />
      <View style={styles.headerOverlay}>
        <Skeleton width={80} height={16} style={styles.categoryLabel} />
        <Skeleton width="60%" height={32} style={styles.titleLabel} />
        <Skeleton width="80%" height={16} style={styles.descriptionLabel} />
        <View style={styles.statsRow}>
          <Skeleton width={100} height={14} style={styles.statsItem} />
          <Skeleton width={80} height={14} />
        </View>
      </View>
      <View style={styles.sectionTitle}>
        <Skeleton width={200} height={18} />
      </View>
    </View>
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
  ];

  return (
    <View style={containerStyle}>
      <FlashList
        data={[1, 2, 3, 4]}
        keyExtractor={item => item.toString()}
        renderItem={({ index }) => (
          <ArticleSkeleton variant={index === 0 ? 'featured' : 'compact'} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  headerOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  categoryLabel: {
    marginBottom: 12,
  },
  titleLabel: {
    marginBottom: 8,
  },
  descriptionLabel: {
    marginBottom: 24,
  },
  statsItem: {
    marginRight: 16,
  },
});

export default CategoryTagSkeleton;
