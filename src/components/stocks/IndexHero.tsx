import React from 'react';
import { View, StyleSheet, ImageStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface IndexHeroProps {
  value: string;
  changePercent: string;
  isPositive: boolean;
  volume: string;
  opening: string;
}

const IndexHero: React.FC<IndexHeroProps> = ({
  value,
  changePercent,
  isPositive,
  volume,
  opening,
}) => {
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
            <Text style={styles.headerTitle}>INDICE BURSÁTIL CARACAS</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="show-chart" size={18} color="white" />
            </View>
          </View>

          <View style={styles.mainValueRow}>
            <Text style={styles.valueText}>{value}</Text>
            <View style={styles.changeBadge}>
              <MaterialIcons name="trending-up" size={14} color="#6EE7B7" />
              <Text style={styles.changeText}>{changePercent}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>VOLUMEN</Text>
              <Text style={styles.statValue}>
                {volume} <Text style={styles.currencyText}>VES</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statLabel}>APERTURA</Text>
              <Text style={styles.statValue}>{opening}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0e4981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(219, 234, 254, 0.7)', // blue-100/70
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 6,
    borderRadius: 8,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  valueText: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  changeText: {
    color: '#6EE7B7', // emerald-300
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(191, 219, 254, 0.5)', // blue-200/50
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  currencyText: {
    fontSize: 10,
    opacity: 0.7,
  },
});

export default IndexHero;
