import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../theme/theme';
import { BolivarIcon } from '../ui/BolivarIcon';

export interface ExchangeCardProps {
  title: string;
  subtitle: string;
  value: string;
  currency: string;
  changePercent: string;
  isPositive: boolean;
  chartPath: string;
  iconUrl?: string;
  iconName?: string;
  iconSymbol?: string;
  iconColor?: string; // For symbol background
  iconTintColor?: string; // For symbol foreground/tint
  customIcon?: React.ReactNode;
  buyValue?: string;
  sellValue?: string;
  buyChangePercent?: string;
  sellChangePercent?: string;
  buyChartPath?: string;
  sellChartPath?: string;
  code?: string;
  onPress?: () => void;
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
  iconName,
  iconSymbol,
  iconColor = '#F3BA2F',
  iconTintColor,
  customIcon,
  buyValue,
  sellValue,
  buyChangePercent,
  sellChangePercent,
  buyChartPath,
  sellChartPath,
  onPress
}) => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTinyScreen = width < 350;

  const isNeutral = changePercent === '0.00%';
  
  const trendColor = isNeutral 
    ? 'rgba(255, 255, 255, 0.7)' 
    : (isPositive ? '#6EE7B7' : '#F87171');

  const getTrendColor = (percentStr?: string) => {
      if (!percentStr) return 'rgba(255, 255, 255, 0.7)';
      if (percentStr.includes('0.00') || percentStr === '0%' || percentStr === '+0.00%') return 'rgba(255, 255, 255, 0.7)';
      return percentStr.includes('-') ? '#F87171' : '#6EE7B7';
  };

  const buyColor = getTrendColor(buyChangePercent);
  const sellColor = getTrendColor(sellChangePercent);

  const trendIcon = isNeutral 
    ? "minus" 
    : (isPositive ? "trending-up" : "trending-down");

  return (
    <TouchableRipple 
      onPress={onPress} 
      style={{ marginBottom: 12, borderRadius: theme.roundness * 6 }}
      borderless
    >
      <LinearGradient
        colors={['#0e4981', '#0b3a67', '#082f54']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { 
          borderRadius: theme.roundness * 6,
          borderColor: theme.colors.exchangeCardBorder,
          borderWidth: 1,
          overflow: 'hidden',
          position: 'relative'
        }]}
      >
        {/* Background Blur Effect Circle */}
        <View style={styles.blurCircle} />
        
        <View style={[styles.header, { position: 'relative', zIndex: 1 }]}>
          <View style={styles.leftContent}>
            <View style={[styles.iconContainer, { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: theme.roundness * 5 }]}>
              {customIcon ? (
                customIcon
              ) : iconUrl ? (
                <Image source={{ uri: iconUrl }} style={styles.iconImage} />
              ) : iconName ? (
                <View style={[styles.symbolIcon, { backgroundColor: iconColor }]}>
                  {iconName === 'Bs' ? (
                       <BolivarIcon color={iconTintColor || theme.colors.onPrimaryContainer} size={24} />
                  ) : (
                    <MaterialCommunityIcons 
                      name={iconName} size={32} color={iconTintColor || theme.colors.onPrimaryContainer} />
                  )}
                </View>
              ) : (
                <View style={[styles.symbolIcon, { backgroundColor: iconColor }]}>
                  <Text style={styles.symbolText}>{iconSymbol}</Text>
                </View>
              )}
            </View>
            <View>
              <Text variant="labelMedium" style={[{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }, styles.titleText]}>{title}</Text>
              {subtitle ? <Text variant="bodySmall" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{subtitle}</Text> : null}
              <View style={styles.valueContainer}>
                {buyValue && sellValue ? (
                    <View style={[styles.dualContainer, isSmallScreen && { gap: 4 }]}>
                        {/* GENERAL (Average/Main) */}
                        <View style={{ flexShrink: 1 }}>
                            <Text variant="labelSmall" style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? 8 : 10, marginBottom: 2}}>GENERAL</Text>
                            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                              <Text variant={isSmallScreen ? "titleMedium" : "titleLarge"} style={[{ color: '#FFFFFF', fontWeight: 'bold' }]}>{value}</Text>
                              <Text variant="bodySmall" style={{color: 'rgba(255, 255, 255, 0.7)', marginLeft: 2, fontSize: isSmallScreen ? 10 : 12}}>{currency}</Text>
                            </View>
                            <Text variant="labelSmall" style={{color: trendColor, fontSize: isSmallScreen ? 8 : 10}}>
                                {changePercent}
                            </Text>
                        </View>
  
                        <View style={[styles.divider, { marginHorizontal: isSmallScreen ? 4 : 8 }]} />
  
                        {/* COMPRA */}
                        <View style={{ flexShrink: 1 }}>
                            <Text variant="labelSmall" style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? 8 : 10, marginBottom: 2}}>COMPRA</Text>
                            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                              <Text variant={isSmallScreen ? "titleMedium" : "titleLarge"} style={[{ color: '#FFFFFF', fontWeight: 'bold' }]}>{buyValue}</Text>
                              <Text variant="bodySmall" style={{color: 'rgba(255, 255, 255, 0.7)', marginLeft: 2, fontSize: isSmallScreen ? 10 : 12}}>{currency}</Text>
                            </View>
                            {buyChangePercent && (
                                <Text variant="labelSmall" style={{color: buyChangePercent.includes('-') ? '#F87171' : buyChangePercent.includes('0.00') ? 'rgba(255, 255, 255, 0.7)' : '#6EE7B7', fontSize: isSmallScreen ? 8 : 10}}>
                                    {buyChangePercent}
                                </Text>
                            )}
                        </View>
  
                        <View style={[styles.divider, { marginHorizontal: isSmallScreen ? 4 : 8 }]} />
  
                        {/* VENTA */}
                        <View style={{ flexShrink: 1 }}>
                            <Text variant="labelSmall" style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? 8 : 10, marginBottom: 2}}>VENTA</Text>
                            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                              <Text variant={isSmallScreen ? "titleMedium" : "titleLarge"} style={[{ color: '#FFFFFF', fontWeight: 'bold' }]}>{sellValue}</Text>
                              <Text variant="bodySmall" style={{color: 'rgba(255, 255, 255, 0.7)', marginLeft: 2, fontSize: isSmallScreen ? 10 : 12}}>{currency}</Text>
                            </View>
                            {sellChangePercent && (
                                <Text variant="labelSmall" style={{color: sellChangePercent.includes('-') ? '#F87171' : sellChangePercent.includes('0.00') ? 'rgba(255, 255, 255, 0.7)' : '#6EE7B7', fontSize: isSmallScreen ? 8 : 10}}>
                                    {sellChangePercent}
                                </Text>
                            )}
                        </View>
                    </View>
                ) : (
                  <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                    <Text variant="headlineMedium" style={[styles.valueText, { color: '#FFFFFF' }]}>{value}</Text>
                    <Text variant="titleMedium" style={[styles.currencyText, { color: 'rgba(255, 255, 255, 0.7)' }]}>{currency}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={{alignItems: 'flex-end', position: 'relative', zIndex: 1}}>
              {/* Trend Indicator */}
              {!buyValue && (
                  <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: isNeutral ? 'rgba(255,255,255,0.1)' : (isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12}}>
                      <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
                      <Text variant="labelMedium" style={[styles.trendText, { color: trendColor }]}>{changePercent}</Text>
                  </View>
              )}
          </View>
        </View>
  
        <View style={{ height: 60, marginTop: 8, position: 'relative', zIndex: 1 }}>
          <Svg height="100%" width="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
            {buyChartPath && sellChartPath ? (
              <>
                {/* Average Line */}
                <Path
                  d={chartPath}
                  fill="none"
                  stroke={trendColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.6}
                  strokeDasharray="4, 4"
                />
                {/* Buy Line */}
                <Path
                  d={buyChartPath}
                  fill="none"
                  stroke={buyColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
                {/* Sell Line */}
                <Path
                  d={sellChartPath}
                  fill="none"
                  stroke={sellColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              </>
            ) : (
              <Path
                d={chartPath}
                fill="none"
                stroke={trendColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      </LinearGradient>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align items to center vertically
    marginBottom: 4,
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
    width: 40,
    height: 40,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
    transform: [{ scale: 1.1 }], // scale-110 from tailwind
  },
  symbolIcon: {
    width: 40,
    height: 40,
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
    marginTop: 0,
  },
  separator: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 0,
  },
});

export default ExchangeCard;
