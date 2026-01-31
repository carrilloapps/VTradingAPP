import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import FastImage from 'react-native-fast-image';

import { StockData } from '../../services/StocksService';
import { getTrend, getTrendColor, getTrendIcon } from '../../utils/trendUtils';

interface StockShareGraphicProps {
  viewShotRef: React.RefObject<any>;
  stock: StockData;
  lastUpdated: string;
  isPremium?: boolean;
  aspectRatio?: '1:1' | '16:9';
}

const StockShareGraphic: React.FC<StockShareGraphicProps> = ({
  viewShotRef,
  stock,
  lastUpdated,
  isPremium = false,
  aspectRatio = '1:1',
}) => {
  const theme = useTheme();

  const trend = getTrend(stock.changePercent);
  const trendColor = getTrendColor(trend, theme);
  const trendIcon = getTrendIcon(trend);
  const isPositive = trend === 'up';

  const isVertical = aspectRatio === '16:9';

  // Dynamic sizes based on aspect ratio
  const platformIconSize = isVertical ? 18 : 14;
  const platformTextSize = isVertical ? 11 : 9;
  const logoWidth = isVertical ? 200 : 160;
  const logoHeight = isVertical ? 52 : 42;
  const freeBadgeTextSize = isVertical ? 9 : 7;
  const urlTextSize = isVertical ? 16 : 13;
  const dateIconSize = isVertical ? 18 : 14;
  const dateTextSize = isVertical ? 13 : 11;
  const iconContainerSize = isVertical ? 72 : 56;
  const iconSize = isVertical ? 40 : 32;
  const initialsTextSize = isVertical ? 26 : 20;
  const symbolTextSize = isVertical ? 30 : 24;
  const nameTextSize = isVertical ? 18 : 14;
  const mainValueSize = isVertical ? 84 : 64;
  const currencySize = isVertical ? 28 : 22;
  const trendIconSize = isVertical ? 18 : 14;
  const trendTextSize = isVertical ? 15 : 12;
  const changeAmountSize = isVertical ? 18 : 14;
  const statLabelSize = isVertical ? 11 : 9;
  const statValueSize = isVertical ? 20 : 16;
  const statCurrencySize = isVertical ? 12 : 10;
  const footerIconSize = isVertical ? 20 : 16;
  const footerTextSize = isVertical ? 11 : 9;

  const previousClose = stock.price - (stock.changeAmount || 0);
  const averagePrice =
    stock.volumeAmount && stock.volumeShares
      ? stock.volumeAmount / stock.volumeShares
      : 0;

  const formatCompactNumber = (num: number, isCurrency: boolean = false) => {
    if (num >= 1000000) {
      if (num >= 1000000000) {
        return (
          (num / 1000000000).toLocaleString('es-VE', {
            maximumFractionDigits: 2,
          }) + 'b'
        );
      }
      return (
        (num / 1000000).toLocaleString('es-VE', { maximumFractionDigits: 2 }) +
        'm'
      );
    }
    return num.toLocaleString('es-VE', {
      minimumFractionDigits: isCurrency ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View
      style={[
        styles.hiddenTemplate,
        { height: isVertical ? 600 * (16 / 9) : 600 },
      ]}
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
            isVertical
              ? styles.shareTemplateVertical
              : styles.shareTemplateSquare,
          ]}
        >
          {/* Decorative Elements */}
          <View
            style={[
              styles.templateGlow,
              { backgroundColor: theme.colors.primary },
            ]}
          />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface
              style={[
                styles.platformBadge,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
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
              style={[
                styles.platformBadge,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              elevation={1}
            >
              <Icon
                source="apple"
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
                iOS
              </Text>
            </Surface>
          </View>

          {/* Header */}
          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <FastImage
                source={require('../../assets/images/logotipo.png')}
                style={[
                  styles.templateMainLogo,
                  {
                    tintColor: theme.dark ? undefined : theme.colors.primary,
                    width: logoWidth,
                    height: logoHeight,
                  } as any,
                ]}
                resizeMode={FastImage.resizeMode.contain}
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
                  <Text
                    style={[
                      styles.freeBadgeText,
                      { fontSize: freeBadgeTextSize },
                    ]}
                  >
                    FREE
                  </Text>
                </Surface>
              )}
            </View>
            <View
              style={[
                styles.templateUrlBadge,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
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

          {/* Content */}
          <View
            style={[styles.templateContent, isVertical && styles.flex1Gap32]}
          >
            <Surface
              style={[
                styles.mainCard,
                isVertical && styles.mainCardVertical,
                theme.dark ? styles.mainCardDark : styles.mainCardLight,
                { borderColor: theme.colors.outlineVariant },
              ]}
              elevation={0}
            >
              {/* Stock Identification */}
              <View style={styles.stockIdentityRow}>
                <View
                  style={[
                    styles.stockIconContainer,
                    { width: iconContainerSize, height: iconContainerSize },
                    stock.iconUrl
                      ? styles.bgWhite
                      : { backgroundColor: trendColor + '20' },
                  ]}
                >
                  {stock.iconUrl ? (
                    <FastImage
                      source={{ uri: stock.iconUrl }}
                      style={styles.stockIconImage}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  ) : stock.initials ? (
                    <Text
                      style={[
                        styles.stockInitialsText,
                        { color: trendColor, fontSize: initialsTextSize },
                      ]}
                    >
                      {stock.initials}
                    </Text>
                  ) : (
                    <Icon
                      source="chart-box-outline"
                      size={iconSize}
                      color={trendColor}
                    />
                  )}
                </View>
                <View>
                  <Text
                    style={[
                      styles.stockSymbolLabel,
                      {
                        color: theme.colors.onSurface,
                        fontSize: symbolTextSize,
                      },
                    ]}
                  >
                    {stock.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.stockNameLabel,
                      {
                        color: theme.colors.onSurfaceVariant,
                        fontSize: nameTextSize,
                      },
                    ]}
                  >
                    {stock.name}
                  </Text>
                </View>
              </View>

              <View style={styles.priceSection}>
                <View style={styles.valueRow}>
                  <Text
                    style={[
                      styles.mainValueText,
                      {
                        fontSize: mainValueSize,
                        color: theme.colors.onSurface,
                      },
                    ]}
                  >
                    {stock.price.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <View style={[styles.labelColumn, { height: mainValueSize }]}>
                    <Text
                      style={[
                        styles.currencyText,
                        {
                          color: theme.colors.onSurfaceVariant,
                          fontSize: currencySize,
                        },
                      ]}
                    >
                      Bs.
                    </Text>
                    <View
                      style={[
                        styles.trendBadge,
                        { backgroundColor: trendColor + '15' },
                      ]}
                    >
                      <Icon
                        source={trendIcon}
                        size={trendIconSize}
                        color={trendColor}
                      />
                      <Text
                        style={[
                          styles.trendPercentText,
                          { color: trendColor, fontSize: trendTextSize },
                        ]}
                      >
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
                {stock.changeAmount !== undefined && (
                  <Text
                    style={[
                      styles.changeAmountSub,
                      { color: trendColor, fontSize: changeAmountSize },
                    ]}
                  >
                    {isPositive ? '+' : ''}
                    {stock.changeAmount.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Bs. hoy
                  </Text>
                )}
              </View>

              {/* Extra Stats for vertical format */}
              {isVertical && (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text
                      style={[styles.statLabel, { fontSize: statLabelSize }]}
                    >
                      CIERRE ANTERIOR
                    </Text>
                    <Text
                      style={[styles.statValue, { fontSize: statValueSize }]}
                    >
                      {previousClose.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <Text
                        style={[
                          styles.statCurrency,
                          { fontSize: statCurrencySize },
                        ]}
                      >
                        Bs.
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[styles.statLabel, { fontSize: statLabelSize }]}
                    >
                      PRECIO PROMEDIO
                    </Text>
                    <Text
                      style={[styles.statValue, { fontSize: statValueSize }]}
                    >
                      {averagePrice
                        ? averagePrice.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                          })
                        : '--'}{' '}
                      <Text
                        style={[
                          styles.statCurrency,
                          { fontSize: statCurrencySize },
                        ]}
                      >
                        Bs.
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[styles.statLabel, { fontSize: statLabelSize }]}
                    >
                      VOLUMEN TÍTULOS
                    </Text>
                    <Text
                      style={[styles.statValue, { fontSize: statValueSize }]}
                    >
                      {stock.volumeShares
                        ? formatCompactNumber(stock.volumeShares)
                        : stock.volume || '--'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[styles.statLabel, { fontSize: statLabelSize }]}
                    >
                      VOLUMEN EFECTIVO
                    </Text>
                    <Text
                      style={[styles.statValue, { fontSize: statValueSize }]}
                    >
                      {stock.volumeAmount
                        ? formatCompactNumber(stock.volumeAmount, true)
                        : '--'}{' '}
                      <Text
                        style={[
                          styles.statCurrency,
                          { fontSize: statCurrencySize },
                        ]}
                      >
                        Bs.
                      </Text>
                    </Text>
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
    left: -3000, // Further away to avoid overlap
    width: 600,
    zIndex: -1,
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
    opacity: 0.05,
  },
  flex1: {
    flex: 1,
  },
  flex1Gap32: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
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
  stockIconImage: {
    width: '100%',
    height: '100%',
  },
  stockInitialsText: {
    fontWeight: '900',
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
  changeAmountSub: {
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 4,
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
  mainCardDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  mainCardLight: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
  },
});

export default StockShareGraphic;
