import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Skeleton from '@/components/ui/Skeleton';

const SettingsSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header Skeleton matches UnifiedHeader section variant */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Skeleton width={150} height={28} />
          </View>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Skeleton */}
        <View style={styles.section}>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <View style={styles.profileContent}>
              <Skeleton width={56} height={56} borderRadius={28} />
              <View style={styles.profileText}>
                <Skeleton width={150} height={20} style={styles.profileName} />
                <Skeleton width={100} height={14} />
              </View>
            </View>
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
        </View>

        {/* Alerts Section Skeleton */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Skeleton width={120} height={14} />
            <Skeleton width={100} height={20} borderRadius={4} />
          </View>

          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {[1, 2].map((_, index) => (
              <View
                key={index}
                style={[styles.itemRow, index === 1 && styles.mb0]}
              >
                <View style={styles.itemLeft}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <View style={styles.itemText}>
                    <Skeleton width={80} height={16} />
                    <Skeleton width={100} height={12} style={styles.mt6} />
                  </View>
                </View>
                <Skeleton width={40} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        </View>

        {/* Preferences Section Skeleton */}
        <View style={styles.section}>
          <Skeleton width={100} height={14} style={styles.sectionTitle} />

          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {[1, 2].map((_, index) => (
              <View
                key={index}
                style={[styles.itemRow, index === 1 && styles.mb0]}
              >
                <View style={styles.itemLeft}>
                  <Skeleton width={32} height={32} borderRadius={8} />
                  <Skeleton width={120} height={16} style={styles.ml12} />
                </View>
                <Skeleton width={40} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        </View>

        {/* Account Section Skeleton */}
        <View style={styles.section}>
          <Skeleton width={60} height={14} style={styles.sectionTitle} />

          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {[1, 2, 3].map((_, index) => (
              <View
                key={index}
                style={[styles.itemRow, index === 2 && styles.mb0]}
              >
                <View style={styles.itemLeft}>
                  <Skeleton width={24} height={24} borderRadius={4} />
                  <Skeleton width={150} height={16} style={styles.ml12} />
                </View>
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Skeleton width={200} height={14} style={styles.mb8} />
            <Skeleton width={150} height={12} />
          </View>
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
    paddingHorizontal: 0,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileText: {
    justifyContent: 'center',
  },
  profileName: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    borderRadius: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  mb0: {
    marginBottom: 0,
  },
  mt6: {
    marginTop: 6,
  },
  ml12: {
    marginLeft: 12,
  },
  mb8: {
    marginBottom: 8,
  },
});

export default SettingsSkeleton;
