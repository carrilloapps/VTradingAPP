import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
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
  volume,
  opening,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0e4981', '#0b3a67', '#082f54']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
      >
        {/* Background Blur Effect Circle */}
        <View style={styles.blurCircle} />

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text variant="labelMedium" style={styles.headerText}>INDICE BURSÁTIL CARACAS</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="show-chart" size={18} color="white" />
            </View>
          </View>

          <View style={styles.mainValueRow}>
            <Text variant="displaySmall" style={styles.valueText}>{value}</Text>
            <View style={styles.changeBadge}>
              <MaterialIcons name="trending-up" size={16} color="#6EE7B7" />
              <Text variant="labelLarge" style={styles.changeText}>{changePercent}</Text>
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
              <Text variant="labelSmall" style={styles.labelSmall}>APERTURA</Text>
              <Text variant="bodyMedium" style={styles.whiteBold}>
                {opening} <Text variant="labelSmall" style={styles.unitText}>Bs</Text>
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
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
    backgroundColor: 'rgba(110, 231, 183, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
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
    color: '#6EE7B7',
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
});

export default IndexHero;
