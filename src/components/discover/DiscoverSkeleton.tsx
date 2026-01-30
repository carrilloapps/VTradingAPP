import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

/**
 * Specialized skeleton for the Discover screen when feature is disabled (Construction view)
 */
const DiscoverConstructionSkeleton = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Skeleton width={150} height={32} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Modern Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Skeleton width={140} height={140} borderRadius={70} />
          </View>

          <Skeleton width={120} height={28} borderRadius={14} style={styles.badge} />

          <Skeleton width={240} height={40} style={styles.title} />
          <Skeleton width="85%" height={20} style={styles.description} />
          <Skeleton width="60%" height={20} style={styles.descriptionLine} />
        </View>

        {/* Dynamic Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Skeleton width={100} height={16} />
            <Skeleton width={40} height={16} />
          </View>
          <Skeleton width="100%" height={10} borderRadius={5} />
        </View>

        {/* Roadmap Preview */}
        <View style={styles.featuresContainer}>
          <Skeleton width={140} height={24} style={styles.featuresTitle} />

          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.featureItem,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                  borderRadius: 20,
                }
              ]}
            >
              <Skeleton width={44} height={44} borderRadius={12} />
              <View style={styles.featureText}>
                <Skeleton width="60%" height={20} style={styles.featureTitleSkeleton} />
                <Skeleton width="90%" height={14} style={styles.featureDescSkeleton} />
              </View>
            </View>
          ))}
        </View>

        {/* Action Button Area */}
        <View style={styles.actionContainer}>
          <Skeleton width="100%" height={56} borderRadius={28} />
          <Skeleton width={200} height={14} style={styles.notificationText} />
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  badge: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 10,
  },
  descriptionLine: {
    marginBottom: 0,
  },
  progressSection: {
    width: '100%',
    marginBottom: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featuresTitle: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitleSkeleton: {
    marginBottom: 8,
  },
  featureDescSkeleton: {
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  notificationText: {
    marginTop: 16,
  },
});

export default DiscoverConstructionSkeleton;
