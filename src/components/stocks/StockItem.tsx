import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  initials: string;
  color: string; // 'emerald' | 'blue' | 'orange' | 'amber' | 'indigo'
}

const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  emerald: { bg: '#ECFDF5', text: '#047857', darkBg: 'rgba(16, 185, 129, 0.1)', darkText: '#34D399' },
  blue: { bg: '#EFF6FF', text: '#1D4ED8', darkBg: 'rgba(59, 130, 246, 0.1)', darkText: '#60A5FA' },
  orange: { bg: '#FFF7ED', text: '#C2410C', darkBg: 'rgba(249, 115, 22, 0.1)', darkText: '#FB923C' },
  amber: { bg: '#FFFBEB', text: '#B45309', darkBg: 'rgba(245, 158, 11, 0.1)', darkText: '#FBBF24' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', darkBg: 'rgba(99, 102, 241, 0.1)', darkText: '#818CF8' },
};

const StockItem: React.FC<StockData> = ({
  symbol,
  name,
  price,
  changePercent,
  initials,
  color,
}) => {
  const theme = useTheme();
  const colors = colorMap[color] || colorMap.emerald;
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  
  // Format price
  const formattedPrice = price.toLocaleString('es-VE', { minimumFractionDigits: 4 });
  const formattedChange = (changePercent > 0 ? '+' : '') + changePercent.toFixed(2) + '%';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
        }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[
          styles.iconBox, 
          { backgroundColor: theme.dark ? colors.darkBg : colors.bg }
        ]}>
          <Text style={[
            styles.initials, 
            { color: theme.dark ? colors.darkText : colors.text }
          ]}>
            {initials}
          </Text>
        </View>
        <View>
          <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.symbol, { color: theme.colors.onSurfaceVariant }]}>
            {symbol}
          </Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text style={[styles.price, { color: theme.colors.onSurface }]}>
          {formattedPrice}
        </Text>
        <View style={[
          styles.changeBadge,
          !isPositive && !isNegative && styles.neutralBadge,
          { backgroundColor: (!isPositive && !isNegative) ? (theme.dark ? 'rgba(255,255,255,0.05)' : '#F3F4F6') : undefined }
        ]}>
          {isPositive ? (
            <MaterialIcons name="trending-up" size={12} color="#10B981" />
          ) : isNegative ? (
            <MaterialIcons name="trending-down" size={12} color="#EF4444" />
          ) : null}
          <Text style={[
            styles.changeText,
            { color: isPositive ? '#10B981' : isNegative ? '#EF4444' : theme.colors.onSurfaceVariant }
          ]}>
            {formattedChange}
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 11,
    fontWeight: '800',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  symbol: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
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
