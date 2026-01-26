import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { BolivarIcon } from '../ui/BolivarIcon';

interface RateCardProps {
  title: string;
  subtitle: string;
  value: string;
  changePercent: string;
  isPositive: boolean;
  iconName: string;
  iconBgColor?: string;
  iconColor?: string;
  onPress?: () => void;
}

const RateCard: React.FC<RateCardProps> = ({
  title,
  subtitle,
  value,
  changePercent,
  isPositive,
  iconName,
  iconBgColor,
  iconColor,
  onPress
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;

  // Determine if neutral (0.00% or explicitly marked as such via prop if we added one, 
  // but checking the string value is also a safe fallback for display logic)
  const isNeutral = changePercent.includes('0.00') || changePercent === '0%' || changePercent === '+0.00%' || changePercent === '0.00%';
  
  const trendColor = isNeutral 
    ? theme.colors.onSurfaceVariant 
    : (isPositive ? colors.success : colors.error);

  const trendIcon = isNeutral 
    ? "minus" 
    : (isPositive ? "trending-up" : "trending-down");
  
  // Default icon colors if not provided
  const finalIconBgColor = iconBgColor || colors.infoContainer;
  const finalIconColor = iconColor || colors.info;

  return (
    <TouchableRipple 
      onPress={onPress}
      style={{ marginBottom: 12, borderRadius: theme.roundness * 6 }}
      borderless
    >
      <Surface 
        elevation={0}
        style={[styles.card, { 
          backgroundColor: theme.colors.elevation.level1, 
          borderColor: theme.colors.outline,
          borderRadius: theme.roundness * 6
        }]}
      >
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { 
            backgroundColor: finalIconBgColor,
            borderRadius: theme.roundness * 4
          }]}>
            {iconName === 'Bs' ? (
              <BolivarIcon color={finalIconColor} size={24} />
            ) : (
              <MaterialCommunityIcons name={iconName} size={24} color={finalIconColor} />
            )}
          </View>
          <View>
            <Text variant="titleMedium" style={[styles.titleText, { color: theme.colors.onSurface }]}>{title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text variant="headlineSmall" style={[styles.valueText, { color: theme.colors.onSurface }]}>
            {value}
          </Text>
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons 
              name={trendIcon} 
              size={16} 
              color={trendColor} 
            />
            <Text variant="labelMedium" style={[styles.trendText, { color: trendColor }]}>
              {isNeutral ? '' : (isPositive ? '+' : '')}{changePercent}
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  titleText: {
    fontWeight: 'bold',
  },
  valueText: {
    fontWeight: 'bold',
  },
  trendText: {
    fontWeight: 'bold',
    marginLeft: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});

export default RateCard;
