import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const WalletSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width={120} height={28} />
      </View>
      
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={styles.gearIcon}>
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
        </View>
        
        <View style={styles.statusBadge}>
            <Skeleton width={100} height={24} borderRadius={12} />
        </View>

        <Skeleton width={200} height={32} style={styles.titleSkeleton} />
        <Skeleton width={280} height={16} style={styles.textSkeleton} />
        <Skeleton width={240} height={16} style={styles.textSkeleton} />
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
            <Skeleton width={120} height={16} />
            <Skeleton width={40} height={16} />
        </View>
        <Skeleton width="100%" height={6} borderRadius={3} />
      </View>

      {/* Features Preview */}
      <View style={styles.featuresContainer}>
        <Skeleton width={100} height={20} style={styles.sectionTitle} />
        
        {[1, 2, 3].map((_, index) => (
            <View 
                key={index} 
                style={[
                    styles.featureItem, 
                    { 
                        backgroundColor: theme.colors.elevation.level1,
                        borderColor: theme.dark ? 'transparent' : theme.colors.outline,
                        borderWidth: theme.dark ? 0 : 1,
                        borderRadius: r * 3, // Assuming feature item radius
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: theme.dark ? 0 : 0.05,
                        shadowRadius: 3,
                        elevation: theme.dark ? 0 : 2,
                    }
                ]}
            >
                <Skeleton width={40} height={40} borderRadius={r * 2} />
                <View style={styles.featureText}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={180} height={12} style={styles.subtitleSkeleton} />
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
    marginBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  gearIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
  },
  statusBadge: {
    marginBottom: 16,
  },
  titleSkeleton: {
    marginBottom: 12,
  },
  textSkeleton: {
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuresContainer: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderWidth: 1,
  },
  featureText: {
    flex: 1,
  },
  subtitleSkeleton: {
    marginTop: 6,
  },
});

export default WalletSkeleton;
