import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import FastImage from 'react-native-fast-image';

import { StockData } from '@/services/StocksService';
import { getTrend, getTrendColor, getTrendIcon } from '@/utils/trendUtils';

interface MarketShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  indexData: {
    value: string;
    changePercent: string;
    isPositive: boolean;
    volume: string;
  };
  topStocks: StockData[];
  lastUpdated: string;
  isPremium?: boolean;
  aspectRatio?: '1:1' | '16:9';
}

const MarketShareGraphic: React.FC<MarketShareGraphicProps> = ({
  viewShotRef,
  indexData,
  topStocks,
  lastUpdated,
  isPremium = false,
  aspectRatio = '1:1',
}) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const isVertical = aspectRatio === '16:9';

  // Dynamic sizes based on aspect ratio
  const platformIconSize = 24;
  const platformTextSize = 12;
  const logoWidth = isVertical ? 210 : 150;
  const logoHeight = isVertical ? 54 : 40;
  const freeBadgeTextSize = isVertical ? 10 : 7;
  const urlTextSize = isVertical ? 18 : 12;
  const dateIconSize = 18;
  const dateTextSize = 14;
  const sectionLabelSize = isVertical ? 14 : 10;
  const indexValueSize = isVertical ? 72 : 48;
  const indexTrendIconSize = isVertical ? 24 : 18;
  const indexTrendTextSize = isVertical ? 22 : 16;
  const volumeTextSize = isVertical ? 16 : 12;
  const stockSymbolSize = isVertical ? 22 : 16;
  const stockNameSize = isVertical ? 14 : 11;
  const stockPriceSize = isVertical ? 22 : 15;
  const stockTrendSize = isVertical ? 15 : 11;
  const stockLogoSize = isVertical ? 42 : 36;
  const footerIconSize = 22;
  const footerTextSize = 12;

  // Standardized Index Trend
  const idxTrend = getTrend(indexData.changePercent);
  const trendColor = getTrendColor(idxTrend, theme);
  const trendIcon = getTrendIcon(idxTrend);

  return (
    <View
      style={[styles.hiddenTemplate, { height: isVertical ? 600 * (16 / 9) : 600 }]}
      pointerEvents="none"
      collapsable={false}
    >
      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'jpg',
          quality: 0.9,
          width: 1080,
          height: isVertical ? 1920 : 1080,
        }}
      >
        <LinearGradient
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']}
          style={[
            styles.shareTemplate,
            isVertical ? styles.shareTemplateVertical : styles.shareTemplateSquare,
          ]}
        >
          {/* Decorative Elements */}
          <View style={[styles.templateGlow, { backgroundColor: theme.colors.primary }]} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface
              style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={1}
            >
              <Icon
                source="google-play"
                size={platformIconSize}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.platformText,
                  {
                    color: theme.colors.onSurfaceVariant,
                    fontSize: platformTextSize,
                  },
                ]}
              >
                Android
              </Text>
            </Surface>
            <View style={styles.flex1} />
            <Surface
              style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]}
              elevation={1}
            >
              <Icon source="apple" size={platformIconSize} color={theme.colors.onSurfaceVariant} />
              <Text
                style={[
                  styles.platformText,
                  {
                    color: theme.colors.onSurfaceVariant,
                    fontSize: platformTextSize,
                  },
                ]}
              >
                iOS
              </Text>
            </Surface>
          </View>

          {/* Header */}
          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <FastImage
                source={
                  isDark
                    ? require('../../assets/images/logotipo.png')
                    : require('../../assets/images/logotipo-white.png')
                }
                resizeMode={FastImage.resizeMode.contain}
                tintColor={isDark ? '#FFFFFF' : '#212121'}
                style={[
                  styles.templateMainLogo,
                  {
                    width: logoWidth,
                    height: logoHeight,
                  } as any,
                ]}
              />
              {!isPremium && (
                <Surface
                  style={[
                    styles.freeBadge,
                    {
                      backgroundColor: (theme.colors as any).error || '#FF5252',
                    },
                  ]}
                  elevation={2}
                >
                  <Text style={[styles.freeBadgeText, { fontSize: freeBadgeTextSize }]}>FREE</Text>
                </Surface>
              )}
            </View>
            <View
              style={[styles.templateUrlBadge, { backgroundColor: theme.colors.primary + '15' }]}
            >
              <Text
                style={[
                  styles.templateUrlText,
                  { color: theme.colors.primary, fontSize: urlTextSize },
                ]}
              >
                vtrading.app
              </Text>
            </View>
            <View style={styles.templateDateBox}>
              <Icon
                source="calendar-clock"
                size={dateIconSize}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.templateDate,
                  {
                    color: theme.colors.onSurfaceVariant,
                    fontSize: dateTextSize,
                  },
                ]}
              >
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

          {/* Market Index Section */}
          <View style={styles.indexContainer}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontSize: sectionLabelSize,
                },
              ]}
            >
              RESUMEN DEL MERCADO (IBC)
            </Text>
            <View style={styles.indexValueRow}>
              <Text
                style={[
                  styles.indexValue,
                  { color: theme.colors.onSurface, fontSize: indexValueSize },
                ]}
              >
                {indexData.value}
              </Text>
              <View style={[styles.indexTrendBadge, { backgroundColor: trendColor + '15' }]}>
                <Icon source={trendIcon} size={indexTrendIconSize} color={trendColor} />
                <Text
                  style={[
                    styles.indexTrendText,
                    { color: trendColor, fontSize: indexTrendTextSize },
                  ]}
                >
                  {indexData.changePercent}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.volumeText,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontSize: volumeTextSize,
                },
              ]}
            >
              Volumen Efectivo: {indexData.volume} Bs.
            </Text>
          </View>

          {/* Stocks List Content */}
          <View style={[styles.templateContent, isVertical && ({ gap: 12 } as const)]}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: theme.colors.onSurfaceVariant,
                  fontSize: sectionLabelSize,
                },
                styles.mb4,
              ]}
            >
              ACCIONES DESTACADAS
            </Text>
            {(() => {
              const displayCount = isVertical ? 6 : 3;
              const itemsToShow = topStocks.slice(0, displayCount);
              const remainingCount = Math.max(0, topStocks.length - displayCount);

              return (
                <>
                  {itemsToShow.map((stock, idx) => {
                    const sTrend = getTrend(stock.changePercent);
                    const sColor = getTrendColor(sTrend, theme);
                    return (
                      <Surface
                        key={idx}
                        style={[
                          styles.stockCard,
                          theme.dark ? styles.stockCardDark : styles.stockCardLight,
                          { borderColor: theme.colors.outlineVariant },
                          isVertical && styles.stockCardVertical,
                        ]}
                        elevation={0}
                      >
                        <View style={styles.stockLogoContainer}>
                          {stock.iconUrl ? (
                            <FastImage
                              source={{ uri: stock.iconUrl }}
                              style={{
                                width: stockLogoSize,
                                height: stockLogoSize,
                                borderRadius: stockLogoSize / 2,
                              }}
                              resizeMode={FastImage.resizeMode.contain}
                            />
                          ) : (
                            <View
                              style={[
                                styles.stockLogoFallback,
                                {
                                  width: stockLogoSize,
                                  height: stockLogoSize,
                                  borderRadius: stockLogoSize / 2,
                                  backgroundColor:
                                    (theme.colors as any)[stock.color] ||
                                    theme.colors.primaryContainer,
                                },
                              ]}
                            >
                              <Text
                                style={[styles.stockInitials, { fontSize: stockLogoSize * 0.4 }]}
                              >
                                {stock.initials}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.stockInfo}>
                          <Text
                            style={[
                              styles.stockSymbol,
                              {
                                color: theme.colors.onSurface,
                                fontSize: stockSymbolSize,
                              },
                            ]}
                          >
                            {stock.symbol}
                          </Text>
                          <Text
                            style={[
                              styles.stockName,
                              {
                                color: theme.colors.onSurfaceVariant,
                                fontSize: stockNameSize,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {stock.name}
                          </Text>
                        </View>
                        <View style={styles.stockPriceInfo}>
                          <Text
                            style={[
                              styles.stockPrice,
                              {
                                color: theme.colors.onSurface,
                                fontSize: stockPriceSize,
                              },
                            ]}
                          >
                            {stock.price.toLocaleString('es-VE', {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                          <Text
                            style={[styles.stockTrend, { color: sColor, fontSize: stockTrendSize }]}
                          >
                            {stock.changePercent > 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </Text>
                        </View>
                      </Surface>
                    );
                  })}
                  {remainingCount > 0 && (
                    <Text
                      style={[
                        styles.remainingCountText,
                        {
                          color: theme.colors.primary,
                          fontSize: sectionLabelSize,
                        },
                      ]}
                    >
                      + {remainingCount} ACCIONES MÁS DISPONIBLES EN LA APP
                    </Text>
                  )}
                </>
              );
            })()}
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
              <Text
                style={[
                  styles.templateFooterText,
                  { color: theme.colors.primary, fontSize: footerTextSize },
                ]}
              >
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
  shareTemplate: {
    padding: 32,
    paddingBottom: 38,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shareTemplateSquare: {
    width: 600,
    height: 600,
    paddingTop: 24, // Tighter top padding for square
  },
  shareTemplateVertical: {
    width: 600,
    height: 1066,
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 40,
    justifyContent: 'flex-start',
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.05,
  },
  flex1: {
    flex: 1,
  },
  flex1Gap16: {
    flex: 1,
    gap: 16,
  },
  templateHeader: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
    marginBottom: 8,
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
    marginBottom: 10,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 4,
  },
  templateDate: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  indexContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
    marginTop: 0, // Remove default top margin
  },
  sectionLabel: {
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  indexValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indexValue: {
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  indexTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indexTrendText: {
    fontWeight: '900',
  },
  volumeText: {
    fontWeight: '700',
    marginTop: 4,
  },
  templateContent: {
    width: '100%',
  },
  stockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  stockInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stockSymbol: {
    fontWeight: '900',
  },
  stockName: {
    fontWeight: '700',
    opacity: 0.7,
  },
  stockPriceInfo: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontWeight: '800',
  },
  stockTrend: {
    fontWeight: '900',
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
  mb4: {
    marginBottom: 4,
  },
  stockCardDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  stockCardLight: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stockCardVertical: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  stockLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockLogoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInitials: {
    fontWeight: '900',
    color: 'white',
  },
  remainingCountText: {
    textAlign: 'center',
    fontWeight: '900',
    marginTop: 8,
    opacity: 0.8,
  },
});

export default MarketShareGraphic;
