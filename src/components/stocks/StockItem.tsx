import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/theme';

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  initials?: string;
  color?: string; // 'emerald' | 'blue' | 'orange' | 'amber' | 'indigo'
  iconUrl?: string; // Optional icon URL
  value?: string; // Optional pre-formatted value for dashboard compatibility
  change?: string; // Optional pre-formatted change for dashboard compatibility
  isPositive?: boolean; // Optional for dashboard compatibility
  iconName?: string; // Optional for dashboard compatibility
  onPress?: (stock: StockData) => void; // Optional press handler
}

const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  emerald: { bg: '#ECFDF5', text: '#047857', darkBg: 'rgba(16, 185, 129, 0.1)', darkText: '#34D399' },
  blue: { bg: '#EFF6FF', text: '#1D4ED8', darkBg: 'rgba(59, 130, 246, 0.1)', darkText: '#60A5FA' },
  orange: { bg: '#FFF7ED', text: '#C2410C', darkBg: 'rgba(249, 115, 22, 0.1)', darkText: '#FB923C' },
  amber: { bg: '#FFFBEB', text: '#B45309', darkBg: 'rgba(245, 158, 11, 0.1)', darkText: '#FBBF24' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', darkBg: 'rgba(99, 102, 241, 0.1)', darkText: '#818CF8' },
};

const StockItem: React.FC<StockData> = ({
  id,
  symbol,
  name,
  price,
  changePercent,
  initials,
  color,
  iconUrl,
  value,
  change,
  isPositive: propIsPositive,
  onPress,
}) => {
  const theme = useAppTheme();
  const colors = colorMap[color || 'emerald'] || colorMap.emerald;

  const isPositive = propIsPositive !== undefined ? propIsPositive : (changePercent > 0);
  const isNegative = propIsPositive !== undefined ? !propIsPositive : (changePercent < 0);
  const isNeutral = !isPositive && !isNegative;

  // Format price - Use prop 'value' if available (dashboard), otherwise format 'price'
  const formattedPrice = value || `${price.toLocaleString('es-VE', { minimumFractionDigits: 4 })} Bs`;

  let formattedChange = change;
  if (!formattedChange) {
    if (isNeutral) {
      formattedChange = '= ' + Math.abs(changePercent).toFixed(2) + '%';
    } else {
      formattedChange = (isPositive ? '+' : '') + changePercent.toFixed(2) + '%';
    }
  } else if (isNeutral && !change?.startsWith('=')) {
    // Ensure dashboard formatted string has = if neutral
    // This is tricky if 'change' is pre-formatted as "0.00%". 
    // We'll trust the logic below for rendering style, but text might need adjustment if passed from dashboard.
    if (change === '0.00%' || change === '0,00%') {
      formattedChange = '= ' + change;
    }
  }

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
      // Flat style with border, no elevation
      elevation: 0,
    }
  ];

  const changeColor = isPositive ? theme.colors.trendUp : isNegative ? theme.colors.trendDown : theme.colors.onSurfaceVariant;

  const badgeBackgroundColor = (!isPositive && !isNegative)
    ? (theme.dark ? 'rgba(255,255,255,0.05)' : '#F3F4F6')
    : undefined;

  const handlePress = () => {
    if (onPress) {
      onPress({
        id,
        symbol,
        name,
        price,
        changePercent,
        initials,
        color,
        iconUrl,
        value,
        change,
        isPositive: propIsPositive,
      });
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <TouchableOpacity
        style={containerStyle}
        activeOpacity={0.7}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${symbol}, valor ${formattedPrice}. ${isPositive ? 'Subiendo' : isNegative ? 'Bajando' : 'Estable'} ${formattedChange}`}
        accessibilityHint={`Ver detalles de ${name}`}
      >
        <View style={styles.leftContent}>
          <View style={styles.iconBox}>
            {iconUrl ? (
              <Image
                source={{ uri: iconUrl }}
                style={styles.iconImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.initials, { color: theme.dark ? colors.darkText : colors.text }]}>
                {initials || symbol.substring(0, 3)}
              </Text>
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.primaryText, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {symbol}
            </Text>
            <Text style={[styles.secondaryText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={[styles.price, { color: theme.colors.onSurface }]}>
            {formattedPrice}
          </Text>
          <View style={[styles.changeBadge, !isPositive && !isNegative && styles.neutralBadge, { backgroundColor: badgeBackgroundColor }]}>
            {isPositive ? (
              <MaterialCommunityIcons name="trending-up" size={12} color={theme.colors.trendUp} />
            ) : isNegative ? (
              <MaterialCommunityIcons name="trending-down" size={12} color={theme.colors.trendDown} />
            ) : null}
            <Text style={[styles.changeText, { color: changeColor }]}>
              {formattedChange}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24, // Matches theme.roundness * 6
    borderWidth: 1,
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    marginRight: 16, // Ensure space between text and price
  },
  textContainer: {
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure image respects radius
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 11,
    fontWeight: '800',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'flex-end',
    minWidth: 80, // Prevent layout shift on small price changes
    gap: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  neutralBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default StockItem;
