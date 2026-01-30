import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Icon, Surface, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { StockData } from '../../services/StocksService';
import { getTrend, getTrendColor, getTrendIcon } from '../../utils/trendUtils';

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
  aspectRatio = '1:1'
}) => {
  const theme = useTheme();
  const isVertical = aspectRatio === '16:9';

  // Dynamic sizes based on aspect ratio
  const platformIconSize = isVertical ? 18 : 14;
  const platformTextSize = isVertical ? 11 : 9;
  const logoWidth = isVertical ? 180 : 140;
  const logoHeight = isVertical ? 47 : 36;
  const freeBadgeTextSize = isVertical ? 9 : 7;
  const urlTextSize = isVertical ? 16 : 12;
  const dateIconSize = isVertical ? 18 : 14;
  const dateTextSize = isVertical ? 13 : 10;
  const sectionLabelSize = isVertical ? 12 : 10;
  const indexValueSize = isVertical ? 60 : 48;
  const indexTrendIconSize = isVertical ? 22 : 18;
  const indexTrendTextSize = isVertical ? 20 : 16;
  const volumeTextSize = isVertical ? 15 : 12;
  const stockSymbolSize = isVertical ? 20 : 16;
  const stockNameSize = isVertical ? 13 : 11;
  const stockPriceSize = isVertical ? 19 : 15;
  const stockTrendSize = isVertical ? 13 : 11;
  const footerIconSize = isVertical ? 20 : 16;
  const footerTextSize = isVertical ? 11 : 9;

  // Standardized Index Trend
  const idxTrend = getTrend(indexData.changePercent);
  const trendColor = getTrendColor(idxTrend, theme);
  const trendIcon = getTrendIcon(idxTrend);

  return (
    <View style={styles.hiddenTemplate} pointerEvents="none">
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }}>
        <LinearGradient 
          colors={theme.dark ? ['#051911', '#0A0A0A'] : ['#F0FDF4', '#FFFFFF']} 
          style={[
            styles.shareTemplate, 
            isVertical ? styles.shareTemplateVertical : styles.shareTemplateSquare
          ]}
        >
          {/* Decorative Elements */}
          <View style={[styles.templateGlow, { backgroundColor: theme.colors.primary, opacity: 0.05 }]} />

          {/* Platform Badges */}
          <View style={styles.platformBadgesContainer}>
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="google-play" size={platformIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant, fontSize: platformTextSize }]}>Android</Text>
            </Surface>
            <View style={{ flex: 1 }} />
            <Surface style={[styles.platformBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Icon source="apple" size={platformIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.platformText, { color: theme.colors.onSurfaceVariant, fontSize: platformTextSize }]}>iOS</Text>
            </Surface>
          </View>

          {/* Header */}
          <View style={styles.templateHeader}>
            <View style={styles.logoAndBadgeRow}>
              <Image 
                source={require('../../assets/images/logotipo.png')} 
                style={[styles.templateMainLogo, { tintColor: theme.dark ? undefined : theme.colors.primary, width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
              />
              {!isPremium && (
                <Surface style={[styles.freeBadge, { backgroundColor: (theme.colors as any).error || '#FF5252' }]} elevation={2}>
                  <Text style={[styles.freeBadgeText, { fontSize: freeBadgeTextSize }]}>FREE</Text>
                </Surface>
              )}
            </View>
            <View style={[styles.templateUrlBadge, { backgroundColor: theme.colors.primary + '15', marginBottom: 8 }]}>
              <Text style={[styles.templateUrlText, { color: theme.colors.primary, fontSize: urlTextSize }]}>vtrading.app</Text>
            </View>
            <View style={styles.templateDateBox}>
              <Icon source="calendar-clock" size={dateIconSize} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.templateDate, { color: theme.colors.onSurfaceVariant, fontSize: dateTextSize }]}>
                {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {lastUpdated}
              </Text>
            </View>
          </View>
          
          {/* Market Index Section */}
          <View style={styles.indexContainer}>
             <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant, fontSize: sectionLabelSize }]}>RESUMEN DEL MERCADO (IBC)</Text>
             <View style={styles.indexValueRow}>
                <Text style={[styles.indexValue, { color: theme.colors.onSurface, fontSize: indexValueSize }]}>{indexData.value}</Text>
                <View style={[styles.indexTrendBadge, { backgroundColor: trendColor + '15' }]}>
                    <Icon source={trendIcon} size={indexTrendIconSize} color={trendColor} />
                    <Text style={[styles.indexTrendText, { color: trendColor, fontSize: indexTrendTextSize }]}>{indexData.changePercent}</Text>
                </View>
             </View>
             <Text style={[styles.volumeText, { color: theme.colors.onSurfaceVariant, fontSize: volumeTextSize }]}>Volumen Efectivo: {indexData.volume} Bs.</Text>
          </View>

          {/* Stocks List Content */}
          <View style={[styles.templateContent, isVertical && { flex: 1, gap: 16 }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant, fontSize: sectionLabelSize, marginBottom: 4 }]}>ACCIONES DESTACADAS</Text>
            {topStocks.slice(0, isVertical ? 6 : 3).map((stock, idx) => {
               const sTrend = getTrend(stock.changePercent);
               const sColor = getTrendColor(sTrend, theme);
               return (
              <Surface key={idx} style={[styles.stockCard, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <View style={styles.stockInfo}>
                    <Text style={[styles.stockSymbol, { color: theme.colors.onSurface, fontSize: stockSymbolSize }]}>{stock.symbol}</Text>
                    <Text style={[styles.stockName, { color: theme.colors.onSurfaceVariant, fontSize: stockNameSize }]} numberOfLines={1}>{stock.name}</Text>
                </View>
                <View style={styles.stockPriceInfo}>
                    <Text style={[styles.stockPrice, { color: theme.colors.onSurface, fontSize: stockPriceSize }]}>{stock.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
                    <Text style={[styles.stockTrend, { color: sColor, fontSize: stockTrendSize }]}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </Text>
                </View>
              </Surface>
            )})}
          </View>
          
          {/* Footer */}
          <View style={styles.templateFooter}>
            <LinearGradient 
              colors={[theme.colors.primary + '00', theme.colors.primary + '10', theme.colors.primary + '00']} 
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.templateDivider}
            />
            <View style={styles.templateFooterRow}>
              <Icon source={isPremium ? "shield-check-outline" : "shield-outline"} size={footerIconSize} color={theme.colors.primary} />
              <Text style={[styles.templateFooterText, { color: theme.colors.primary, fontSize: footerTextSize }]}>
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
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  templateGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'white', 
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
  }
});

export default MarketShareGraphic;
