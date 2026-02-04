import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

import Skeleton from '@/components/ui/Skeleton';
import UnifiedHeader from '@/components/ui/UnifiedHeader';

const StockDetailSkeleton = ({ onBackPress }: { onBackPress: () => void }) => {
  const theme = useTheme();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader title="" onBackPress={onBackPress} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section - Immersive Design Skeleton */}
        <View style={styles.immersiveHeader}>
          {/* Icon Wrapper */}
          <View style={styles.iconWrapper}>
            <Skeleton width={80} height={80} borderRadius={24} />
          </View>

          {/* Stock Name & Category */}
          <View style={styles.headerInfo}>
            <Skeleton width={180} height={28} style={styles.stockNameSkeleton} />
            <Skeleton width={100} height={28} borderRadius={12} />
          </View>

          {/* Price Container */}
          <View style={styles.priceContainer}>
            <Skeleton width={200} height={40} style={styles.priceSkeleton} />
            <Skeleton width={150} height={32} borderRadius={16} style={styles.trendBadgeSkeleton} />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.sectionHeader}>
          <Skeleton width={120} height={14} />
        </View>

        {/* Stats Grid - Row 1 */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={80} height={12} />
            </View>
            <Skeleton width={100} height={24} style={styles.statValueSkeleton} />
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={80} height={12} />
            </View>
            <Skeleton width={100} height={24} style={styles.statValueSkeleton} />
          </View>
        </View>

        {/* Stats Grid - Row 2 */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={80} height={12} />
            </View>
            <Skeleton width={80} height={24} style={styles.statValueSkeleton} />
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={80} height={12} />
            </View>
            <Skeleton width={90} height={24} style={styles.statValueSkeleton} />
          </View>
        </View>

        {/* Order Book Section Skeleton */}
        <View style={styles.sectionHeader}>
          <Skeleton width={140} height={14} />
        </View>

        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={60} height={12} />
            </View>
            <Skeleton width={100} height={24} style={styles.statValueSkeleton} />
            <Skeleton width={80} height={12} style={styles.volumeSkeleton} />
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.statHeader}>
              <Skeleton width={32} height={32} borderRadius={10} />
              <Skeleton width={60} height={12} />
            </View>
            <Skeleton width={100} height={24} style={styles.statValueSkeleton} />
            <Skeleton width={80} height={12} style={styles.volumeSkeleton} />
          </View>
        </View>

        {/* Technical Analysis Section */}
        <View style={styles.sectionHeader}>
          <Skeleton width={130} height={14} />
        </View>

        <View
          style={[
            styles.chartPlaceholder,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={200} height={16} style={styles.chartTextSkeleton} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  immersiveHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stockNameSkeleton: {
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceSkeleton: {
    marginBottom: 12,
  },
  trendBadgeSkeleton: {
    marginTop: 0,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statValueSkeleton: {
    marginTop: 0,
  },
  volumeSkeleton: {
    marginTop: 4,
  },
  chartPlaceholder: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  chartTextSkeleton: {
    marginTop: 12,
  },
});

export default StockDetailSkeleton;
