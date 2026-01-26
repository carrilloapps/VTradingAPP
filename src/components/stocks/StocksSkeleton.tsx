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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton matches UnifiedHeader section variant */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                    <Skeleton width={150} height={28} />
                    <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
                </View>
                <View style={styles.headerRight}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
            </View>
        </View>
        
        {/* Search Bar Skeleton */}
        <View style={styles.searchBarContainer}>
            <Skeleton width="100%" height={56} borderRadius={r * 3} />
        </View>
      </View>
      
      <View style={styles.scrollContent}>
        {/* Market Status Skeleton */}
        <View style={styles.marketStatusContainer}>
            <Skeleton width="100%" height={40} borderRadius={r * 3} />
        </View>

        {/* Index Hero Skeleton */}
        <View style={styles.heroSection}>
            <Skeleton width="100%" height={200} borderRadius={24} />
        </View>

        {/* Filters Skeleton */}
        <View style={styles.filtersContainer}>
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            ))}
        </View>

        {/* List Header Skeleton */}
        <View style={styles.listHeader}>
             <Skeleton width={100} height={12} />
             <Skeleton width={120} height={12} />
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
                <Skeleton width={50} height={16} style={styles.stockBadgeSkeleton} borderRadius={r * 2} />
                </View>
            </View>
            ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 0,
  },
  headerTop: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flex: 1,
  },
  marketStatusContainer: {
    paddingTop: 8,
    marginBottom: 8,
  },
  heroSection: {
    marginBottom: 24,
    marginTop: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  listSection: {
    gap: 12,
    paddingBottom: 40,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1, 
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
