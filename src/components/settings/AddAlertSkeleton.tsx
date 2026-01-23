import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const AddAlertSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={150} height={24} style={{ marginLeft: 16 }} />
         </View>
      </View>

      <View style={styles.content}>
        {/* Search Bar Skeleton */}
        <View style={styles.searchBar}>
            <Skeleton width="100%" height={48} borderRadius={24} />
        </View>

        {/* Filters Skeleton */}
        <View style={styles.filters}>
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            ))}
        </View>

        {/* List Items Skeleton */}
        <View style={styles.list}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} style={[
                    styles.item,
                    { borderBottomColor: theme.colors.outline }
                ]}>
                    <View style={styles.leftContent}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View style={styles.textContainer}>
                            <Skeleton width={60} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton width={100} height={14} />
                        </View>
                    </View>
                    <View style={styles.rightContent}>
                        <Skeleton width={80} height={20} style={{ marginBottom: 4 }} />
                        <Skeleton width={50} height={16} borderRadius={4} />
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  list: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
  }
});

export default AddAlertSkeleton;
