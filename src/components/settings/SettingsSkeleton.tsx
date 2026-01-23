import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../ui/Skeleton';

const SettingsSkeleton = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const r = theme.roundness;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
         <View style={styles.headerContent}>
            <Skeleton width={150} height={32} />
            <Skeleton width={24} height={24} borderRadius={12} />
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* User Profile Skeleton */}
        <View style={styles.section}>
          <View 
            style={[
              styles.profileCard, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: r * 6,
              }
            ]}
          >
            <View style={styles.profileContent}>
              <Skeleton width={56} height={56} borderRadius={28} />
              <View style={styles.profileText}>
                <Skeleton width={150} height={24} style={styles.profileName} />
                <Skeleton width={100} height={16} />
              </View>
            </View>
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Alerts Section Skeleton */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={20} />
          </View>
          
          <View 
            style={[
              styles.cardContainer, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: r * 6,
              }
            ]}
          >
            {[1, 2].map((_, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Skeleton width={40} height={40} borderRadius={12} />
                    <View style={styles.itemText}>
                        <Skeleton width={80} height={20} />
                        <Skeleton width={100} height={16} style={{marginTop: 4}} />
                    </View>
                </View>
                <Skeleton width={40} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        </View>

        {/* Preferences Section Skeleton */}
        <View style={styles.section}>
          <Skeleton width={100} height={20} style={styles.sectionTitle} />
          
          <View 
            style={[
              styles.cardContainer, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: r * 6,
              }
            ]}
          >
            {[1, 2].map((_, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Skeleton width={32} height={32} borderRadius={8} />
                    <Skeleton width={120} height={20} style={{marginLeft: 12}} />
                </View>
                <Skeleton width={40} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        </View>

        {/* Account Section Skeleton */}
        <View style={styles.section}>
          <Skeleton width={60} height={20} style={styles.sectionTitle} />
          
          <View 
            style={[
              styles.cardContainer, 
              { 
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
                borderRadius: r * 6,
              }
            ]}
          >
             {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                    <Skeleton width={24} height={24} borderRadius={4} />
                    <Skeleton width={150} height={20} style={{marginLeft: 12}} />
                </View>
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
            ))}
          </View>
          
          <View style={styles.footer}>
             <Skeleton width={200} height={16} style={{marginBottom: 8}} />
             <Skeleton width={150} height={16} />
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
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
    gap: 4,
  },
  profileName: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  cardContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
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
      marginTop: 24,
  }
});

export default SettingsSkeleton;
