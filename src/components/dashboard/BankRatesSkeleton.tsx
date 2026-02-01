import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

import Skeleton from '@/components/ui/Skeleton';

const BankRatesSkeleton = () => {
  const theme = useTheme();
  const r = theme.roundness;

  const renderRateCardSkeleton = (key: number) => {
    const cardStyle = [
      styles.card,
      {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.outline,
        borderRadius: r * 6,
      },
    ];

    return (
      <View key={key} style={cardStyle}>
        {/* Header part of card */}
        <View style={styles.cardHeader}>
          <View style={styles.leftHeader}>
            <Skeleton width={40} height={40} borderRadius={r * 4} />
            <Skeleton width={120} height={20} style={styles.bankNameSkeleton} />
          </View>
          <Skeleton width={80} height={12} />
        </View>

        {/* Values part of card */}
        <View style={styles.cardValues}>
          <View style={styles.valueCol}>
            <Skeleton width={60} height={12} style={styles.labelSkeleton} />
            <Skeleton width={80} height={24} />
          </View>
          <View style={[styles.separator, { backgroundColor: theme.colors.outline }]} />
          <View style={styles.valueCol}>
            <Skeleton width={60} height={12} style={styles.labelSkeleton} />
            <Skeleton width={80} height={24} />
          </View>
        </View>
      </View>
    );
  };

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];

  return (
    <View style={containerStyle}>
      {/* Search Bar Skeleton sync with searchArea style */}
      <View style={styles.searchArea}>
        <Skeleton width="100%" height={56} borderRadius={r * 3} />
      </View>

      <View style={styles.listContent}>
        {/* BCV Section Skeleton */}
        <View style={styles.bcvSection}>
          <View style={styles.sectionHeader}>
            <Skeleton width={120} height={16} />
            <Skeleton width={70} height={20} borderRadius={4} />
          </View>
          <Skeleton width="100%" height={160} borderRadius={28} />
        </View>

        {/* List Header Skeleton */}
        <View style={styles.listHeaderLegacy}>
          <Skeleton width={150} height={16} />
          <Skeleton width={60} height={24} borderRadius={8} />
        </View>

        {/* Filter Chips Skeleton */}
        <View style={styles.chipsContainer}>
          {[1, 2, 3].map(i => (
            <Skeleton
              key={i}
              width={i === 1 ? 60 : 100}
              height={32}
              borderRadius={16}
              style={styles.chipSkeleton}
            />
          ))}
        </View>

        {/* Bank Cards List */}
        <View style={styles.list}>
          {renderRateCardSkeleton(1)}
          {renderRateCardSkeleton(2)}
          {renderRateCardSkeleton(3)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchArea: {
    paddingHorizontal: 20,
    marginTop: 8,
    paddingBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  bcvSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  listHeaderLegacy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: -8,
  },
  list: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueCol: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 30,
  },
  bankNameSkeleton: {
    marginLeft: 12,
  },
  labelSkeleton: {
    marginBottom: 4,
  },
  chipSkeleton: {
    marginRight: 8,
  },
});

export default BankRatesSkeleton;
