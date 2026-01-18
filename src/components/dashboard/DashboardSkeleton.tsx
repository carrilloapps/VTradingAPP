import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const DashboardSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Skeleton width={120} height={20} />
          <View style={styles.headerIcons}>
            <Skeleton width={32} height={32} borderRadius={r * 4} />
            <Skeleton width={32} height={32} borderRadius={r * 4} />
          </View>
        </View>
        <Skeleton width={180} height={28} style={styles.headerTitleSkeleton} />
      </View>

      {/* Market Status Skeleton */}
      <View style={styles.section}>
        <Skeleton width="100%" height={48} borderRadius={r * 3} />
      </View>

      {/* Exchange Cards Skeleton */}
      <View style={styles.section}>
        <Skeleton width="100%" height={140} borderRadius={r * 4} style={styles.firstCardSkeleton} />
        <Skeleton width="100%" height={140} borderRadius={r * 4} />
      </View>

      {/* Stocks List Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={32} height={32} borderRadius={r * 2} />
          <Skeleton width={150} height={20} style={styles.sectionTitleSkeleton} />
        </View>
        
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={[styles.stockItem, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.stockLeft}>
              <Skeleton width={40} height={40} borderRadius={r * 2} />
              <View style={styles.stockContent}>
                <Skeleton width={60} height={16} />
                <Skeleton width={100} height={12} style={styles.stockSubtitleSkeleton} />
              </View>
            </View>
            <View style={styles.stockRight}>
              <Skeleton width={80} height={16} />
              <Skeleton width={50} height={12} style={styles.stockSubtitleSkeleton} />
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
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  headerTitleSkeleton: {
    marginTop: 8,
  },
  firstCardSkeleton: {
    marginBottom: 12,
  },
  sectionTitleSkeleton: {
    marginLeft: 8,
  },
  stockContent: {
    marginLeft: 12,
  },
  stockSubtitleSkeleton: {
    marginTop: 4,
  },
});

export default DashboardSkeleton;
