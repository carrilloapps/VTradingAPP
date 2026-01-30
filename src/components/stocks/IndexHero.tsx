import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTrend, getTrendIcon } from '../../utils/trendUtils';

interface IndexHeroStats {
  titlesUp: number;
  titlesDown: number;
  titlesUnchanged: number;
  totalVolume: number;
  totalAmount: number;
}

interface IndexHeroProps {
  value: string;
  changePercent: string;
  isPositive: boolean;
  volume: string;
  stats?: IndexHeroStats;
  labelOverride?: string;
  fallbackValue?: string;
}

const IndexHero: React.FC<IndexHeroProps> = ({
  value,
  changePercent,
  volume,
  stats,
  labelOverride,
  fallbackValue
}) => {
  const trend = getTrend(changePercent);
  const trendIcon = getTrendIcon(trend);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0e4981', '#0b3a67', '#082f54']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Background Blur Effect Circle */}
        <View style={styles.blurCircle} />

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text variant="labelMedium" style={styles.headerText}>ÍNDICE BURSÁTIL CARACAS</Text>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="chart-line-variant" size={18} color="white" />
            </View>
          </View>

          <View style={styles.mainValueRow}>
            <Text variant="displaySmall" style={styles.valueText}>Bs. {value}</Text>
            <View style={[styles.changeBadge, trend === 'neutral' ? styles.neutralBg : styles.positiveBg]}>
              <MaterialCommunityIcons name={trendIcon} size={16} color={trend === 'neutral' ? '#D1D5DB' : '#6EE7B7'} />
              <Text variant="labelLarge" style={[styles.changeText, trend === 'neutral' ? styles.trendNeutralText : styles.trendUpText]}>{changePercent}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text variant="labelSmall" style={styles.labelSmall}>VOLUMEN</Text>
              <Text variant="bodyMedium" style={styles.whiteBold}>
                {volume} <Text variant="labelSmall" style={styles.unitText}>VES</Text>
              </Text>
            </View>
            <View style={styles.rightAlign}>
              <Text variant="labelSmall" style={styles.labelSmall}>{labelOverride || 'TÍTULOS NEGOCIADOS'}</Text>
              {stats ? (
                <View style={styles.breadthRow}>
                  <View style={styles.breadthItem}>
                    <MaterialCommunityIcons name="arrow-up-bold" size={14} color="#6EE7B7" />
                    <Text variant="bodyMedium" style={[styles.whiteBold, styles.trendUpText]}>{stats.titlesUp}</Text>
                  </View>
                  <View style={styles.breadthItem}>
                    <MaterialCommunityIcons name="arrow-down-bold" size={14} color="#F87171" />
                    <Text variant="bodyMedium" style={[styles.whiteBold, styles.trendDownText]}>{stats.titlesDown}</Text>
                  </View>
                  <View style={styles.breadthItem}>
                    <MaterialCommunityIcons name="minus" size={14} color="#D1D5DB" />
                    <Text variant="bodyMedium" style={[styles.whiteBold, styles.trendNeutralText]}>{stats.titlesUnchanged}</Text>
                  </View>
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.whiteBold}>{fallbackValue || '-'}</Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient >
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  card: {
    borderRadius: 24, // Matches standard
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    elevation: 0,
    marginHorizontal: 0, // Ensure no extra margin
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
  },
  blurCircle: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ scale: 1 }],
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 8,
  },
  mainValueRow: {
    marginBottom: 24,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  neutralBg: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  positiveBg: {
    backgroundColor: 'rgba(110, 231, 183, 0.15)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  headerText: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  valueText: {
    color: 'white',
    fontWeight: 'bold',
  },
  changeText: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  labelSmall: {
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  whiteBold: {
    color: 'white',
    fontWeight: 'bold',
  },
  unitText: {
    color: 'rgba(255,255,255,0.6)',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  breadthRow: {
    flexDirection: 'row',
    gap: 16,
  },
  breadthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendUpText: {
    color: '#6EE7B7',
  },
  trendDownText: {
    color: '#F87171',
  },
  trendNeutralText: {
    color: '#D1D5DB',
  },
});

export default IndexHero;
