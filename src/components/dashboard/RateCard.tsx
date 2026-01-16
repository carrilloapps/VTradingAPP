import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface RateCardProps {
  title: string;
  subtitle: string;
  value: string;
  changePercent: string;
  isPositive: boolean;
  iconName: string;
  iconBgColor?: string;
  iconColor?: string;
}

const RateCard: React.FC<RateCardProps> = ({
  title,
  subtitle,
  value,
  changePercent,
  isPositive,
  iconName,
  iconBgColor,
  iconColor
}) => {
  const theme = useTheme();
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';
  const trendColor = isPositive ? accentGreen : accentRed;
  
  // Default icon colors if not provided
  const finalIconBgColor = iconBgColor || (theme.dark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)');
  const finalIconColor = iconColor || theme.colors.primary;

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: finalIconBgColor }]}>
          <MaterialIcons name={iconName} size={24} color={finalIconColor} />
        </View>
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>{title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
          {value}
        </Text>
        <View style={styles.trendContainer}>
          <MaterialIcons 
            name={isPositive ? "trending-up" : "trending-down"} 
            size={16} 
            color={trendColor} 
          />
          <Text variant="labelMedium" style={{ color: trendColor, fontWeight: 'bold', marginLeft: 2 }}>
            {isPositive ? '+' : ''}{changePercent}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default RateCard;
