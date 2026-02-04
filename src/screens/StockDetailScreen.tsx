import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Share from 'react-native-share';
import { Surface, Text, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import FastImage from 'react-native-fast-image';

import UnifiedHeader from '@/components/ui/UnifiedHeader';
import { useAppTheme } from '@/theme';
import { BolivarIcon } from '@/components/ui/BolivarIcon';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import CustomDialog from '@/components/ui/CustomDialog';
import CustomButton from '@/components/ui/CustomButton';
import StockShareGraphic from '@/components/stocks/StockShareGraphic';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';

const StockDetailScreen = ({ route, navigation }: any) => {
  const theme = useAppTheme();
  const { stock } = route.params; // Get stock object from navigation params

  useEffect(() => {
    analyticsService.logScreenView('StockDetail', stock.id);
  }, [stock.id]);

  // Zustand store selector
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);

  const [isShareDialogVisible, setShareDialogVisible] = React.useState(false);
  const [shareFormat, setShareFormat] = React.useState<'1:1' | '16:9'>('1:1');
  const [_sharing, setSharing] = React.useState(false);
  const viewShotRef = React.useRef<any>(null);

  const isPremium = !!user; // Usuario logueado = Premium

  const isPositive = stock.changePercent > 0;
  const isNegative = stock.changePercent < 0;

  const trendColor = isPositive
    ? theme.colors.trendUp
    : isNegative
      ? theme.colors.trendDown
      : theme.colors.neutral;

  const trendIcon = isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'minus';

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);

    // Wait for layout update
    showToast('Generando imagen para compartir...', 'info');
    await new Promise(resolve => setTimeout(() => resolve(null), 300));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current, {
          format: 'jpg',
          quality: 1.0,
          result: 'tmpfile',
          width: 1080,
          height: format === '1:1' ? 1080 : 1920,
        });

        if (!uri) throw new Error('Capture failed');

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `📊 Revisa el desempeño de ${stock.name} (${stock.symbol}) en tiempo real. ¡Impulsa tus decisiones financieras! 🚀\n\n🌐 vtrading.app`,
        });

        analyticsService.logShare(
          'stock',
          stock.symbol,
          format === '1:1' ? 'image_square' : 'image_story',
        );
      } catch (e) {
        if (
          e &&
          (e as any).message !== 'User did not share' &&
          (e as any).message !== 'CANCELLED'
        ) {
          observabilityService.captureError(e, {
            context: 'StockDetailScreen.generateShareImage',
            action: 'share_stock_image',
            symbol: stock.symbol,
            format: format,
          });
          await analyticsService.logError('stock_share_image', {
            symbol: stock.symbol,
            format,
          });
          showToast('No se pudo compartir la imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    try {
      const message =
        `📊 *VTradingAPP - Mercado Bursátil*\n\n` +
        `📈 *Acción:* ${stock.name} (${stock.symbol})\n` +
        `💰 *Precio:* ${stock.price.toFixed(2)} Bs\n` +
        `📉 *Variación:* ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%\n` +
        `🌐 vtrading.app`;

      await Share.open({ message });
      analyticsService.logShare('stock', stock.symbol, 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        observabilityService.captureError(e, {
          context: 'StockDetailScreen.handleShareText',
          action: 'share_stock_text',
          symbol: stock.symbol,
        });
        showToast('Error al compartir texto', 'error');
      }
    }
  };

  const handleShare = () => {
    setShareDialogVisible(true);
  };

  const averagePrice =
    stock.volumeAmount && stock.volumeShares ? stock.volumeAmount / stock.volumeShares : 0;

  const previousClose = stock.price - (stock.changeAmount || 0);

  const showOpening = stock.opening && stock.opening > 0;
  const primaryStatLabel = showOpening ? 'Apertura' : 'Precio promedio';
  const primaryStatValue = showOpening ? stock.opening : averagePrice;
  const primaryStatIcon = showOpening ? 'clock-outline' : 'scale-balance';

  const formatCompactNumber = (num: number, isCurrency: boolean = false) => {
    if (num >= 1000000) {
      // Supera los 6 dígitos (>= 1,000,000) -> usar acortador
      if (num >= 1000000000) {
        return (
          (num / 1000000000).toLocaleString('es-VE', {
            maximumFractionDigits: 2,
          }) + 'b'
        );
      }
      return (num / 1000000).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + 'm';
    }
    // Menos de 1 millón -> mostrar completo
    // Si es moneda, usar 2 decimales fijos. Si es volumen (acciones), usar 0 decimales (enteros) o 2 si es necesario.
    return num.toLocaleString('es-VE', {
      minimumFractionDigits: isCurrency ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  // Pre-calculate all dynamic styles
  const containerBgColor = theme.colors.background;
  const haloOpacityValue = theme.dark ? 0.15 : 0.1;
  const iconContainerBg = stock.iconUrl
    ? '#FFFFFF'
    : theme.dark
      ? 'rgba(255,255,255,0.05)'
      : 'rgba(0,0,0,0.03)';
  const iconContainerBorderColor = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const initialsColor = trendColor;
  const stockNameColor = theme.colors.onSurface;
  const chipBgColor = theme.colors.elevation.level2;
  const chipTextColor = theme.colors.onSurfaceVariant;
  const priceTextColor = theme.colors.onSurface;
  const trendBgColor = trendColor + (theme.dark ? '30' : '15');
  const trendAmountOpacity = 0.8;
  const sectionTitleColor = theme.colors.onSurfaceVariant;
  const statCardBg = theme.colors.elevation.level1;
  const statCardBorder = theme.colors.outline;
  const statIconBoxBg = theme.colors.surfaceVariant;
  const statLabelColor = theme.colors.onSurfaceVariant;
  const statValueColor = theme.colors.onSurface;
  const chartPlaceholderBg = theme.colors.elevation.level1;
  const chartPlaceholderBorder = theme.colors.outline;
  const chartIconGlowOpacity = 0.05;
  const chartPlaceholderTextColor = theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <UnifiedHeader
        title={stock.symbol}
        onBackPress={() => navigation.goBack()}
        rightActionIcon="share-variant"
        onActionPress={handleShare}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section - Immersive Design */}
        <View style={styles.immersiveHeader}>
          <View style={styles.iconWrapper}>
            {/* Halo Glow effect behind the stock icon */}
            <View
              style={[
                styles.haloEffect,
                { backgroundColor: trendColor, opacity: haloOpacityValue },
              ]}
            />

            <View
              style={[
                styles.iconContainer,
                styles.borderWidthOne,
                {
                  backgroundColor: iconContainerBg,
                  borderColor: iconContainerBorderColor,
                },
              ]}
            >
              {stock.iconUrl ? (
                <FastImage
                  source={{ uri: stock.iconUrl }}
                  style={styles.logoImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ) : (
                <Text style={[styles.initials, { color: initialsColor }]}>
                  {stock.initials || stock.symbol.substring(0, 2)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={[styles.stockName, { color: stockNameColor }]}>
              {stock.name}
            </Text>
            <Chip
              style={[styles.chip, { backgroundColor: chipBgColor }]}
              textStyle={[styles.chipTextStyle, { color: chipTextColor }]}
            >
              {stock.category || 'General'}
            </Chip>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.currencyRow}>
              <Text variant="headlineLarge" style={[styles.priceLarge, { color: priceTextColor }]}>
                {stock.price.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <View style={styles.bolivarIcon}>
                <BolivarIcon size={24} color={theme.colors.onSurface} />
              </View>
            </View>

            <View style={[styles.trendBadge, { backgroundColor: trendBgColor }]}>
              <MaterialCommunityIcons name={trendIcon} size={18} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {isPositive ? '+' : ''}
                {stock.changePercent.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                %
              </Text>
              {stock.changeAmount !== undefined && stock.changeAmount !== 0 && (
                <Text
                  style={[styles.trendAmount, { color: trendColor, opacity: trendAmountOpacity }]}
                >
                  ({isPositive ? '+' : ''}
                  {stock.changeAmount.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  Bs)
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.sectionHeader}>
          <Text
            variant="titleSmall"
            style={[
              styles.sectionTitle,
              styles.sectionTitleLetterSpacing,
              { color: sectionTitleColor },
            ]}
          >
            ESTADÍSTICAS
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: statIconBoxBg }]}>
                <MaterialCommunityIcons
                  name={primaryStatIcon}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                {primaryStatLabel.toUpperCase()}
              </Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {primaryStatValue
                  ? primaryStatValue.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '-'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>

          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: statIconBoxBg }]}>
                <MaterialCommunityIcons name="history" size={18} color={theme.colors.primary} />
              </View>
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                CIERRE ANT.
              </Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {previousClose.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>
        </View>

        <View style={styles.statsGrid}>
          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: statIconBoxBg }]}>
                <MaterialCommunityIcons name="chart-bar" size={18} color={theme.colors.primary} />
              </View>
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                VOL. TÍTULOS
              </Text>
            </View>
            <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
              {stock.volumeShares ? formatCompactNumber(stock.volumeShares) : stock.volume || '-'}
            </Text>
          </Surface>

          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: statIconBoxBg }]}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                VOL. BS
              </Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {stock.volumeAmount ? formatCompactNumber(stock.volumeAmount, true) : '-'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>
        </View>

        {/* Additional Info / Placeholder for Chart */}
        {stock.orderBook && (
          <>
            <View style={styles.sectionHeader}>
              <Text
                variant="titleSmall"
                style={[
                  styles.sectionTitle,
                  styles.sectionTitleLetterSpacing,
                  { color: sectionTitleColor },
                ]}
              >
                LIBRO DE ÓRDENES
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <Surface
                style={[
                  styles.statCard,
                  { backgroundColor: statCardBg, borderColor: statCardBorder },
                ]}
                elevation={0}
              >
                <View style={styles.statHeader}>
                  <View
                    style={[styles.statIconBox, { backgroundColor: theme.colors.trendUp + '20' }]}
                  >
                    <MaterialCommunityIcons
                      name="arrow-up-bold"
                      size={18}
                      color={theme.colors.trendUp}
                    />
                  </View>
                  <Text
                    variant="labelSmall"
                    style={[styles.statLabelBold, { color: statLabelColor }]}
                  >
                    COMPRA
                  </Text>
                </View>
                {stock.orderBook.bid && stock.orderBook.bid.price > 0 ? (
                  <>
                    <View style={styles.statValueRow}>
                      <Text
                        variant="titleMedium"
                        style={[styles.statValueBold, { color: statValueColor }]}
                      >
                        {stock.orderBook.bid.price.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      <BolivarIcon size={14} color={theme.colors.onSurface} />
                    </View>
                    <Text
                      variant="labelSmall"
                      style={[styles.orderBookVolume, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Vol: {formatCompactNumber(stock.orderBook.bid.volume)}
                    </Text>
                  </>
                ) : (
                  <Text
                    variant="titleMedium"
                    style={[styles.statValueBold, { color: statValueColor }]}
                  >
                    -
                  </Text>
                )}
              </Surface>

              <Surface
                style={[
                  styles.statCard,
                  { backgroundColor: statCardBg, borderColor: statCardBorder },
                ]}
                elevation={0}
              >
                <View style={styles.statHeader}>
                  <View
                    style={[styles.statIconBox, { backgroundColor: theme.colors.trendDown + '20' }]}
                  >
                    <MaterialCommunityIcons
                      name="arrow-down-bold"
                      size={18}
                      color={theme.colors.trendDown}
                    />
                  </View>
                  <Text
                    variant="labelSmall"
                    style={[styles.statLabelBold, { color: statLabelColor }]}
                  >
                    VENTA
                  </Text>
                </View>
                {stock.orderBook.ask && stock.orderBook.ask.price > 0 ? (
                  <>
                    <View style={styles.statValueRow}>
                      <Text
                        variant="titleMedium"
                        style={[styles.statValueBold, { color: statValueColor }]}
                      >
                        {stock.orderBook.ask.price.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      <BolivarIcon size={14} color={theme.colors.onSurface} />
                    </View>
                    <Text
                      variant="labelSmall"
                      style={[styles.orderBookVolume, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Vol: {formatCompactNumber(stock.orderBook.ask.volume)}
                    </Text>
                  </>
                ) : (
                  <Text
                    variant="titleMedium"
                    style={[styles.statValueBold, { color: statValueColor }]}
                  >
                    -
                  </Text>
                )}
              </Surface>
            </View>

            {stock.orderBook.negotiated !== undefined && stock.orderBook.negotiated > 0 && (
              <Surface
                style={[
                  styles.negotiatedCard,
                  { backgroundColor: statCardBg, borderColor: statCardBorder },
                ]}
                elevation={0}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: statIconBoxBg }]}>
                    <MaterialCommunityIcons
                      name="handshake"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text
                    variant="labelSmall"
                    style={[styles.statLabelBold, { color: statLabelColor }]}
                  >
                    NEGOCIADOS
                  </Text>
                </View>
                <Text
                  variant="titleMedium"
                  style={[styles.statValueBold, { color: statValueColor }]}
                >
                  {formatCompactNumber(stock.orderBook.negotiated)}
                </Text>
              </Surface>
            )}
          </>
        )}

        {/* Additional Info / Placeholder for Chart */}
        <View style={styles.sectionHeader}>
          <Text
            variant="titleSmall"
            style={[
              styles.sectionTitle,
              styles.sectionTitleLetterSpacing,
              { color: sectionTitleColor },
            ]}
          >
            ANÁLISIS TÉCNICO
          </Text>
        </View>
        <Surface
          style={[
            styles.chartPlaceholder,
            {
              backgroundColor: chartPlaceholderBg,
              borderColor: chartPlaceholderBorder,
            },
          ]}
          elevation={0}
        >
          <View
            style={[
              styles.chartIconGlow,
              {
                backgroundColor: theme.colors.primary,
                opacity: chartIconGlowOpacity,
              },
            ]}
          />
          <MaterialCommunityIcons
            name="chart-timeline-variant"
            size={48}
            color={theme.colors.outline}
          />
          <Text
            variant="bodyMedium"
            style={[styles.chartPlaceholderText, { color: chartPlaceholderTextColor }]}
          >
            Gráfico histórico próximamente
          </Text>
        </Surface>
      </ScrollView>

      {/* Sharing Assets */}
      <StockShareGraphic
        viewShotRef={viewShotRef}
        stock={stock}
        lastUpdated={new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
        isPremium={isPremium}
        aspectRatio={shareFormat}
      />

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir reporte"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text
          variant="bodyMedium"
          style={[styles.shareDialogText, { color: theme.colors.onSurfaceVariant }]}
        >
          Selecciona el formato ideal para compartir los datos de {stock.symbol}
        </Text>

        <View style={styles.shareButtonsGap}>
          <CustomButton
            variant="primary"
            label="Imagen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton
            variant="secondary"
            label="Imagen vertical"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton
            variant="outlined"
            label="Solo texto"
            icon="text-short"
            onPress={handleShareText}
            fullWidth
          />
        </View>
      </CustomDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  immersiveHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  haloEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    filter: 'blur(30px)',
    zIndex: -1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 28,
    fontWeight: '900',
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stockName: {
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  chip: {
    borderRadius: 12,
    height: 28,
  },
  priceContainer: {
    alignItems: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolivarIcon: {
    marginLeft: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  trendText: {
    fontWeight: '900',
    fontSize: 16,
  },
  trendAmount: {
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24, // Matches standard card radius (roundness * 6)
    borderWidth: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartPlaceholder: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  chartIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    filter: 'blur(40px)',
    top: '30%',
  },
  borderWidthOne: {
    borderWidth: 1,
  },
  chipTextStyle: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceLarge: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  sectionTitleLetterSpacing: {
    letterSpacing: 1,
  },
  statLabelBold: {
    fontWeight: '700',
  },
  statValueBold: {
    fontWeight: '800',
  },
  chartPlaceholderText: {
    marginTop: 12,
    fontWeight: '600',
  },
  shareDialogText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButtonsGap: {
    gap: 12,
  },
  orderBookVolume: {
    marginTop: 4,
    fontWeight: '600',
  },
  negotiatedCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
});

export default StockDetailScreen;
