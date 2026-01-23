import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const NotificationsSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={styles.container}>
      {/* Notification Cards Skeleton */}
      <View style={styles.list}>
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <View 
            key={key} 
            style={[
              styles.card, 
              { 
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.elevation.level1,
                borderRadius: 16
              }
            ]}
          >
            <View style={styles.cardContent}>
              <Skeleton width={48} height={48} borderRadius={12} />
              <View style={styles.textContainer}>
                <View style={styles.row}>
                  <Skeleton width={100} height={16} />
                  <Skeleton width={60} height={12} />
                </View>
                <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
                <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  list: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

export default NotificationsSkeleton;
