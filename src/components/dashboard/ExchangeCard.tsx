import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';

import { useAppTheme } from '@/theme';
import { BolivarIcon } from '@/components/ui/BolivarIcon';

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
  onPress,
}) => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const isNeutral = changePercent === '0.00%';

  const trendColor = isNeutral ? 'rgba(255, 255, 255, 0.7)' : isPositive ? '#6EE7B7' : '#F87171';

  const getTrendColor = (percentStr?: string) => {
    if (!percentStr) return 'rgba(255, 255, 255, 0.7)';
    if (percentStr.includes('0.00') || percentStr === '0%' || percentStr === '+0.00%')
      return 'rgba(255, 255, 255, 0.7)';
    return percentStr.includes('-') ? '#F87171' : '#6EE7B7';
  };

  const buyColor = getTrendColor(buyChangePercent);
  const sellColor = getTrendColor(sellChangePercent);

  const trendIcon = isNeutral ? 'minus' : isPositive ? 'trending-up' : 'trending-down';

  const rippleStyle = [styles.ripple, { borderRadius: theme.roundness * 6 }];
  const cardGradientStyle = [
    styles.card,
    {
      borderRadius: theme.roundness * 6,
      borderColor: theme.colors.exchangeCardBorder,
    },
  ];
  const iconContainerStyle = [
    styles.iconContainer,
    {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: theme.roundness * 5,
    },
  ];
  const symbolIconStyle = [styles.symbolIcon, { backgroundColor: iconColor }];
  const trendBadgeStyle = [
    styles.trendBadge,
    {
      backgroundColor: isNeutral
        ? 'rgba(255,255,255,0.1)'
        : isPositive
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(239, 68, 68, 0.2)',
    },
  ];

  return (
    <Animated.View entering={FadeInRight.duration(500).delay(200)}>
      <TouchableRipple
        onPress={onPress}
        style={rippleStyle}
        borderless
        accessibilityRole="button"
        accessibilityLabel={`${title}. Valor actual ${value} ${currency}. ${isPositive ? 'Subiendo' : isNeutral ? 'Sin cambios' : 'Bajando'} ${changePercent}`}
        accessibilityHint="Ver detalles históricos y estadísticos"
      >
        <LinearGradient
          colors={['#0e4981', '#0b3a67', '#082f54']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cardGradientStyle}
        >
          {/* Background Blur Effect Circle */}
          <View style={styles.blurCircle} />

          <View style={[styles.header, styles.headerZIndex1]}>
            <View style={styles.leftContent}>
              <View style={iconContainerStyle}>
                {customIcon ? (
                  customIcon
                ) : iconUrl ? (
                  <FastImage source={{ uri: iconUrl }} style={styles.iconImage} />
                ) : iconName ? (
                  <View style={symbolIconStyle}>
                    {iconName === 'Bs' ? (
                      <BolivarIcon
                        color={iconTintColor || theme.colors.onPrimaryContainer}
                        size={24}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={iconName}
                        size={32}
                        color={iconTintColor || theme.colors.onPrimaryContainer}
                      />
                    )}
                  </View>
                ) : (
                  <View style={symbolIconStyle}>
                    <Text style={styles.symbolText}>{iconSymbol}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text variant="labelMedium" style={[styles.titleLabel, styles.titleText]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="bodySmall" style={styles.subtitleText}>
                    {subtitle}
                  </Text>
                ) : null}
                <View style={styles.valueContainer}>
                  {buyValue && sellValue ? (
                    <View style={[styles.dualContainer, isSmallScreen && styles.gap4]}>
                      {/* GENERAL (Average/Main) */}
                      <View style={styles.generalContainer}>
                        <Text
                          variant="labelSmall"
                          style={[styles.labelSmall, isSmallScreen && styles.fontSize8]}
                        >
                          GENERAL
                        </Text>
                        <View style={styles.rowBaseline}>
                          <Text
                            variant={isSmallScreen ? 'titleMedium' : 'titleLarge'}
                            style={styles.whiteBold}
                          >
                            {value}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[styles.currencyLabel, isSmallScreen && styles.fontSize10]}
                          >
                            {currency}
                          </Text>
                        </View>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.trendLabel,
                            { color: trendColor },
                            isSmallScreen && styles.fontSize8,
                          ]}
                        >
                          {changePercent}
                        </Text>
                      </View>

                      <View
                        style={[styles.divider, isSmallScreen ? styles.marginH4 : styles.marginH8]}
                      />

                      {/* COMPRA */}
                      <View style={styles.generalContainer}>
                        <Text
                          variant="labelSmall"
                          style={[styles.labelSmall, isSmallScreen && styles.fontSize8]}
                        >
                          COMPRA
                        </Text>
                        <View style={styles.rowBaseline}>
                          <Text
                            variant={isSmallScreen ? 'titleMedium' : 'titleLarge'}
                            style={styles.whiteBold}
                          >
                            {buyValue}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[styles.currencyLabel, isSmallScreen && styles.fontSize10]}
                          >
                            {currency}
                          </Text>
                        </View>
                        {buyChangePercent && (
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.trendLabel,
                              { color: getTrendColor(buyChangePercent) },
                              isSmallScreen && styles.fontSize8,
                            ]}
                          >
                            {buyChangePercent}
                          </Text>
                        )}
                      </View>

                      <View
                        style={[styles.divider, isSmallScreen ? styles.marginH4 : styles.marginH8]}
                      />

                      {/* VENTA */}
                      <View style={styles.generalContainer}>
                        <Text
                          variant="labelSmall"
                          style={[styles.labelSmall, isSmallScreen && styles.fontSize8]}
                        >
                          VENTA
                        </Text>
                        <View style={styles.rowBaseline}>
                          <Text
                            variant={isSmallScreen ? 'titleMedium' : 'titleLarge'}
                            style={styles.whiteBold}
                          >
                            {sellValue}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[styles.currencyLabel, isSmallScreen && styles.fontSize10]}
                          >
                            {currency}
                          </Text>
                        </View>
                        {sellChangePercent && (
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.trendLabel,
                              { color: getTrendColor(sellChangePercent) },
                              isSmallScreen && styles.fontSize8,
                            ]}
                          >
                            {sellChangePercent}
                          </Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.rowBaseline}>
                      <Text variant="headlineMedium" style={[styles.whiteBold, styles.valueText]}>
                        {value}
                      </Text>
                      <Text
                        variant="titleMedium"
                        style={[styles.currencyLabel, styles.currencyText]}
                      >
                        {currency}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.trendIndicatorContainer}>
            {/* Trend Indicator */}
            {!buyValue && (
              <View style={trendBadgeStyle}>
                <MaterialCommunityIcons name={trendIcon} size={16} color={trendColor} />
                <Text variant="labelMedium" style={[styles.trendText, { color: trendColor }]}>
                  {changePercent}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chartWrapper}>
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    elevation: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
    transform: [{ scale: 1.1 }],
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendIndicatorContainer: {
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 1,
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
  ripple: {
    marginBottom: 12,
  },
  headerZIndex1: {
    position: 'relative',
    zIndex: 1,
  },
  generalContainer: {
    flexShrink: 1,
  },
  labelSmall: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  fontSize8: {
    fontSize: 8,
  },
  fontSize10: {
    fontSize: 10,
  },
  rowBaseline: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  whiteBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  currencyLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 2,
  },
  trendLabel: {
    // color provided dynamically
  },
  chartWrapper: {
    height: 60,
    marginTop: 8,
    position: 'relative',
    zIndex: 1,
  },
  titleLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  marginH4: {
    marginHorizontal: 4,
  },
  marginH8: {
    marginHorizontal: 8,
  },
  gap4: {
    gap: 4,
  },
});

export default ExchangeCard;
