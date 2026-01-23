import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const DetailsSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <Skeleton width={150} height={32} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Skeleton width={120} height={120} borderRadius={60} />
          </View>
          
          <Skeleton width={120} height={24} borderRadius={20} style={styles.badge} />
          
          <Skeleton width={200} height={32} style={styles.title} />
          <Skeleton width="90%" height={20} style={styles.description} />
          <Skeleton width="80%" height={20} style={styles.descriptionLine} />
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Skeleton width={150} height={20} />
            <Skeleton width={40} height={20} />
          </View>
          <Skeleton width="100%" height={8} borderRadius={4} />
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <Skeleton width={120} height={24} style={styles.featuresTitle} />
          
          {[1, 2, 3].map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.featureItem, 
                { 
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outline,
                  borderRadius: r * 6,
                }
              ]}
            >
              <Skeleton width={48} height={48} borderRadius={12} />
              <View style={styles.featureText}>
                <Skeleton width={150} height={20} style={styles.featureTitleSkeleton} />
                <Skeleton width={200} height={16} style={styles.featureDescSkeleton} />
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Skeleton width="100%" height={48} borderRadius={12} />
          <Skeleton width={250} height={16} style={styles.notificationText} />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  badge: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 8,
  },
  descriptionLine: {
    marginBottom: 0,
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    marginBottom: 16,
    marginLeft: 4,
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
    marginTop: 0,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationText: {
    marginTop: 12,
  },
});

export default DetailsSkeleton;
