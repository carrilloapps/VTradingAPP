import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import { useTheme, Text } from 'react-native-paper';

import UnifiedHeader from '@/components/ui/UnifiedHeader';
import MarketStatus from '@/components/ui/MarketStatus';
import Calculator from '@/components/dashboard/Calculator';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { useToastStore } from '@/stores/toastStore';
import { observabilityService } from '@/services/ObservabilityService';
import { analyticsService } from '@/services/firebase/AnalyticsService';
import ShareGraphic from '@/components/dashboard/ShareGraphic';
import CustomDialog from '@/components/ui/CustomDialog';
import CustomButton from '@/components/ui/CustomButton';
import { useAuthStore } from '@/stores/authStore';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';
import RatesSection from '@/components/dashboard/RatesSection';
import MarketsSection from '@/components/dashboard/MarketsSection';
import AdvancedCalculatorCTA from '@/components/dashboard/AdvancedCalculatorCTA';

const HomeScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);

  const {
    loading,
    refreshing,
    rates,
    featuredRates,
    spread,
    stocks,
    lastUpdated,
    isMarketOpen,
    onRefresh,
  } = useHomeScreenData();

  const [shareFormat, setShareFormat] = useState<'1:1' | '16:9'>('1:1');
  const [isShareDialogVisible, setShareDialogVisible] = useState(false);
  const [_sharing, setSharing] = useState(false);
  const viewShotRef = React.useRef<any>(null);
  const [isReadyToCapture, setIsReadyToCapture] = useState(false);

  const onShareGraphicReady = useCallback(() => {
    setIsReadyToCapture(true);
  }, []);

  const generateShareImage = async (format: '1:1' | '16:9') => {
    setShareDialogVisible(false);
    setShareFormat(format);
    setSharing(true);
    setIsReadyToCapture(false); // Reset readiness for new format

    showToast('Generando imagen para compartir...', 'info');

    // Wait for the graphic to be ready (layout updated)
    let attempts = 0;
    while (!isReadyToCapture && attempts < 30) {
      // Max 3s wait
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      attempts++;
    }

    // Extra safety buffer for Android surface stability
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));

    if (viewShotRef.current) {
      try {
        const uri = await captureRef(viewShotRef.current);

        if (!uri) throw new Error('Failed to capture image');
        const sharePath = uri.startsWith('file://') ? uri : `file://${uri}`;

        const ratesDetails = featuredRates
          .map(rate => {
            const buyStr = rate.buyValue ? ` (Compra: ${rate.buyValue})` : '';
            const sellStr = rate.sellValue ? ` (Venta: ${rate.sellValue})` : '';
            return `${rate.code === 'USDT' ? '🔶' : '💵'} *${rate.code}:* ${rate.value} Bs${buyStr}${sellStr}`;
          })
          .join('\n');

        const spreadText = spread
          ? spread === 0
            ? `⚖️ *Spread:* ${spread.toFixed(2)}% _(USDT es igual a USD en VES)_\n`
            : spread < 0
              ? `⚖️ *Spread:* ${Math.abs(spread).toFixed(2)}% _(USDT es mayor a USD en VES)_\n`
              : `⚖️ *Spread:* ${Math.abs(spread).toFixed(2)}% _(USD es mayor a USDT en VES)_\n`
          : '';

        const message =
          `📊 *VTrading - Reporte Diario*\n\n` +
          `${ratesDetails}\n` +
          spreadText +
          `⏱️ _Act: ${lastUpdated}_\n\n` +
          `🌐 vtrading.app`;

        await Share.open({
          url: sharePath,
          type: 'image/jpeg',
          message,
        });

        // Cleanup (optional, but good practice if supported by fs, here we assume Share handles it mostly)
        // or rely on OS temp cleanup.

        analyticsService.logShare(
          'dashboard_report',
          'all',
          format === '1:1' ? 'image_square' : 'image_story',
        );
      } catch (e) {
        if (
          e &&
          (e as any).message !== 'User did not share' &&
          (e as any).message !== 'CANCELLED'
        ) {
          observabilityService.captureError(e, {
            context: 'HomeScreen_generateShareImage',
          });
          showToast('Error al compartir imagen', 'error');
        }
      } finally {
        setSharing(false);
      }
    }
  };

  const handleShareText = useCallback(async () => {
    setShareDialogVisible(false);
    try {
      const bcv = rates.find(r => r.code === 'USD');
      const p2p = rates.find(r => r.code === 'USDT');

      // Safe access to values to prevent crashes if rates are missing
      const bcvVal = bcv?.value ? Number(bcv.value).toFixed(2) : 'N/A';
      const p2pVal = p2p?.value ? Number(p2p.value).toFixed(2) : 'N/A';

      const spreadText = spread
        ? spread === 0
          ? `⚖️ *Spread:* ${spread.toFixed(2)}% (USDT es igual a USD en VES)\n`
          : spread < 0
            ? `⚖️ *Spread:* ${Math.abs(spread).toFixed(2)}% (USDT es mayor a USD en VES)\n`
            : `⚖️ *Spread:* ${Math.abs(spread).toFixed(2)}% (USD es mayor a USDT en VES)\n`
        : '';

      const message =
        `📊 *VTrading - Reporte Diario*\n\n` +
        (bcv ? `💵 *USD BCV:* ${bcvVal} Bs\n` : '') +
        (p2p ? `🔶 *USDT P2P:* ${p2pVal} Bs\n` : '') +
        spreadText +
        `⏱️ _Act: ${lastUpdated}_\n\n` +
        `🌐 vtrading.app`;

      await Share.open({ message });
      analyticsService.logShare('dashboard_report', 'all', 'text');
    } catch (e) {
      if (e && (e as any).message !== 'User did not share' && (e as any).message !== 'CANCELLED') {
        showToast('Error al compartir texto', 'error');
      }
    }
  }, [rates, spread, lastUpdated, showToast]);

  const handleShareImage = useCallback(() => {
    setShareDialogVisible(true);
  }, []);

  const userData = useMemo(
    () => ({
      name: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
      avatarUrl: user?.photoURL,
      email: user?.email,
      notificationCount: 3,
      isPremium: !!user, // Usuario logueado = Premium
    }),
    [user],
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />

      <UnifiedHeader
        variant="profile"
        userName={userData.name}
        avatarUrl={userData.avatarUrl}
        email={userData.email}
        notificationCount={userData.notificationCount}
        isPremium={userData.isPremium}
        onProfilePress={() => (navigation as any).navigate('Settings')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        showSecondaryAction
        onSecondaryActionPress={handleShareImage}
        secondaryActionIcon="share-variant"
      />

      <ShareGraphic
        viewShotRef={viewShotRef}
        featuredRates={featuredRates}
        spread={spread}
        lastUpdated={lastUpdated}
        isPremium={userData.isPremium}
        aspectRatio={shareFormat}
        onReady={onShareGraphicReady}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.elevation.level3}
            />
          }
        >
          <MarketStatus
            style={styles.marketStatus}
            status={isMarketOpen ? 'ABIERTO' : 'CERRADO'}
            updatedAt={lastUpdated}
            onRefresh={onRefresh}
          />

          <RatesSection rates={rates} navigation={navigation} />

          <AdvancedCalculatorCTA spread={spread} />

          <MarketsSection stocks={stocks} navigation={navigation} />

          <View style={styles.section}>
            <Calculator />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDialog
        visible={isShareDialogVisible}
        onDismiss={() => setShareDialogVisible(false)}
        title="Compartir reporte"
        showCancel={false}
        confirmLabel="Cerrar"
        onConfirm={() => setShareDialogVisible(false)}
      >
        <Text variant="bodyMedium" style={styles.dialogDescription}>
          Selecciona el formato ideal para compartir en tus redes sociales
        </Text>

        <View style={styles.dialogButtonsContainer}>
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  flex1: { flex: 1 },
  marketStatus: { paddingHorizontal: 22, paddingTop: 15, paddingBottom: 20 },
  dialogDescription: { textAlign: 'center', marginBottom: 20 },
  dialogButtonsContainer: { gap: 12 },
});

export default HomeScreen;
