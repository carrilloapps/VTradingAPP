import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, InteractionManager, TouchableOpacity } from 'react-native';
import Share from 'react-native-share';
import { Surface, Text, Icon } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';

import UnifiedHeader from '@/components/ui/UnifiedHeader';
import { useAppTheme } from '@/theme/theme';
import { BolivarIcon } from '@/components/ui/BolivarIcon';
import { CurrencyCodeIcon } from '@/components/ui/CurrencyCodeIcon';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import CustomDialog from '@/components/ui/CustomDialog';
import CustomButton from '@/components/ui/CustomButton';
import CurrencyShareGraphic from '@/components/dashboard/CurrencyShareGraphic';
import CurrencyHistoryChart from '@/components/dashboard/CurrencyHistoryChart';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';
import { StocksService } from '@/services/StocksService';
import { rateHistoryService } from '@/services/RateHistoryService';
import type { HistoryDataPoint } from '@/services/RateHistoryService';
import { getSafeCurrencyCode, getDisplayPair, getDisplayCurrency } from '@/utils/CurrencyUtils';

const CurrencyDetailScreen = ({ route, navigation }: any) => {
  const theme = useAppTheme();
  const { currencyId, rate } = route.params;

  useEffect(() => {
    analyticsService.logScreenView('CurrencyDetail', currencyId);
  }, [currencyId]);

  // Extract a safe currency code for display and logic
  const safeCode = useMemo(() => getSafeCurrencyCode(rate), [rate]);

  // Load currency history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);

        const history = await rateHistoryService.getCurrencyHistory(safeCode, 1, 30);
        setHistoryData(history.history);
      } catch (error) {
        observabilityService.captureError(error, {
          context: 'CurrencyDetailScreen.loadHistory',
          currencyCode: safeCode,
        });
        setHistoryError('No se pudo cargar el historial');
      } finally {
        setHistoryLoading(false);
      }
    };

    InteractionManager.runAfterInteractions(() => {
      loadHistory();
    });
  }, [safeCode]);

  // Zustand store selector
  const user = useAuthStore(state => state.user); // Changed from useAuth
  const showToast = useToastStore(state => state.showToast);

  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<any>(null);

  // History data state
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const isPremium = !!user; // Usuario logueado = Premium

  // Determine if we should auto-invert for border rates with small values
  const isBorderRateWithSmallValue = rate.type === 'border' && rate.value < 1;
  const defaultShowInverse = isBorderRateWithSmallValue;

  // Use showInverse state or default behavior
  const [showInverse, setShowInverse] = useState(defaultShowInverse);

  // Calculate display values based on showInverse toggle
  const displayValue = showInverse && rate.value !== 0 ? 1 / rate.value : rate.value;

  // Determine decimal places based on the ORIGINAL value (not inverted)
  // This ensures consistency: small original values get more decimals
  // For border rates, we always show more precision to reflect market volatility
  const getDecimalPlaces = () => {
    // Border rates always get more precision due to P2P market volatility
    if (rate.type === 'border') {
      const baseValue = rate.value; // Always use the original value
      if (baseValue < 0.01) return 6; // Very small values (e.g., PEN: 0.006313)
      if (baseValue < 1) return 4; // Values between 0.01 and 1
      return 4; // Even large values get 4 decimals (e.g., COP: 6.7234)
    }
    // Non-border rates use standard precision
    return 2;
  };

  // For border rates, value represents VES/Foreign (e.g., 1 VES = 6.72 COP)
  // Without inversion: Shows VES/COP = 6.72 COP ("1 VES = 6.72 COP")
  // With inversion: Shows COP/VES = 0.149 VES ("1 COP = 0.149 VES")
  // For PEN where value = 0.00628: VES/PEN = 0.00628 means "1 VES = 0.00628 PEN"
  // Inverted: PEN/VES = 159.24 means "1 PEN = 159.24 VES"
  const displayPair = getDisplayPair(safeCode, showInverse);

  // The displayCurrency is always the denominator (right side) of the pair
  const displayCurrency = getDisplayCurrency(safeCode, showInverse);

  const isPositive = (rate.changePercent || 0) > 0;
  const isNegative = (rate.changePercent || 0) < 0;

  // Extract custom symbol if iconName follows 'SYMBOL:X' pattern
  const isCustomSymbol = rate.iconName?.startsWith('SYMBOL:');
  const customSymbol = isCustomSymbol ? rate.iconName?.replace('SYMBOL:', '') : null;

  const trendColor = isPositive
    ? theme.colors.trendUp
    : isNegative
      ? theme.colors.trendDown
      : theme.colors.onSurfaceVariant;

  const spread =
    rate.buyValue && rate.sellValue
      ? Math.abs(((rate.sellValue - rate.buyValue) / rate.buyValue) * 100)
      : null;

  const trendIcon = isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'minus';

  const marketStatus = useMemo(() => {
    if (rate.type === 'crypto' || rate.type === 'border') {
      return 'P2P ACTIVO';
    }
    return StocksService.isMarketOpen() ? 'ABIERTO' : 'CERRADO';
  }, [rate.type]);

  const getDynamicShareMessage = useCallback(
    (format: '1:1' | '16:9' | 'text' = '1:1') => {
      const pair = displayPair; // Use the already calculated safe pair
      const changeSign =
        (rate.changePercent || 0) > 0 ? '📈' : (rate.changePercent || 0) < 0 ? '📉' : '📊';
      const changeText = rate.changePercent
        ? (rate.changePercent > 0 ? '+' : '') + rate.changePercent.toFixed(2) + '%'
        : '0.00%';

      if (format === '16:9') {
        // Optimized for Stories: Punchy, direct, optimized for visual overlays
        let msg =
          `📊 *VTrading - Reporte Divisas*\n\n` +
          `📉 *Cotización:* ${pair}\n` +
          `💰 *Valor:* ${rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.\n` +
          `${changeSign} *Variación:* ${changeText}\n`;

        if (spread !== null) {
          msg += `↔️ *Brecha:* ${spread.toFixed(2)}%\n`;
        }

        msg += `🔔 *Mercado:* ${marketStatus}\n\n` + `🌐 vtrading.app`;
        return msg;
      }

      // Default or 1:1: Formal, detailed, structured for permanent posts
      let message =
        `📊 *VTrading - Monitor de Divisas*\n\n` +
        `📌 *Tasa de cambio:* ${pair}\n` +
        `️👁️ *Fuente:* ${rate.source || 'Promedio del Mercado'}\n` +
        `💰 *Valor:* ${rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bolívares\n` +
        `${changeSign} *Variación:* ${changeText}\n`;

      if (spread !== null) {
        message += `↔️ *Brecha (Spread):* ${spread.toFixed(2)}%\n`;
      }

      message +=
        `🕒 *Estado del mercado:* ${marketStatus}\n` +
        `📍 *Act:* ${new Date(rate.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
        `🌐 vtrading.app`;
      return message;
    },
    [rate, spread],
  );

  // Trigger share when sharing state changes and we have a ref
  const captureShareImage = useCallback(async () => {
    try {
      if (!viewShotRef.current) return;

      const uri = await captureRef(viewShotRef.current, {
        format: 'jpg',
        quality: 1.0,
        result: 'tmpfile',
        width: 1080,
        height: shareFormat === '1:1' ? 1080 : 1920,
      });

      if (!uri) throw new Error('Capture failed');

      const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

      await Share.open({
        url: sharePath,
        type: 'image/jpeg',
        message: getDynamicShareMessage(shareFormat),
      });

      analyticsService.logShare(
        'currency',
        safeCode,
        shareFormat === '1:1' ? 'image_square' : 'image_story',
      );
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        observabilityService.captureError(e, {
          context: 'CurrencyDetailScreen.handleShareImage',
          action: 'share_currency_image',
          currencyCode: safeCode,
          format: shareFormat,
          errorMessage: (e as any).message,
        });
        showToast('No se pudo compartir la imagen', 'error');
      }
    } finally {
      setSharing(false);
    }
  }, [rate, shareFormat, showToast, getDynamicShareMessage]);

  // Trigger share when sharing state changes and we have a ref
  useEffect(() => {
    if (sharing && viewShotRef.current) {
      // Wait for next frame/interaction to ensure layout is updated
      const task = InteractionManager.runAfterInteractions(() => {
        captureShareImage();
      });
      return () => task.cancel();
    }
  }, [sharing, captureShareImage]);

  const generateShareImage = (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);
    showToast('Generando imagen para compartir...', 'info');
  };

  const handleShareText = async () => {
    setShareDialogVisible(false);
    try {
      const message = getDynamicShareMessage('text');

      await Share.open({ message });
      analyticsService.logShare('currency', safeCode, 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        observabilityService.captureError(e, {
          context: 'CurrencyDetailScreen.handleShareText',
          action: 'share_currency_text',
          currencyCode: safeCode,
          errorMessage: (e as any).message,
        });
        showToast('Error al compartir texto', 'error');
      }
    }
  };

  const handleShare = () => {
    setShareDialogVisible(true);
  };

  /* Removed redundant spread calculation - moved up to avoid duplication */

  // Pre-calculate dynamic styles
  const containerBgColor = theme.colors.background;
  const haloOpacityValue = theme.dark ? 0.12 : 0.08;
  const iconContainerBg = theme.colors.elevation.level2;
  const iconContainerBorder = theme.colors.outlineVariant;
  const nameTextColor = theme.colors.onSurface;
  const badgeBgColor = theme.colors.primary + '15';
  const badgeTextColor = theme.colors.primary;
  const priceLargeColor = theme.colors.onSurface;
  const trendBgColor = trendColor + (theme.dark ? '30' : '15');
  const sectionTitleColor = theme.colors.onSurfaceVariant;
  const statCardBg = theme.colors.elevation.level1;
  const statCardBorder = theme.colors.outlineVariant;
  const statLabelColor = theme.colors.onSurfaceVariant;
  const statValueColor = theme.colors.onSurface;
  const shareDialogTextColor = theme.colors.onSurfaceVariant;

  const a11yPriceLabel =
    `Tasa actual: ${rate.value.toLocaleString('es-VE')} Bolívares. ` +
    `Variación: ${rate.changePercent ? rate.changePercent.toFixed(2) : 0} por ciento. ` +
    (spread ? `Spread estimado del ${spread.toFixed(2)} por ciento.` : '');

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <UnifiedHeader
        title={displayPair}
        onBackPress={() => navigation.goBack()}
        rightActionIcon="share-variant"
        onActionPress={handleShare}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section - Immersive Design */}
        <View
          style={styles.immersiveHeader}
          accessible={true}
          accessibilityLabel={`${rate.name}. ${a11yPriceLabel}`}
          accessibilityHint="Muestra el detalle del precio actual y su variación"
        >
          <View style={styles.iconWrapper}>
            {/* Halo Glow effect behind the icon */}
            <View
              style={[
                styles.haloEffect,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: haloOpacityValue,
                },
              ]}
            />

            <View
              style={[
                styles.iconContainer,
                styles.borderWidthOne,
                {
                  backgroundColor: iconContainerBg,
                  borderColor: iconContainerBorder,
                },
              ]}
            >
              {rate.iconName === 'Bs' ? (
                <BolivarIcon size={40} color={theme.colors.primary} />
              ) : isCustomSymbol ? (
                <CurrencyCodeIcon code={customSymbol!} size={40} color={theme.colors.primary} />
              ) : (
                <Icon
                  source={rate.iconName || 'currency-usd'}
                  size={40}
                  color={theme.colors.primary}
                />
              )}
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={[styles.name, { color: nameTextColor }]}>
              {rate.name}
            </Text>
            <Surface style={[styles.badgeContainer, { backgroundColor: badgeBgColor }]}>
              <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                {rate.type === 'fiat'
                  ? 'TASA BCV'
                  : rate.type === 'crypto'
                    ? 'CRIPTOACTIVO'
                    : 'TASA FRONTERIZA'}
              </Text>
            </Surface>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.currencyRow}>
              <Text variant="headlineLarge" style={[styles.priceLarge, { color: priceLargeColor }]}>
                {displayValue.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: getDecimalPlaces(),
                })}
              </Text>
              <View style={styles.bolivarIcon}>
                {displayCurrency === 'VES' ? (
                  <BolivarIcon size={28} color={theme.colors.onSurface} />
                ) : isCustomSymbol ? (
                  <CurrencyCodeIcon code={customSymbol!} size={28} color={theme.colors.onSurface} />
                ) : rate.iconName === 'currency-usd' && displayCurrency !== 'USD' ? (
                  <Icon source="currency-usd" size={28} color={theme.colors.onSurface} />
                ) : (
                  <Text style={[styles.currencyCode, { color: theme.colors.onSurface }]}>
                    {displayCurrency}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.trendBadge, { backgroundColor: trendBgColor }]}>
              <MaterialCommunityIcons name={trendIcon} size={20} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {rate.changePercent
                  ? (rate.changePercent > 0 ? '+' : '') + rate.changePercent.toFixed(2) + '%'
                  : '0.00%'}
              </Text>
            </View>

            {/* Toggle button for border rates */}
            {(rate.type === 'border' || isBorderRateWithSmallValue) && (
              <TouchableOpacity
                style={[styles.inverseButton, { backgroundColor: theme.colors.elevation.level2 }]}
                onPress={() => setShowInverse(!showInverse)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="swap-vertical"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={[styles.inverseButtonText, { color: theme.colors.primary }]}>
                  Ver {showInverse ? `VES/${safeCode}` : `${safeCode}/VES`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeader}>
          <Text
            variant="labelLarge"
            style={[
              styles.sectionTitle,
              styles.sectionTitleLetterSpacing,
              { color: sectionTitleColor },
            ]}
          >
            ESTADÍSTICAS DEL DÍA
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
            accessible={true}
            accessibilityLabel={`Precio de compra: ${rate.buyValue || 'No disponible'}`}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons
                name="arrow-down-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                COMPRA
              </Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {rate.buyValue
                  ? rate.buyValue.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })
                  : '--'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>

          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
            accessible={true}
            accessibilityLabel={`Precio de venta: ${rate.sellValue || 'No disponible'}`}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons
                name="arrow-up-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                VENTA
              </Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {rate.sellValue
                  ? rate.sellValue.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })
                  : '--'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>
        </View>

        <View style={styles.statsGrid}>
          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
            accessible={true}
            accessibilityLabel={`Spread: ${spread ? spread.toFixed(2) + '%' : 'No disponible'}`}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={18}
                color={theme.colors.primary}
              />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                BRECHA / SPREAD
              </Text>
            </View>
            <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
              {spread ? `${spread.toFixed(2)}%` : 'N/A'}
            </Text>
          </Surface>

          <Surface
            style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]}
            elevation={0}
            accessible={true}
            accessibilityLabel={`Estado del mercado: ${marketStatus}`}
          >
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="store-outline" size={18} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>
                ESTADO MERCADO
              </Text>
            </View>
            <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
              {marketStatus}
            </Text>
          </Surface>
        </View>

        {/* Technical Placeholder */}
        <View style={styles.sectionHeader}>
          <Text
            variant="labelLarge"
            style={[
              styles.sectionTitle,
              styles.sectionTitleLetterSpacing,
              { color: sectionTitleColor },
            ]}
          >
            EVOLUCIÓN TEMPORAL
          </Text>
        </View>
        <CurrencyHistoryChart
          data={historyData}
          loading={historyLoading}
          error={historyError}
          currencyCode={safeCode}
        />
      </ScrollView>

      {/* Sharing Assets */}
      <CurrencyShareGraphic
        viewShotRef={viewShotRef}
        rate={rate}
        lastUpdated={new Date(rate.lastUpdated).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
        isPremium={isPremium}
        aspectRatio={shareFormat}
        status={marketStatus}
      />

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir tasa"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text
          variant="bodyMedium"
          style={[styles.shareDialogText, { color: shareDialogTextColor }]}
        >
          Comparte el valor de {safeCode} en tus redes sociales
        </Text>

        <View style={styles.shareButtonsGap}>
          <CustomButton
            variant="primary"
            label="Imágen cuadrada"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton
            variant="secondary"
            label="Imágen vertical"
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
    marginBottom: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  haloEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    filter: 'blur(25px)',
    zIndex: -1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chip: {
    borderRadius: 8,
    height: 24,
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
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  trendText: {
    fontWeight: '900',
    fontSize: 18,
  },
  inverseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  inverseButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLarge: {
    fontWeight: '900',
    letterSpacing: -1,
    fontSize: 42,
  },
  sectionTitleLetterSpacing: {
    letterSpacing: 1.5,
  },
  statLabelBold: {
    fontWeight: '700',
  },
  statValueBold: {
    fontWeight: '800',
  },
  shareDialogText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButtonsGap: {
    gap: 12,
  },
  borderWidthOne: {
    borderWidth: 1,
  },
});

export default CurrencyDetailScreen;
