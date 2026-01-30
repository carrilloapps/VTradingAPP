import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { ExchangeCardProps } from './ExchangeCard';

interface ShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  featuredRates: ExchangeCardProps[];
  spread: number | null;
  lastUpdated: string;
  isPremium?: boolean;
  aspectRatio?: '1:1' | '16:9';
}

const ShareGraphic: React.FC<ShareGraphicProps> = ({
  viewShotRef,
  featuredRates,
  spread,
  lastUpdated,
  isPremium = false,
  aspectRatio = '1:1'
}) => {
  const theme = useTheme();
  const isVertical = aspectRatio === '16:9';

  // Dynamic sizes based on aspect ratio
  const platformIconSize = isVertical ? 20 : 16;
  const platformTextSize = isVertical ? 11 : 9;
  const logoWidth = isVertical ? 200 : 160;
  const logoHeight = isVertical ? 52 : 42;
  const freeBadgeTextSize = isVertical ? 9 : 7;
  const urlTextSize = isVertical ? 16 : 13;
  const dateIconSize = isVertical ? 18 : 14;
  const dateTextSize = isVertical ? 13 : 11;
  const cardTitleSize = isVertical ? 18 : 13;
  const cardIconSize = isVertical ? 24 : 20;
  const cardIconContainerSize = isVertical ? 36 : 26;
  const valueSize = isVertical ? 68 : 54;
  const currencySize = isVertical ? 24 : 18;
  const trendIconSize = isVertical ? 18 : 14;
  const trendTextSize = isVertical ? 13 : 11;
  const detailLabelSize = isVertical ? 12 : 10;
  const detailValueSize = isVertical ? 24 : 20;
  const detailCurrencySize = isVertical ? 14 : 12;
  const spreadIconSize = isVertical ? 22 : 18;
  const spreadTextSize = isVertical ? 15 : 12;
  const footerIconSize = isVertical ? 20 : 16;
  const footerTextSize = isVertical ? 11 : 9;

  // Computed Styles
  const templateStyle = [
    styles.shareTemplate,
    aspectRatio === '16:9' ? styles.shareTemplateVertical : styles.shareTemplateSquare,
    { backgroundColor: theme.dark ? '#051911' : '#F0FDF4' }
  ];

  const glowStyle = [styles.templateGlow, styles.templateGlowOpacity, { backgroundColor: theme.colors.primary }];
  const badgeStyle = [styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }];
  const badgeTextStyle = (size: number) => [styles.platformText, { color: theme.colors.onSurfaceVariant, fontSize: size }];

  const logoStyle = [
    styles.templateMainLogo,
    {
      tintColor: theme.dark ? undefined : theme.colors.primary,
      width: logoWidth,
      height: logoHeight
    }
  ];

  const freeBadgeStyle = [styles.freeBadge, { backgroundColor: theme.colors.error }];
  const freeBadgeTextStyle = [styles.freeBadgeText, { fontSize: freeBadgeTextSize }];

  const urlBadgeStyle = [styles.templateUrlBadge, { backgroundColor: theme.colors.primary + '15', marginBottom: 8 }];
  const urlTextStyle = [styles.templateUrlText, { color: theme.colors.primary, fontSize: urlTextSize }];

  const dateTextStyle = [styles.templateDate, { color: theme.colors.onSurfaceVariant, fontSize: dateTextSize }];

  const contentStyle = [
    styles.templateContent,
    aspectRatio === '16:9' && ({ flex: 1, justifyContent: 'center', gap: 24 } as const)
  ];

  const footerTextStyle = [styles.templateFooterText, { color: theme.colors.primary, fontSize: footerTextSize }];

  return (
    <View style={styles.hiddenTemplate} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <LinearGradient
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']}
          style={templateStyle}
        >
          {/* Decorative Elements */}
          <View style={glowStyle} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface style={badgeStyle} elevation={1}>
              <Icon source="google-play" size={platformIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={badgeTextStyle(platformTextSize)}>Android</Text>
            </Surface>
            <View style={styles.flex1} />
            <Surface style={badgeStyle} elevation={1}>
              <Icon source="apple" size={platformIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={badgeTextStyle(platformTextSize)}>iOS</Text>
            </Surface>
          </View>

          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <Image
                source={require('../../assets/images/logotipo.png')}
                style={logoStyle}
                resizeMode="contain"
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
              <Icon source="calendar-clock" size={dateIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={dateTextStyle}>
                {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {lastUpdated}
              </Text>
            </View>
          </View>

          <View style={contentStyle}>
            {featuredRates.map((rate, idx) => {
              const isNeutral = rate.changePercent.includes('0.00');
              const trendColor = isNeutral
                ? theme.colors.onSurfaceVariant
                : (rate.isPositive ? (theme.colors as any).success || '#6EE7B7' : (theme.colors as any).error || '#F87171');
              const trendIcon = isNeutral
                ? 'minus'
                : (rate.isPositive ? 'trending-up' : 'trending-down');

              const cardStyle = [
                styles.templateCard,
                isVertical && styles.templateCardVertical,
                {
                  backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderColor: theme.colors.outlineVariant
                }
              ];
              const cardIconContainerStyle = [
                styles.templateIconSmall,
                {
                  width: cardIconContainerSize,
                  height: cardIconContainerSize,
                  backgroundColor: theme.colors.primary + '20'
                }
              ];
              const cardTitleStyle = [styles.templateCardTitle, { fontSize: cardTitleSize, color: theme.colors.onSurfaceVariant }];
              const valueTextStyle = [styles.templateValue, { fontSize: valueSize, color: theme.colors.onSurface }];
              const valueLabelColumnStyle = [styles.templateValueLabelColumn, { height: valueSize }];
              const currencyTextStyle = [styles.templateCurrency, { fontSize: currencySize, color: theme.colors.onSurfaceVariant }];
              const trendBoxStyle = [styles.templateTrendBox, { backgroundColor: trendColor + '15' }];
              const trendTextStyle = [styles.templateTrendText, { color: trendColor, fontSize: trendTextSize }];

              const detailLabelStyle = [styles.templateDetailLabel, { fontSize: detailLabelSize }];
              const detailValueTextStyle = [styles.templateDetailValue, { fontSize: detailValueSize }];
              const detailCurrencyTextStyle = [styles.templateDetailCurrency, { fontSize: detailCurrencySize }];

              return (
                <Surface key={idx} style={cardStyle} elevation={0}>
                  <View style={[styles.templateCardHeader, isVertical && styles.marginBottom12]}>
                    <View style={cardIconContainerStyle}>
                      <Icon source={rate.code === 'USDT' || rate.title.includes('USDT') ? 'alpha-t-circle-outline' : 'currency-usd'} size={cardIconSize} color={theme.colors.primary} />
                    </View>
                    <Text style={cardTitleStyle}>{rate.title}</Text>
                  </View>

                  <View style={styles.templateValueRow}>
                    <Text style={valueTextStyle}>{rate.value}</Text>
                    <View style={valueLabelColumnStyle}>
                      <Text style={currencyTextStyle}>Bs.</Text>
                      <View style={trendBoxStyle}>
                        <Icon source={trendIcon} size={trendIconSize} color={trendColor} />
                        <Text style={trendTextStyle}>{rate.changePercent}</Text>
                      </View>
                    </View>
                  </View>

                  {isVertical && (rate.buyValue || rate.sellValue) && (
                    <View style={styles.templateVerticalDetails}>
                      <View style={styles.templateDetailItem}>
                        <Text style={detailLabelStyle}>COMPRA</Text>
                        <Text style={detailValueTextStyle}>{rate.buyValue || '--'} <Text style={detailCurrencyTextStyle}>Bs.</Text></Text>
                      </View>
                      <View style={styles.templateVerticalDivider} />
                      <View style={styles.templateDetailItem}>
                        <Text style={detailLabelStyle}>VENTA</Text>
                        <Text style={detailValueTextStyle}>{rate.sellValue || '--'} <Text style={detailCurrencyTextStyle}>Bs.</Text></Text>
                      </View>
                    </View>
                  )}
                </Surface>
              );
            })}

            {spread !== null && (() => {
              const warningColor = (theme.colors as any).warning || '#F59E0B';
              const spreadBoxStyle = [
                styles.templateSpreadBox,
                {
                  backgroundColor: warningColor + '15',
                  borderColor: warningColor + '30'
                }
              ];
              const spreadTextStyle = [styles.templateSpreadText, { color: warningColor, fontSize: spreadTextSize }];

              return (
                <View style={spreadBoxStyle}>
                  <Icon source="swap-horizontal" size={spreadIconSize} color={warningColor} />
                  <Text style={spreadTextStyle}>
                    SPREAD (Diferencia USD vs USDT): <Text style={styles.bold900}>{spread.toFixed(2)}%</Text>
                  </Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.templateFooter}>
            <LinearGradient
              colors={[theme.colors.primary + '00', theme.colors.primary + '10', theme.colors.primary + '00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.templateDivider}
            />
            <View style={styles.templateFooterRow}>
              <Icon source={isPremium ? "shield-check-outline" : "shield-outline"} size={footerIconSize} color={theme.colors.primary} />
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
    left: -2000,
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
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  templateGlowOpacity: {
    opacity: 0.05,
  },
  templateHeader: {
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
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
  templateMainLogo: {
  },
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
  templateDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  templateDate: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  templateContent: {
    width: '100%',
    gap: 10,
  },
  templateCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
  },
  templateCardVertical: {
    padding: 24,
    borderRadius: 28,
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    justifyContent: 'center',
  },
  templateIconSmall: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardTitle: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  templateValue: {
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  templateValueLabelColumn: {
    marginLeft: 6,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 1,
  },
  templateCurrency: {
    fontWeight: '800',
    opacity: 0.8,
    marginBottom: -2,
  },
  templateTrendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  templateTrendText: {
    fontWeight: '800',
  },
  templateSpreadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  templateSpreadText: {
    fontWeight: '600',
  },
  templateFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
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
  templateVerticalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  templateDetailItem: {
    alignItems: 'center',
  },
  templateDetailLabel: {
    fontWeight: '900',
    opacity: 0.6,
    marginBottom: 4,
    letterSpacing: 1,
  },
  templateDetailValue: {
    fontWeight: '800',
  },
  templateDetailCurrency: {
    opacity: 0.6,
  },
  templateVerticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  marginBottom12: {
    marginBottom: 12,
  },
  bold900: {
    fontWeight: '900',
  },
});

export default ShareGraphic;
