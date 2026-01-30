import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Share from 'react-native-share';
import { Surface, Text, Icon } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/theme';
import { BolivarIcon } from '../components/ui/BolivarIcon';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import CustomDialog from '../components/ui/CustomDialog';
import CustomButton from '../components/ui/CustomButton';
import CurrencyShareGraphic from '../components/dashboard/CurrencyShareGraphic';
import { observabilityService } from '../services/ObservabilityService';
import { analyticsService } from '../services/firebase/AnalyticsService';

/* type CurrencyDetailRouteProp = RouteProp<RootStackParamList, 'CurrencyDetail'>; */

const CurrencyDetailScreen = ({ route, navigation }: any) => { // Changed component signature
  const theme = useAppTheme();
  // const navigation = useNavigation(); // Removed
  // const route = useRoute<CurrencyDetailRouteProp>(); // Removed
  const { currencyId, rate } = route.params; // Added currencyId, kept rate for now as it's used extensively

  useEffect(() => {
    analyticsService.logScreenView('CurrencyDetail', currencyId);
  }, [currencyId]);

  // Zustand store selector
  const user = useAuthStore((state) => state.user); // Changed from useAuth
  const showToast = useToastStore((state) => state.showToast);

  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [, setSharing] = useState(false);
  const viewShotRef = useRef<any>(null);

  const isPremium = !!(user && !user.isAnonymous);

  const isPositive = (rate.changePercent || 0) > 0;
  const isNegative = (rate.changePercent || 0) < 0;

  const trendColor = isPositive
    ? theme.colors.trendUp
    : isNegative
      ? theme.colors.trendDown
      : theme.colors.onSurfaceVariant;

  const trendIcon = isPositive
    ? 'trending-up'
    : isNegative
      ? 'trending-down'
      : 'minus';

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

        if (!uri) throw new Error("Capture failed");

        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message: `Tasa de cambio: ${rate.code}/VES (${rate.name}) - VTrading`,
        });

        analyticsService.logShare('currency', rate.code, format === '1:1' ? 'image_square' : 'image_story');
      } catch (e) {
        if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
          observabilityService.captureError(e, { context: 'CurrencyDetail_generateShareImage' });
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
      const message = `📊 *VTrading - Monitor de Divisas*\n\n` +
        `📉 *Tasa:* ${rate.code} / VES\n` +
        `🏦 *Origen:* ${rate.source || 'Promedio'}\n` +
        `💰 *Valor:* ${rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs\n` +
        `📉 *Cambio:* ${rate.changePercent ? (rate.changePercent > 0 ? '+' : '') + rate.changePercent.toFixed(2) + '%' : '0.00%'}\n` +
        `🌐 vtrading.app`;

      await Share.open({ message });
      analyticsService.logShare('currency', rate.code, 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        showToast('Error al compartir texto', 'error');
      }
    }
  };

  const handleShare = () => {
    setShareDialogVisible(true);
  };

  const spread = (rate.buyValue && rate.sellValue)
    ? Math.abs(((rate.sellValue - rate.buyValue) / rate.buyValue) * 100)
    : null;

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
  const chartPlaceholderBg = theme.colors.elevation.level1;
  const chartPlaceholderBorder = theme.colors.outlineVariant;
  const chartPlaceholderTextColor = theme.colors.onSurfaceVariant;
  const shareDialogTextColor = theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <UnifiedHeader
        title={`${rate.code}/VES`}
        onBackPress={() => navigation.goBack()}
        rightActionIcon="share-variant"
        onActionPress={handleShare}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section - Immersive Design */}
        <View style={styles.immersiveHeader}>
          <View style={styles.iconWrapper}>
            {/* Halo Glow effect behind the icon */}
            <View style={[
              styles.haloEffect,
              { backgroundColor: theme.colors.primary, opacity: haloOpacityValue }
            ]} />

            <View style={[
              styles.iconContainer,
              styles.borderWidthOne,
              {
                backgroundColor: iconContainerBg,
                borderColor: iconContainerBorder,
              }
            ]}>
              {rate.iconName === 'Bs' ? (
                <BolivarIcon size={40} color={theme.colors.primary} />
              ) : (
                <Icon source={rate.iconName || 'currency-usd'} size={40} color={theme.colors.primary} />
              )}
            </View>
          </View>

          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={[styles.name, { color: nameTextColor }]}>{rate.name}</Text>
            <Surface
              style={[styles.badgeContainer, { backgroundColor: badgeBgColor }]}
            >
              <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                {rate.type === 'fiat' ? 'TASA BCV' : rate.type === 'crypto' ? 'CRIPTOACTIVO' : 'TASA FRONTERIZA'}
              </Text>
            </Surface>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.currencyRow}>
              <Text variant="headlineLarge" style={[styles.priceLarge, { color: priceLargeColor }]}>
                {rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.bolivarIcon}>
                <BolivarIcon size={28} color={theme.colors.onSurface} />
              </View>
            </View>

            <View style={[styles.trendBadge, { backgroundColor: trendBgColor }]}>
              <MaterialCommunityIcons name={trendIcon} size={20} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {rate.changePercent ? (rate.changePercent > 0 ? '+' : '') + rate.changePercent.toFixed(2) + '%' : '0.00%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeader}>
          <Text variant="labelLarge" style={[styles.sectionTitle, styles.sectionTitleLetterSpacing, { color: sectionTitleColor }]}>ESTADÍSTICAS DEL DÍA</Text>
        </View>

        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]} elevation={0}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="arrow-down-circle-outline" size={18} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>COMPRA</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {rate.buyValue ? rate.buyValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>

          <Surface style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]} elevation={0}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="arrow-up-circle-outline" size={18} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>VENTA</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
                {rate.sellValue ? rate.sellValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'}
              </Text>
              <BolivarIcon size={14} color={theme.colors.onSurface} />
            </View>
          </Surface>
        </View>

        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]} elevation={0}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>BRECHA / SPREAD</Text>
            </View>
            <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
              {spread ? `${spread.toFixed(2)}%` : 'N/A'}
            </Text>
          </Surface>

          <Surface style={[styles.statCard, { backgroundColor: statCardBg, borderColor: statCardBorder }]} elevation={0}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
              <Text variant="labelSmall" style={[styles.statLabelBold, { color: statLabelColor }]}>ÚLT. ACT.</Text>
            </View>
            <Text variant="titleMedium" style={[styles.statValueBold, { color: statValueColor }]}>
              {new Date(rate.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Surface>
        </View>

        {/* Technical Placeholder */}
        <View style={styles.sectionHeader}>
          <Text variant="labelLarge" style={[styles.sectionTitle, styles.sectionTitleLetterSpacing, { color: sectionTitleColor }]}>EVOLUCIÓN TEMPORAL</Text>
        </View>
        <Surface style={[styles.chartPlaceholder, { backgroundColor: chartPlaceholderBg, borderColor: chartPlaceholderBorder }]} elevation={0}>
          <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={48} color={theme.colors.outline} />
          <Text variant="bodyMedium" style={[styles.chartPlaceholderText, { color: chartPlaceholderTextColor }]}>Gráfico detallado próximamente</Text>
        </Surface>

      </ScrollView>

      {/* Sharing Assets */}
      <CurrencyShareGraphic
        viewShotRef={viewShotRef}
        rate={rate}
        lastUpdated={new Date(rate.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        isPremium={isPremium}
        aspectRatio={shareFormat}
      />

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir tasa"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={[styles.shareDialogText, { color: shareDialogTextColor }]}>
          Comparte el valor de {rate.code} en tus redes sociales
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
  chartPlaceholder: {
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  borderWidthOne: {
    borderWidth: 1,
  },
});

export default CurrencyDetailScreen;
