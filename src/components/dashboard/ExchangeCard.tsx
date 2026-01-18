import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Path } from 'react-native-svg';

export interface ExchangeCardProps {
  title: string;
  subtitle: string;
  value: string;
  currency: string;
  changePercent: string;
  isPositive: boolean;
  chartPath: string;
  iconUrl?: string;
  iconSymbol?: string;
  iconColor?: string; // For symbol background
  buyValue?: string;
  sellValue?: string;
  buyChangePercent?: string;
  sellChangePercent?: string;
}

const ExchangeCard: React.FC<ExchangeCardProps> = ({
  title,
  subtitle,
  value,
  currency,
  changePercent,
  isPositive,
  chartPath,
  iconUrl,
  iconSymbol,
  iconColor = '#F3BA2F',
  buyValue,
  sellValue,
  buyChangePercent,
  sellChangePercent
}) => {
  const theme = useTheme();
  const colors = theme.colors as any;
  
  // Determine if neutral (0.00% or explicitly marked as such via prop if we added one, 
  // but checking the string value is also a safe fallback for display logic)
  const isNeutral = changePercent === '' || changePercent.includes('0.00') || changePercent === '0%' || changePercent === '+0.00%' || changePercent === '0.00%';
  
  const trendColor = isNeutral 
    ? theme.colors.onSurfaceVariant 
    : (isPositive ? colors.success : colors.error);

  const trendIcon = isNeutral 
    ? "remove" 
    : (isPositive ? "trending-up" : "trending-down");

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <View style={styles.header}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.elevation.level1 }]}>
            {iconUrl ? (
              <Image source={{ uri: iconUrl }} style={styles.iconImage} />
            ) : (
              <View style={[styles.symbolIcon, { backgroundColor: iconColor }]}>
                <Text style={styles.symbolText}>{iconSymbol}</Text>
              </View>
            )}
          </View>
          <View>
            <Text variant="titleMedium" style={[{ color: theme.colors.onSurface }, styles.titleText]}>{title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
            <View style={styles.valueContainer}>
              {buyValue && sellValue ? (
                  <View style={styles.dualContainer}>
                      <View>
                          <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 2}}>COMPRA</Text>
                          <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                            <Text variant="titleLarge" style={[{ color: theme.colors.onSurface, fontWeight: 'bold' }]}>{buyValue}</Text>
                            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginLeft: 4}}>{currency}</Text>
                          </View>
                          {buyChangePercent && (
                              <Text variant="labelSmall" style={{color: buyChangePercent.includes('-') ? colors.error : colors.success}}>
                                  {buyChangePercent}
                              </Text>
                          )}
                      </View>
                      <View style={[styles.separator, {backgroundColor: theme.colors.outlineVariant}]} />
                      <View>
                          <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 2}}>VENTA</Text>
                          <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                            <Text variant="titleLarge" style={[{ color: theme.colors.onSurface, fontWeight: 'bold' }]}>{sellValue}</Text>
                            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginLeft: 4}}>{currency}</Text>
                          </View>
                           {sellChangePercent && (
                              <Text variant="labelSmall" style={{color: sellChangePercent.includes('-') ? colors.error : colors.success}}>
                                  {sellChangePercent}
                              </Text>
                          )}
                      </View>
                  </View>
              ) : (
                <>
                  <Text variant="headlineSmall" style={[{ color: theme.colors.onSurface }, styles.valueText]}>
                    {value}
                  </Text>
                  <Text variant="labelMedium" style={[{ color: theme.colors.onSurfaceVariant }, styles.currencyText]}>
                    {currency}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.trendContainer}>
          {changePercent !== '' && (
          <MaterialIcons 
            name={trendIcon} 
            size={16} 
            color={trendColor} 
          />
          )}
          <Text variant="labelMedium" style={[{ color: trendColor }, styles.trendText]}>
            {isNeutral ? '' : (isPositive ? '+' : '')}{changePercent}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg height="40" width="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
          <Path
            d={chartPath}
            fill="none"
            stroke={trendColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
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
    elevation: 0, // Remove default paper shadow for flat look
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleText: {
    fontWeight: 'bold',
  },
  valueText: {
    fontWeight: 'bold',
  },
  currencyText: {
    marginLeft: 4,
    marginBottom: 4,
  },
  trendText: {
    fontWeight: 'bold',
    marginLeft: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
    transform: [{ scale: 1.1 }], // scale-110 from tailwind
  },
  symbolIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    fontWeight: '900',
    color: 'black',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontWeight: '900',
    lineHeight: 32,
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartContainer: {
    height: 48,
    width: '100%',
  },
  dualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  separator: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  }
});

export default ExchangeCard;
