import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Skeleton from '@/components/ui/Skeleton';

const DashboardSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  const containerStyle = [styles.container, { paddingTop: insets.top }];
  const stockItemStyle = [
    styles.stockItem,
    {
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
      borderRadius: r * 6,
    },
  ];

  return (
    <View style={containerStyle}>
      {/* Header Skeleton (matches UnifiedHeader profile) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={styles.headerText}>
              <Skeleton
                width={80}
                height={12}
                style={styles.headerTextSkeleton}
              />
              <Skeleton width={120} height={20} />
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        </View>
      </View>

      {/* Market Status Skeleton */}
      <View style={styles.marketStatusContainer}>
        <Skeleton width="100%" height={56} borderRadius={r * 3} />
      </View>

      {/* Exchange Cards Skeleton */}
      <View style={styles.section}>
        <Skeleton
          width="100%"
          height={150}
          borderRadius={r * 6}
          style={styles.firstCardSkeleton}
        />
        <Skeleton width="100%" height={150} borderRadius={r * 6} />
      </View>

      {/* Advanced Calculator CTA Skeleton */}
      <View style={styles.ctaContainer}>
        <Skeleton width="100%" height={100} borderRadius={r * 4} />
      </View>

      {/* Stocks List Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={180} height={24} borderRadius={r * 2} />
          <Skeleton width={80} height={20} borderRadius={r * 2} />
        </View>

        {[1, 2, 3].map((_, index) => (
          <View key={index} style={stockItemStyle}>
            <View style={styles.stockLeft}>
              <Skeleton width={48} height={48} borderRadius={r * 3} />
              <View style={styles.stockContent}>
                <Skeleton width={100} height={16} />
                <Skeleton
                  width={60}
                  height={12}
                  style={styles.stockSubtitleSkeleton}
                />
              </View>
            </View>
            <View style={styles.stockRight}>
              <Skeleton width={80} height={16} />
              <Skeleton
                width={50}
                height={12}
                style={styles.stockSubtitleSkeleton}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Calculator Skeleton */}
      <View style={styles.section}>
        <Skeleton width="100%" height={240} borderRadius={r * 6} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    justifyContent: 'center',
  },
  headerTextSkeleton: {
    marginBottom: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  marketStatusContainer: {
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 20,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  firstCardSkeleton: {
    marginBottom: 12,
  },
  stockContent: {
    marginLeft: 16,
  },
  stockSubtitleSkeleton: {
    marginTop: 4,
  },
});

export default DashboardSkeleton;
