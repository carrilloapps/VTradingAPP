import React, { useMemo } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';

interface AppRecommendationsSkeletonProps {
  columns?: number;
}

const MIN_PLACEHOLDERS = 4;

const AppRecommendationsSkeleton: React.FC<AppRecommendationsSkeletonProps> = ({ columns = MIN_PLACEHOLDERS }) => {
  const theme = useAppTheme();
  const effectiveColumns = useMemo(() => Math.max(1, Math.floor(columns)), [columns]);
  const columnWidth = useMemo<DimensionValue>(() => `${100 / effectiveColumns}%` as DimensionValue, [effectiveColumns]);
  const placeholders = useMemo(() => Math.max(MIN_PLACEHOLDERS, effectiveColumns), [effectiveColumns]);

  return (
    <View style={styles.container} testID="app-recommendations-skeleton">
      {Array.from({ length: placeholders }).map((_, index) => (
        <View key={`app-recommendation-skeleton-${index}`} style={[styles.cardWrapper, { width: columnWidth }]}
        >
          <Surface
            elevation={0}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: theme.roundness * 6,
              },
            ]}
          >
            <View style={[styles.iconContainer, { borderRadius: theme.roundness * 3 }]}
            >
              <Skeleton width={32} height={32} borderRadius={16} />
            </View>
            <Skeleton width="80%" height={10} style={styles.titleSkeleton} />
          </Surface>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  cardWrapper: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleSkeleton: {
    marginTop: 4,
  },
});

export default React.memo(AppRecommendationsSkeleton);
