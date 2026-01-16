import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Path } from 'react-native-svg';

interface ExchangeCardProps {
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
  iconColor = '#F3BA2F'
}) => {
  const theme = useTheme();
  const accentGreen = (theme.colors as any).accentGreen || '#10B981';
  const accentRed = (theme.colors as any).accentRed || '#EF4444';
  const trendColor = isPositive ? accentGreen : accentRed;

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <View style={styles.header}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { borderColor: theme.colors.outline }]}>
            {iconUrl ? (
              <Image source={{ uri: iconUrl }} style={styles.iconImage} />
            ) : (
              <View style={[styles.symbolIcon, { backgroundColor: iconColor }]}>
                <Text style={styles.symbolText}>{iconSymbol}</Text>
              </View>
            )}
          </View>
          <View>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>{title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
            <View style={styles.valueContainer}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                {value}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, marginBottom: 4 }}>
                {currency}
              </Text>
            </View>
          </View>
        </View>

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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartContainer: {
    height: 48,
    width: '100%',
  }
});

export default ExchangeCard;
