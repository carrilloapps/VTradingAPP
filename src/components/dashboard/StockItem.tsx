import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface StockItemProps {
  symbol: string;
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName?: string;
}

const StockItem: React.FC<StockItemProps> = ({
  symbol,
  name,
  value,
  change,
  isPositive,
  iconName = 'business'
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  const trendColor = isPositive ? colors.success : colors.error;

  const themeStyles = React.useMemo(() => ({
    container: {
      backgroundColor: theme.colors.elevation.level1,
    },
    iconContainer: {
      backgroundColor: theme.colors.elevation.level3,
    },
    textContainer: {
      flex: 1,
    },
    name: {
      color: theme.colors.onSurface,
    },
    symbol: {
      color: theme.colors.onSurfaceVariant,
    },
    value: {
      color: theme.colors.onSurface,
    },
    change: {
      color: trendColor,
    },
  }), [theme, trendColor]);

  return (
    <TouchableOpacity style={[styles.container, themeStyles.container]}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, themeStyles.iconContainer]}>
          <MaterialIcons name={iconName} size={24} color={theme.colors.primary} />
        </View>
        <View style={themeStyles.textContainer}>
          <Text variant="titleMedium" style={[styles.name, themeStyles.name]} numberOfLines={1}>{name}</Text>
          <Text variant="bodySmall" style={[styles.symbol, themeStyles.symbol]}>{symbol}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text variant="titleMedium" style={[styles.value, themeStyles.value]}>{value}</Text>
        <Text variant="labelSmall" style={[styles.change, themeStyles.change]}>
            {isPositive ? '+' : ''}{change}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 24, // High border radius as per screenshot
    // No border bottom
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16, // Soft square
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  symbol: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  value: {
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 2,
  },
  change: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StockItem;
