import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { CurrencyRate } from '../../services/CurrencyService';
import { BolivarIcon } from '../ui/BolivarIcon';
import FastImage from 'react-native-fast-image';

interface CurrencyShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  rate: CurrencyRate;
  lastUpdated: string;
  isPremium?: boolean;
  aspectRatio?: '1:1' | '16:9';
  status?: string;
}

const CurrencyShareGraphic: React.FC<CurrencyShareGraphicProps> = ({
  viewShotRef,
  rate,
  lastUpdated,
  isPremium = false,
  aspectRatio = '1:1',
  status = 'ACTIVO',
}) => {
  const theme = useTheme();

  const isPositive = (rate.changePercent || 0) > 0;
  const isNegative = (rate.changePercent || 0) < 0;
  const isNeutral = !rate.changePercent || rate.changePercent === 0;

  const trendColor = isPositive
    ? (theme.colors as any).success || '#6EE7B7'
    : isNegative
      ? (theme.colors as any).error || '#F87171'
      : theme.colors.onSurfaceVariant;

  const trendIcon = isPositive
    ? 'trending-up'
    : isNegative
      ? 'trending-down'
      : 'minus';

  const isVertical = aspectRatio === '16:9';

  const spread =
    rate.buyValue && rate.sellValue
      ? Math.abs(((rate.sellValue - rate.buyValue) / rate.buyValue) * 100)
      : null;

  // Dynamic sizes based on aspect ratio
  const platformIconSize = 24;
  const platformTextSize = 12;
  const logoWidth = isVertical ? 210 : 150;
  const logoHeight = isVertical ? 54 : 40;
  const freeBadgeTextSize = isVertical ? 10 : 7;
  const urlTextSize = isVertical ? 18 : 13;
  const dateIconSize = 18;
  const dateTextSize = 14;
  const iconContainerSize = isVertical ? 72 : 56;
  const iconSize = isVertical ? 40 : 32;
  const symbolTextSize = isVertical ? 32 : 24;
  const nameTextSize = isVertical ? 20 : 14;
  const mainValueSize = isVertical ? 86 : 64;
  const currencySize = isVertical ? 28 : 22;
  const trendIconSize = isVertical ? 18 : 14;
  const trendTextSize = isVertical ? 15 : 12;
  const statLabelSize = isVertical ? 13 : 9;
  const statValueSize = isVertical ? 24 : 16;
  const statCurrencySize = isVertical ? 14 : 10;
  const footerIconSize = 22;
  const footerTextSize = 12;

  // Computed Styles
  const templateStyle = [
    styles.shareTemplate,
    isVertical ? styles.shareTemplateVertical : styles.shareTemplateSquare,
    { backgroundColor: theme.dark ? '#051911' : '#F0FDF4' },
  ];

  const glowStyle = [
    styles.templateGlow,
    { backgroundColor: theme.colors.primary, opacity: 0.05 },
  ];
  const badgeStyle = [
    styles.platformBadge,
    { backgroundColor: theme.colors.surfaceVariant },
  ];

  const logoStyle = [
    styles.templateMainLogo,
    {
      tintColor: theme.dark ? undefined : theme.colors.primary,
      width: logoWidth,
      height: logoHeight,
    },
  ];

  const freeBadgeStyle = [
    styles.freeBadge,
    { backgroundColor: (theme.colors as any).error || '#FF5252' },
  ];
  const freeBadgeTextStyle = [
    styles.freeBadgeText,
    { fontSize: freeBadgeTextSize },
  ];

  const urlBadgeStyle = [
    styles.templateUrlBadge,
    { backgroundColor: theme.colors.primary + '15', marginBottom: 8 },
  ];
  const urlTextStyle = [
    styles.templateUrlText,
    { color: theme.colors.primary, fontSize: urlTextSize },
  ];

  const dateTextStyle = [
    styles.templateDate,
    { color: theme.colors.onSurfaceVariant, fontSize: dateTextSize },
  ];

  const contentStyle = [
    styles.templateContent,
    isVertical && ({ gap: 40 } as const),
  ];

  const cardStyle = [
    styles.mainCard,
    isVertical && styles.mainCardVertical,
    {
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(0,0,0,0.02)',
      borderColor: theme.colors.outlineVariant,
    },
  ];

  const iconContainerStyle = [
    styles.stockIconContainer,
    {
      backgroundColor: theme.colors.primary + '20',
      width: iconContainerSize,
      height: iconContainerSize,
    },
  ];

  const symbolTextStyle = [
    styles.stockSymbolLabel,
    { color: theme.colors.onSurface, fontSize: symbolTextSize },
  ];
  const nameTextStyle = [
    styles.stockNameLabel,
    { color: theme.colors.onSurfaceVariant, fontSize: nameTextSize },
  ];

  const mainValueTextStyle = [
    styles.mainValueText,
    { fontSize: mainValueSize, color: theme.colors.onSurface },
  ];
  const labelColumnStyle = [styles.labelColumn, { height: mainValueSize }];
  const currencyTextStyle = [
    styles.currencyText,
    { color: theme.colors.onSurfaceVariant, fontSize: currencySize },
  ];

  const trendBadgeStyle = [
    styles.trendBadge,
    { backgroundColor: trendColor + '15' },
  ];
  const trendPercentTextStyle = [
    styles.trendPercentText,
    { color: trendColor, fontSize: trendTextSize },
  ];

  const statLabelStyle = [styles.statLabel, { fontSize: statLabelSize }];
  const statValueStyle = [styles.statValue, { fontSize: statValueSize }];
  const statCurrencyStyle = [
    styles.statCurrency,
    { fontSize: statCurrencySize },
  ];

  const footerTextStyle = [
    styles.templateFooterText,
    { color: theme.colors.primary, fontSize: footerTextSize },
  ];

  const platformTextHeaderStyle = (size: number) => [
    styles.platformText,
    { color: theme.colors.onSurfaceVariant, fontSize: size },
  ];

  return (
    <View style={styles.hiddenTemplate} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
        <LinearGradient
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']}
          style={templateStyle}
        >
          {/* Decorative Elements */}
          <View style={glowStyle} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface style={badgeStyle} elevation={1}>
              <Icon
                source="google-play"
                size={platformIconSize}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={platformTextHeaderStyle(platformTextSize)}>
                Android
              </Text>
            </Surface>
            <View style={styles.flex1} />
            <Surface style={badgeStyle} elevation={1}>
              <Icon
                source="apple"
                size={platformIconSize}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={platformTextHeaderStyle(platformTextSize)}>iOS</Text>
            </Surface>
          </View>

          {/* Header */}
          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <FastImage
                source={require('../../assets/images/logotipo.png')}
                style={logoStyle}
                resizeMode={FastImage.resizeMode.contain}
              />
              {!isPremium && (
                <Surface style={freeBadgeStyle} elevation={2}>
                  <Text style={freeBadgeTextStyle}>FREE</Text>
                </Surface>
              )}
            </View>
            <View style={urlBadgeStyle}>
              <Text style={urlTextStyle}>vtrading.app</Text>
            </View>
            <View style={styles.templateDateBox}>
              <Icon
                source="calendar-clock"
                size={dateIconSize}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={dateTextStyle}>
                {new Date().toLocaleDateString('es-VE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {lastUpdated}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={contentStyle}>
            <Surface style={cardStyle} elevation={0}>
              {/* Currency Identification */}
              <View style={styles.stockIdentityRow}>
                <View style={iconContainerStyle}>
                  {rate.iconName === 'Bs' ? (
                    <BolivarIcon size={iconSize} color={theme.colors.primary} />
                  ) : (
                    <Icon
                      source={rate.iconName || 'currency-usd'}
                      size={iconSize}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
                <View>
                  <Text style={symbolTextStyle}>{rate.code} / VES</Text>
                  <Text style={nameTextStyle}>{rate.name}</Text>
                </View>
              </View>

              <View style={styles.priceSection}>
                <View style={styles.valueRow}>
                  <Text style={mainValueTextStyle}>
                    {rate.value.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <View style={labelColumnStyle}>
                    <Text style={currencyTextStyle}>Bs.</Text>
                    <View style={trendBadgeStyle}>
                      <Icon
                        source={trendIcon}
                        size={trendIconSize}
                        color={trendColor}
                      />
                      <Text style={trendPercentTextStyle}>
                        {isNeutral ? '' : isPositive ? '+' : ''}
                        {(rate.changePercent || 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Extra Stats for vertical format */}
              {isVertical && (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={statLabelStyle}>COMPRA</Text>
                    <Text style={statValueStyle}>
                      {rate.buyValue
                        ? rate.buyValue.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                          })
                        : '--'}{' '}
                      <Text style={statCurrencyStyle}>Bs.</Text>
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={statLabelStyle}>VENTA</Text>
                    <Text style={statValueStyle}>
                      {rate.sellValue
                        ? rate.sellValue.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                          })
                        : '--'}{' '}
                      <Text style={statCurrencyStyle}>Bs.</Text>
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={statLabelStyle}>SPREAD / BRECHA</Text>
                    <Text style={statValueStyle}>
                      {spread !== null ? `${spread.toFixed(2)}%` : '--'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={statLabelStyle}>ESTADO MERCADO</Text>
                    <Text style={statValueStyle}>{status}</Text>
                  </View>
                </View>
              )}
            </Surface>
          </View>

          {/* Footer */}
          <View style={styles.templateFooter}>
            <LinearGradient
              colors={[
                theme.colors.primary + '00',
                theme.colors.primary + '10',
                theme.colors.primary + '00',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.templateDivider}
            />
            <View style={styles.templateFooterRow}>
              <Icon
                source={isPremium ? 'shield-check-outline' : 'shield-outline'}
                size={footerIconSize}
                color={theme.colors.primary}
              />
              <Text style={footerTextStyle}>
                MONITOREO FINANCIERO{isPremium ? ' PREMIUM' : ''}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenTemplate: {
    position: 'absolute',
    left: -4000,
    width: 600,
    zIndex: -1,
  },
  flex1: {
    flex: 1,
  },
  shareTemplate: {
    padding: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shareTemplateSquare: {
    width: 600,
    height: 600,
  },
  shareTemplateVertical: {
    width: 600,
    height: 1066,
    paddingVertical: 100,
    paddingHorizontal: 40,
    justifyContent: 'space-around',
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  templateHeader: {
    alignItems: 'center',
    width: '100%',
  },
  platformBadgesContainer: {
    position: 'absolute',
    top: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    zIndex: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  platformText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 4,
  },
  templateMainLogo: {},
  freeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: -8,
    marginTop: -2,
  },
  freeBadgeText: {
    color: 'white',
    fontWeight: '900',
  },
  templateUrlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  templateUrlText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  templateDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 8,
  },
  templateDate: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  templateContent: {
    width: '100%',
  },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
  },
  mainCardVertical: {
    padding: 32,
    borderRadius: 32,
  },
  stockIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  stockIconContainer: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stockSymbolLabel: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stockNameLabel: {
    fontWeight: '700',
    opacity: 0.7,
  },
  priceSection: {
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mainValueText: {
    fontWeight: '900',
    letterSpacing: -2,
  },
  labelColumn: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
  },
  currencyText: {
    fontWeight: '800',
    opacity: 0.8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendPercentText: {
    fontWeight: '900',
  },
  statsGrid: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'space-between',
  },
  statItem: {
    width: '45%',
  },
  statLabel: {
    fontWeight: '900',
    opacity: 0.5,
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    fontWeight: '800',
  },
  statCurrency: {
    opacity: 0.5,
  },
  templateFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  templateDivider: {
    width: '100%',
    height: 1,
    marginBottom: 8,
  },
  templateFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateFooterText: {
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default CurrencyShareGraphic;
