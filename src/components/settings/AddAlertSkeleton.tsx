import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

interface Props {
  variant?: 'list' | 'form';
}

const AddAlertSkeleton = ({ variant = 'list' }: Props) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  if (variant === 'form') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
         {/* Header Skeleton matches UnifiedHeader default */}
        <View style={[styles.headerSimple, { paddingTop: insets.top + 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width={150} height={24} style={{ marginLeft: 16 }} />
            </View>
        </View>

        <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: 40 }]}>
            {/* Symbol Header Section */}
            <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 8 }}>
                <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
                <View style={{ alignItems: 'center', gap: 8 }}>
                    <Skeleton width={140} height={32} />
                    <Skeleton width={180} height={20} />
                </View>
            </View>

            {/* Price Card */}
            <View style={[styles.priceCardSkeleton, { backgroundColor: theme.colors.elevation.level1 }]}>
                <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
                <Skeleton width={150} height={48} style={{ marginBottom: 12 }} />
                <Skeleton width={80} height={20} borderRadius={4} />
            </View>

            {/* Inputs */}
            <View style={{ marginBottom: 24 }}>
                <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={56} borderRadius={4} />
            </View>
            
            {/* Condition */}
            <View style={{ marginBottom: 24 }}>
                <Skeleton width={150} height={16} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={56} borderRadius={12} />
            </View>

            {/* Buttons */}
            <View style={{ gap: 12, marginTop: 8 }}>
                <Skeleton width="100%" height={52} borderRadius={12} />
                <Skeleton width="100%" height={52} borderRadius={12} />
            </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.headerSimple, { paddingTop: insets.top + 12 }]}>
         <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={150} height={24} style={{ marginLeft: 16 }} />
         </View>
      </View>

      <View style={styles.searchSectionSkeleton}>
        {/* Search Bar Skeleton */}
        <View style={styles.searchBar}>
            <Skeleton width="100%" height={56} borderRadius={r * 3} />
        </View>

        {/* Filters Skeleton */}
        <View style={styles.filters}>
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            ))}
        </View>
      </View>

      <View style={styles.content}>
        {/* List Items Skeleton */}
        <View style={styles.list}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={[
                    styles.item,
                    { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.elevation.level1,
                        borderRadius: 24
                    }
                ]}>
                    <View style={styles.leftContent}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View style={styles.textContainer}>
                            <Skeleton width={80} height={16} style={{ marginBottom: 6 }} />
                            <Skeleton width={120} height={12} />
                        </View>
                    </View>
                    <View style={styles.rightContent}>
                        <Skeleton width={70} height={16} style={{ marginBottom: 6 }} />
                        <Skeleton width={50} height={14} borderRadius={4} />
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
  headerSimple: {
    paddingBottom: 16,
  },
  searchSectionSkeleton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    padding: 16,
  },
  formContent: {
      padding: 24,
  },
  searchBar: {
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    marginTop: 12,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
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
  },
  priceCardSkeleton: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 24,
      marginBottom: 32,
  }
});

export default AddAlertSkeleton;
