import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const ExchangeRatesSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  const renderRateCardSkeleton = (key: number) => (
    <View 
      key={key} 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outline,
          borderRadius: r * 6,
        }
      ]}
    >
      <View style={styles.leftContent}>
        <Skeleton width={48} height={48} borderRadius={r * 4} />
        <View style={styles.textContainer}>
          <Skeleton width={80} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={120} height={14} />
        </View>
      </View>
      <View style={styles.rightContent}>
        <Skeleton width={100} height={24} style={{ marginBottom: 4 }} />
        <Skeleton width={60} height={16} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width={150} height={28} style={{ marginBottom: 4 }} />
        <Skeleton width={200} height={16} />
      </View>
      
      {/* Search Bar Skeleton */}
      <View style={styles.searchBar}>
        <Skeleton width="100%" height={48} borderRadius={r * 3} />
      </View>

      {/* Filter Chips Skeleton */}
      <View style={styles.chipsContainer}>
        {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        ))}
      </View>

      {/* Sections Skeleton */}
      <View style={styles.section}>
        <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
        {renderRateCardSkeleton(1)}
        {renderRateCardSkeleton(2)}
      </View>

      <View style={styles.section}>
        <Skeleton width={180} height={16} style={{ marginBottom: 12 }} />
        {renderRateCardSkeleton(3)}
        {renderRateCardSkeleton(4)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  searchBar: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default ExchangeRatesSkeleton;
