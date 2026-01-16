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
  const theme = useTheme();
  
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
            <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontWeight: 'bold' }}>INDICE BURSÁTIL CARACAS</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="show-chart" size={18} color="white" />
            </View>
          </View>

          <View style={styles.mainValueRow}>
            <Text variant="displaySmall" style={{ color: 'white', fontWeight: 'bold' }}>{value}</Text>
            <View style={styles.changeBadge}>
              <MaterialIcons name="trending-up" size={16} color="#6EE7B7" />
              <Text variant="labelLarge" style={{ color: '#6EE7B7', fontWeight: 'bold', marginLeft: 4 }}>{changePercent}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>VOLUMEN</Text>
              <Text variant="bodyMedium" style={{ color: 'white', fontWeight: 'bold' }}>
                {volume} <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.6)' }}>VES</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>APERTURA</Text>
              <Text variant="bodyMedium" style={{ color: 'white', fontWeight: 'bold' }}>{opening}</Text>
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
});

export default IndexHero;
