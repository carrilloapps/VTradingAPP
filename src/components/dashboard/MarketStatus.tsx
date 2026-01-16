import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface MarketStatusProps {
  isOpen: boolean;
  updatedAt: string;
}

const MarketStatus: React.FC<MarketStatusProps> = ({ isOpen, updatedAt }) => {
  const theme = useTheme();
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';

  return (
    <View style={styles.container}>
      <View style={[styles.statusBadge, { 
        backgroundColor: `${accentGreen}1A`, // 10% opacity
        borderColor: `${accentGreen}33` // 20% opacity
      }]}>
        <View style={[styles.dot, { backgroundColor: accentGreen }]} />
        <Text style={[styles.statusText, { color: accentGreen }]}>
          {isOpen ? 'MERCADO ABIERTO' : 'MERCADO CERRADO'}
        </Text>
      </View>
      
      <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
        Actualizado: {updatedAt}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  }
});

export default MarketStatus;
