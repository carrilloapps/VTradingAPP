import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const ExchangeRatesSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  const renderRateCardSkeleton = (key: number) => {
    const cardStyle = [
      styles.card,
      {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.outline,
      },
    ];

    return (
      <View key={key} style={cardStyle}>
        <View style={styles.leftContent}>
          <Skeleton width={48} height={48} style={styles.iconSkeleton} />
          <View style={styles.textContainer}>
            <Skeleton width={80} height={20} style={styles.titleSkeleton} />
            <Skeleton width={120} height={14} />
          </View>
        </View>
        <View style={styles.rightContent}>
          <Skeleton width={100} height={24} style={styles.valueSkeleton} />
          <Skeleton width={60} height={16} />
        </View>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    { paddingTop: insets.top, backgroundColor: theme.colors.background },
  ];

  return (
    <View style={containerStyle}>
      {/* Header Skeleton matches UnifiedHeader section variant */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Skeleton width={150} height={28} />
              <Skeleton width={200} height={14} style={styles.headerSubtitle} />
            </View>
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        </View>

        {/* Search Bar Skeleton */}
        <View style={styles.searchBar}>
          <Skeleton width="100%" height={56} borderRadius={r * 3} />
        </View>
      </View>

      <View style={styles.scrollContent}>
        {/* Filter Chips Skeleton */}
        <View style={styles.chipsContainer}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton
              key={i}
              width={i === 1 ? 60 : 80}
              height={32}
              borderRadius={16}
              style={styles.chipSkeleton}
            />
          ))}
        </View>

        {/* Sections Skeleton */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Skeleton width={150} height={12} />
            <Skeleton width={120} height={20} borderRadius={4} />
          </View>
          {renderRateCardSkeleton(1)}
          {renderRateCardSkeleton(2)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Skeleton width={180} height={12} />
          </View>
          {renderRateCardSkeleton(3)}
          {renderRateCardSkeleton(4)}
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
    marginBottom: 0,
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
  searchBar: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24, // Assuming theme.roundness * 6 ≈ 24 (4 * 6)
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  iconSkeleton: {
    borderRadius: 16, // r * 4
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  valueSkeleton: {
    marginBottom: 4,
  },
  headerSubtitle: {
    marginTop: 8,
  },
  chipSkeleton: {
    marginRight: 8,
  },
});

export default ExchangeRatesSkeleton;
