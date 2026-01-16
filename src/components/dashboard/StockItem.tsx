import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface StockItemProps {
  symbol: string;
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
  volume: string;
}

const StockItem: React.FC<StockItemProps> = ({
  symbol,
  name,
  value,
  change,
  isPositive,
  volume
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const trendColor = isPositive ? colors.success : colors.error;

  return (
    <TouchableOpacity style={[styles.container, { borderBottomColor: theme.colors.outline }]}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
          <MaterialIcons name="show-chart" size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text variant="titleMedium" style={[styles.symbol, { color: theme.colors.onSurface }]}>{symbol}</Text>
          <Text variant="bodySmall" style={[styles.name, { color: theme.colors.onSurfaceVariant }]}>{name}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text variant="titleMedium" style={[styles.value, { color: theme.colors.onSurface }]}>{value}</Text>
        <View style={styles.trendContainer}>
          <Text variant="labelSmall" style={[styles.change, { color: trendColor }]}>
            {isPositive ? '+' : ''}{change}
          </Text>
          <Text variant="labelSmall" style={[styles.volume, { color: theme.colors.onSurfaceVariant }]}>
            Vol: {volume}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontWeight: '900',
    fontSize: 14,
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  value: {
    fontWeight: '700',
    fontSize: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontSize: 11,
    fontWeight: '700',
  },
  volume: {
    fontSize: 11,
  }
});

export default StockItem;
