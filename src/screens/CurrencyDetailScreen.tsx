import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import Share from 'react-native-share';
import { Surface, Text, Chip, Icon } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import UnifiedHeader from '../components/ui/UnifiedHeader';
import { useAppTheme } from '../theme/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BolivarIcon } from '../components/ui/BolivarIcon';
import { useAuth } from '../context/AuthContext';
import CustomDialog from '../components/ui/CustomDialog';
import CustomButton from '../components/ui/CustomButton';
import CurrencyShareGraphic from '../components/dashboard/CurrencyShareGraphic';
import { observabilityService } from '../services/ObservabilityService';
import { useToast } from '../context/ToastContext';

type CurrencyDetailRouteProp = RouteProp<RootStackParamList, 'CurrencyDetail'>;

const CurrencyDetailScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<CurrencyDetailRouteProp>();
  const { rate } = route.params;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [sharing, setSharing] = useState(false);
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
    await new Promise(resolve => setTimeout(() => resolve(null), 400));

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
          message: `Tasa de cambio: ${rate.code}/VES (${rate.name}) - VTrading Monitoring`,
        });
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                  { backgroundColor: theme.colors.primary, opacity: theme.dark ? 0.12 : 0.08 }
                ]} />
                
                <View style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                    borderWidth: 1,
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
                <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onSurface }]}>{rate.name}</Text>
                <Surface 
                  style={[styles.badgeContainer, { backgroundColor: theme.colors.primary + '15' }]}
                >
                  <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                    {rate.type === 'fiat' ? 'TASA BCV' : rate.type === 'crypto' ? 'CRIPTOACTIVO' : 'TASA FRONTERIZA'}
                  </Text>
                </Surface>
            </View>

            <View style={styles.priceContainer}>
                <View style={styles.currencyRow}>
                    <Text variant="headlineLarge" style={{ color: theme.colors.onSurface, fontWeight: '900', letterSpacing: -1, fontSize: 42 }}>
                        {rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.bolivarIcon}>
                        <BolivarIcon size={28} color={theme.colors.onSurface}  />
                    </View>
                </View>
                
                <View style={[styles.trendBadge, { backgroundColor: trendColor + (theme.dark ? '30' : '15') }]}>
                    <MaterialCommunityIcons name={trendIcon} size={20} color={trendColor} />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                        {rate.changePercent ? (rate.changePercent > 0 ? '+' : '') + rate.changePercent.toFixed(2) + '%' : '0.00%'}
                    </Text>
                </View>
            </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeader}>
            <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 }]}>ESTADÍSTICAS DEL DÍA</Text>
        </View>
        
        <View style={styles.statsGrid}>
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="arrow-down-circle-outline" size={18} color={theme.colors.primary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>COMPRA</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                        {rate.buyValue ? rate.buyValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>

            <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="arrow-up-circle-outline" size={18} color={theme.colors.primary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>VENTA</Text>
                </View>
                <View style={styles.statValueRow}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                        {rate.sellValue ? rate.sellValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '--'}
                    </Text>
                    <BolivarIcon size={14} color={theme.colors.onSurface} />
                </View>
            </Surface>
        </View>

        <View style={styles.statsGrid}>
             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.colors.primary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>BRECHA / SPREAD</Text>
                </View>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                    {spread ? `${spread.toFixed(2)}%` : 'N/A'}
                </Text>
            </Surface>

             <Surface style={[styles.statCard, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>ÚLT. ACT.</Text>
                </View>
                 <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                     {new Date(rate.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </Surface>
        </View>

         {/* Technical Placeholder */}
         <View style={styles.sectionHeader}>
            <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 }]}>EVOLUCIÓN TEMPORAL</Text>
        </View>
         <Surface style={[styles.chartPlaceholder, { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant }]} elevation={0}>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, fontWeight: '600' }}>Gráfico detallado próximamente</Text>
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
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 20, color: theme.colors.onSurfaceVariant }}>
          Comparte el valor de {rate.code} en tus redes sociales
        </Text>
        
        <View style={{ gap: 12 }}>
          <CustomButton 
            variant="primary"
            label="Post Cuadrado (IG/WS)"
            icon="view-grid-outline"
            onPress={() => generateShareImage('1:1')}
            fullWidth
          />
          <CustomButton 
            variant="secondary"
            label="Story Vertical (16:9)"
            icon="cellphone"
            onPress={() => generateShareImage('16:9')}
            fullWidth
          />
          <CustomButton 
            variant="outlined"
            label="Solo información de texto"
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
  }
});

export default CurrencyDetailScreen;
