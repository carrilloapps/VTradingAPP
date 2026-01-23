import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const StocksSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width={150} height={28} />
        <View style={styles.headerRight}>
          <Skeleton width={32} height={32} borderRadius={r * 4} />
          <Skeleton width={32} height={32} borderRadius={r * 4} />
        </View>
      </View>
      
      {/* Search Bar Skeleton */}
      <View style={styles.searchBar}>
        <Skeleton width="100%" height={48} borderRadius={r * 3} />
      </View>

      {/* Market Status Skeleton */}
      <View style={styles.section}>
        <Skeleton width="100%" height={40} borderRadius={r * 3} />
      </View>

      {/* Index Hero Skeleton */}
      <View style={styles.heroSection}>
        <Skeleton width="100%" height={180} borderRadius={16} />
      </View>

      {/* Filters Skeleton */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        ))}
      </View>

      {/* Stocks List Skeleton */}
      <View style={styles.listSection}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.stockItem, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: r * 6,
                elevation: 0,
              }
            ]}
          >
            <View style={styles.stockLeft}>
              <Skeleton width={48} height={48} borderRadius={r * 4} />
              <View style={styles.stockContent}>
                <Skeleton width={100} height={16} />
                <Skeleton width={40} height={12} style={styles.stockSubtitleSkeleton} />
              </View>
            </View>
            <View style={styles.stockRight}>
              <Skeleton width={70} height={16} />
              <Skeleton width={50} height={16} style={styles.stockBadgeSkeleton} borderRadius={r * 3} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  heroSection: {
    marginBottom: 24,
  },
  listSection: {
    gap: 12,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1, // Will be overridden by inline style for dark mode
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  stockContent: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  stockSubtitleSkeleton: {
    marginTop: 6,
  },
  stockBadgeSkeleton: {
    marginTop: 6,
  },
});

export default StocksSkeleton;
